import { NextResponse, type NextRequest } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 60
export const dynamic = "force-dynamic"

// Inline concurrency limiter (replaces p-limit ESM package)
function createLimiter(concurrency: number) {
  let active = 0
  const queue: (() => void)[] = []
  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = async () => {
        active++
        try { resolve(await fn()) } catch(e) { reject(e) } finally {
          active--
          if (queue.length > 0) queue.shift()!()
        }
      }
      if (active < concurrency) run()
      else queue.push(run)
    })
  }
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
})

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const MAX_WORDS = 5000
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const CONCURRENCY = 1            // Sequential to avoid Anthropic rate limits
const INTER_CLAUSE_DELAY_MS = 800 // Breathing room between sequential Haiku calls

function extractDocumentTitle(rawText: string): string {
  if (!rawText) return ""
  const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)
  for (const line of lines.slice(0, 10)) {
    if (line.length < 5 || line.length > 150) continue
    if (line === line.toUpperCase() && line.length > 5) return line
    if (
      (line.includes("Agreement") || line.includes("Contract") ||
        line.includes("License") || line.includes("Policy") ||
        line.includes("Terms") || line.includes("Confidentiality") ||
        line.includes("Disclosure") || line.includes("Service")) &&
      line.length > 10
    ) return line
  }
  return lines[0] || ""
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

interface ClauseOutline {
  id: string
  title: string
  text?: string
}

interface Clause {
  id: string
  clauseNumber: string
  title: string
  humanTitle: string
  subtitle: string
  originalText: string
  plainMeaning: string
  whyMatters: string[]
  riskLevel: "low" | "medium" | "high"
  favors: string
  commonness: "Standard" | "Aggressive" | "Favorable"
  notableCharacteristics?: string[]
  definitions?: Array<{ term: string; plainMeaning: string; example: string; importance: string }>
  questions?: Array<{ question: string; answer: string; clauseReference: string }>
  truncated?: boolean
}

const systemPrompt = `You are Howard, a legal document analyst. Analyze legal documents clause by clause and return structured JSON helping non-lawyers understand what they are signing. Be precise and plain-spoken. Conservative on risk. Return valid JSON only. No preamble, no markdown fences, just the JSON.`

const outlinePrompt = `You are analyzing a legal document. Identify EVERY clause, section, and article — do not skip any.

Return a JSON array where each element has:
- id: "clause-N" (sequential, starting at clause-1)
- title: the exact heading or section title from the document
- text: the full text content of that clause/section (everything under that heading until the next heading)

Rules:
- Include ALL numbered sections, articles, and clauses — even short ones
- Include subsections if they have distinct headings
- Capture the complete text of each clause in the "text" field
- Aim to find at least 8–20 clauses for a typical legal document
- Do NOT merge sections together

Return ONLY a valid JSON array starting with [. No markdown, no code fences, no preamble.`

const batchAnalysisPrompt = `Analyze the following clause from this legal document. Return a JSON object with the clause analysis (not wrapped in {"clauses": [...]} — just the object directly).

Clause to analyze:

Each clause object must have:
- id: use the id provided
- clauseNumber: "§ N"
- title: original legal heading
- humanTitle: max 4 words plain English
- subtitle: e.g. "142 words • high risk"
- originalText: clause content WITHOUT the section heading as first line. Use markdown: **bold** for defined terms, numbered lists, indented (a) (b) (i) (ii) on separate lines
- plainMeaning: 2 sentences MAX plain English
- whyMatters: string array, 2 bullets MAX
- riskLevel: "low" | "medium" | "high"
- favors: e.g. "Licensor" or "Neutral"
- commonness: "Standard" | "Aggressive" | "Favorable"
- definitions: optional, MAX 2 terms, each with { term, plainMeaning (1 sentence), example, importance }
- questions: optional, MAX 1 question with { question, answer, clauseReference }

ANALYZE ONLY THIS CLAUSE. Return the clause object directly, not wrapped.`

function sanitizeJson(text: string): string {
  let inString = false
  let escaped = false
  let fixed = ""
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const code = char.charCodeAt(0)
    if (escaped) { fixed += char; escaped = false; continue }
    if (char === "\\") { fixed += char; escaped = true; continue }
    if (char === '"') { inString = !inString; fixed += char; continue }
    if (inString && code < 32) {
      if (code === 10) fixed += "\\n"
      else if (code === 13) fixed += "\\r"
      else if (code === 9) fixed += "\\t"
      else if (code === 8) fixed += "\\b"
      else if (code === 12) fixed += "\\f"
    } else {
      fixed += char
    }
  }
  return fixed
}

function parseJsonResponse(responseText: string): unknown {
  let jsonText = responseText.trim()
  if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
  else if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
  if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
  jsonText = sanitizeJson(jsonText.trim())
  return JSON.parse(jsonText)
}

function buildDocumentContentBlocks(
  content: { text?: string; base64?: string; mimeType?: string }
): Anthropic.MessageParam["content"] {
  if (content.base64 && content.mimeType) {
    if (content.mimeType === "application/pdf") {
      return [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: content.base64,
          },
        } as Anthropic.DocumentBlockParam,
        { type: "text", text: `${systemPrompt}\n\n${outlinePrompt}` },
      ]
    }
    // Image types
    if (content.mimeType.startsWith("image/")) {
      return [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: content.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: content.base64,
          },
        } as Anthropic.ImageBlockParam,
        { type: "text", text: `${systemPrompt}\n\n${outlinePrompt}` },
      ]
    }
  }
  // Plain text fallback
  return `${systemPrompt}\n\n${outlinePrompt}\n\n--- DOCUMENT START ---\n${content.text}\n--- DOCUMENT END ---`
}

// Pass 1: Get clause outline
async function getClauseOutline(
  content: { text?: string; base64?: string; mimeType?: string }
): Promise<{ outline: ClauseOutline[]; documentTitle: string }> {
  console.log(`[v0] Pass 1: Getting clause outline via Claude Sonnet...`)

  const messageContent = buildDocumentContentBlocks(content)

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: messageContent }],
  })

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")
  const responseText = textBlock?.text ?? ""
  if (!responseText) throw new Error("No content in outline response")

  console.log(`[v0] Pass 1: Response length: ${responseText.length} chars`)

  const parsed = parseJsonResponse(responseText)

  let outline: ClauseOutline[]
  if (Array.isArray(parsed)) {
    outline = parsed as ClauseOutline[]
  } else if (typeof parsed === "object" && parsed !== null && "clauses" in parsed) {
    outline = (parsed as { clauses: ClauseOutline[] }).clauses
  } else {
    throw new Error("Invalid outline format")
  }

  let documentTitle = ""
  if (typeof parsed === "object" && parsed !== null && "document_title" in parsed) {
    documentTitle = (parsed as { document_title: string }).document_title
  }

  if (outline.length < 3) {
    throw new Error("Document parsing returned too few clauses — possible parsing failure")
  }

  console.log(`[v0] Pass 1: Found ${outline.length} clauses`)
  return { outline, documentTitle }
}

// Pass 2: Analyze a single clause
async function analyzeClause(
  clauseId: string,
  clauseTitle: string,
  clauseText: string,
  clauseIndex: number,
  totalClauses: number
): Promise<Clause> {
  console.log(`[v0] Analyzing clause ${clauseIndex + 1}/${totalClauses}: ${clauseTitle}`)

  const prompt = `${systemPrompt}

Analyze this single clause from a legal document and return a JSON object.

Clause ID: ${clauseId}
Clause Title: ${clauseTitle}
Clause Text:
${clauseText}

${batchAnalysisPrompt}

Return ONLY the JSON object directly. No markdown fences.`

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  })

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")
  const responseText = textBlock?.text ?? ""
  if (!responseText) throw new Error(`No content for ${clauseId}`)

  const parsed = parseJsonResponse(responseText) as Clause
  if (!parsed.id) parsed.id = clauseId
  if (!parsed.clauseNumber) parsed.clauseNumber = `§ ${clauseIndex + 1}`
  return parsed
}

// Classify Anthropic errors for targeted logging
function classifyError(error: unknown): { type: string; isRateLimit: boolean; isTimeout: boolean } {
  const msg = error instanceof Error ? error.message : String(error)
  const isRateLimit =
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("too many requests") ||
    (error instanceof Error && error.name === "RateLimitError")
  const isTimeout = msg.includes("timeout") || msg.includes("ETIMEDOUT") || msg.includes("abort")
  const isOverloaded = msg.includes("overloaded") || msg.includes("529") || msg.includes("503")
  const type = isRateLimit ? "RATE_LIMIT" : isTimeout ? "TIMEOUT" : isOverloaded ? "OVERLOADED" : "API_ERROR"
  return { type, isRateLimit, isTimeout }
}

// Retry wrapper with timeout
async function analyzeClauseWithRetry(
  clauseId: string,
  clauseTitle: string,
  clauseText: string,
  clauseIndex: number,
  totalClauses: number,
  maxRetries: number = 3
): Promise<Clause> {
  const TIMEOUT_MS = 20000 // Reduced from 25s so retries fit within the function's 60s budget
  const clauseStart = Date.now()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptStart = Date.now()
    try {
      console.log(`[v0] Clause ${clauseId} (${clauseIndex + 1}/${totalClauses}) attempt ${attempt}/${maxRetries} starting`)

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Clause analysis timeout")), TIMEOUT_MS)
      )

      const result = await Promise.race([
        analyzeClause(clauseId, clauseTitle, clauseText, clauseIndex, totalClauses),
        timeoutPromise,
      ])

      const elapsed = Date.now() - clauseStart
      console.log(`[v0] Clause ${clauseId} succeeded on attempt ${attempt} in ${elapsed}ms`)
      return result
    } catch (error) {
      const { type, isRateLimit } = classifyError(error)
      const attemptMs = Date.now() - attemptStart
      const totalMs = Date.now() - clauseStart
      const msg = error instanceof Error ? error.message : String(error)

      if (attempt === maxRetries) {
        console.error(
          `[v0] Clause ${clauseId} FAILED permanently after ${maxRetries} attempts (${totalMs}ms total). ` +
          `Error type: ${type}. Last error: ${msg}`
        )
        throw error
      }

      // Backoff: 4s after attempt 1, 8s after attempt 2 (longer than before to clear rate limits)
      const delayMs = 4000 * attempt
      console.warn(
        `[v0] Clause ${clauseId} attempt ${attempt} failed in ${attemptMs}ms. ` +
        `Error type: ${type}. Message: ${msg}. ` +
        `Retrying in ${delayMs / 1000}s... (isRateLimit=${isRateLimit})`
      )
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  throw new Error(`Failed to analyze clause ${clauseId} after ${maxRetries} attempts`)
}

export async function POST(request: NextRequest) {
  console.log("[v0] POST /api/analyze-document: Starting streaming analysis...")

  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const { success } = await ratelimit.limit(ip)

    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded. Maximum 10 analyses per hour." }, { status: 429 })
    }

    const body = await request.json()
    const { rawText, fileBase64, fileType, filename, documentId, fileSize } = body

    if (!rawText && !fileBase64) {
      return NextResponse.json({ error: "No document content provided" }, { status: 400 })
    }

    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: "This document is too large for a free analysis. Upload a shorter document or upgrade to Howard Pro for full analysis of large documents."
      }, { status: 413 })
    }

    if (rawText) {
      const wordCount = countWords(rawText)
      if (wordCount > MAX_WORDS) {
        return NextResponse.json({
          error: "This document is too large for a free analysis. Upload a shorter document or upgrade to Howard Pro for full analysis of large documents."
        }, { status: 413 })
      }
    }

    const extractedTitle = extractDocumentTitle(rawText || "")

    const content: { text?: string; base64?: string; mimeType?: string } = {}
    if (fileBase64 && fileType) {
      content.base64 = fileBase64
      content.mimeType = fileType
    } else {
      content.text = rawText
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // Pass 1: Get clause outline (Claude Sonnet)
          const { outline, documentTitle } = await getClauseOutline(content)
          const finalTitle = documentTitle || extractedTitle || filename

          // Send initial metadata
          const metadata = {
            type: "metadata",
            documentId,
            filename,
            document_title: finalTitle,
            totalClauses: outline.length,
            analyzedAt: new Date().toISOString(),
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`))

          // Pass 2: Analyze clauses in parallel (Claude Haiku, concurrency 3)
          const limit = createLimiter(CONCURRENCY)
          console.log(`[v0] Starting analysis of ${outline.length} clauses with concurrency ${CONCURRENCY}`)

          const tasks = outline.map((clause, index) =>
            limit(async () => {
              // Stagger sequential Haiku calls to avoid rate limit bursts
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, INTER_CLAUSE_DELAY_MS))
              }
              try {
                const result = await analyzeClauseWithRetry(
                  clause.id,
                  clause.title,
                  clause.text || clause.title,
                  index,
                  outline.length
                )
                try {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "clause", clause: result })}\n\n`))
                } catch {}
              } catch (err) {
                const { type } = classifyError(err)
                const msg = err instanceof Error ? err.message : String(err)
                console.error(`[v0] Clause ${clause.id} permanently failed. Error type: ${type}. Message: ${msg}`)
                try {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "clause_error", clauseId: clause.id, errorType: type })}\n\n`))
                } catch {}
              }
            })
          )

          await Promise.all(tasks)
          console.log(`[v0] All clauses analyzed`)

          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (error) {
          console.error("[v0] Streaming error:", error)
          const errorData = {
            type: "error",
            error: error instanceof Error ? error.message : "Analysis failed",
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    let errorMessage = "Analysis failed"
    let statusCode = 500
    if (error instanceof Error) {
      if (error.message.includes("rate limit") || error.message.includes("429") || error.message.includes("overloaded")) {
        errorMessage = "API rate limit reached. Please try again in a few minutes."
        statusCode = 429
      } else if (error.message.includes("API key") || error.message.includes("authentication")) {
        errorMessage = "AI service configuration error. Please contact support."
        statusCode = 500
      } else {
        errorMessage = `Analysis failed: ${error.message}`
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
