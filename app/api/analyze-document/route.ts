import { NextResponse, type NextRequest } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { GoogleGenAI } from "@google/genai"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
})

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const MAX_WORDS = 5000
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const BATCH_SIZE = 4

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

const outlinePrompt = `Identify all clauses/sections in this legal document. Return a JSON array of objects, each with:
- id: "clause-N" (sequential numbering)
- title: the exact section heading from the document

Return ONLY a valid JSON array starting with [. No markdown, no code fences, no preamble.`

const batchAnalysisPrompt = `Analyze ONLY the following clauses from this legal document. Return a JSON object with:
{
  "clauses": [array of clause objects for the specified clauses ONLY]
}

Each clause object must have:
- id: use the id provided below
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

ANALYZE ONLY THESE CLAUSES:`

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

function buildDocumentParts(
  content: { text?: string; base64?: string; mimeType?: string }
): Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []
  
  if (content.base64 && content.mimeType) {
    parts.push({
      inlineData: {
        mimeType: content.mimeType,
        data: content.base64,
      },
    })
  } else if (content.text) {
    parts.push({ text: content.text })
  }
  
  return parts
}

// Pass 1: Get clause outline
async function getClauseOutline(
  content: { text?: string; base64?: string; mimeType?: string }
): Promise<{ outline: ClauseOutline[]; documentTitle: string }> {
  console.log(`[v0] Pass 1: Getting clause outline...`)

  const documentParts = buildDocumentParts(content)
  const parts = [
    { text: `${systemPrompt}\n\n${outlinePrompt}\n\n--- DOCUMENT START ---` },
    ...documentParts,
    { text: "--- DOCUMENT END ---" },
  ]

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 4000,
    },
  })

  const responseText = response.text
  if (!responseText) throw new Error("No content in outline response")

  console.log(`[v0] Pass 1: Response length: ${responseText.length} chars`)

  const parsed = parseJsonResponse(responseText)
  
  let outline: ClauseOutline[]
  if (Array.isArray(parsed)) {
    outline = parsed as ClauseOutline[]
  } else if (typeof parsed === 'object' && parsed !== null && 'clauses' in parsed) {
    outline = (parsed as { clauses: ClauseOutline[] }).clauses
  } else {
    throw new Error("Invalid outline format")
  }

  // Extract document title from first line if present
  let documentTitle = ""
  if (typeof parsed === 'object' && parsed !== null && 'document_title' in parsed) {
    documentTitle = (parsed as { document_title: string }).document_title
  }

  console.log(`[v0] Pass 1: Found ${outline.length} clauses`)
  return { outline, documentTitle }
}

// Pass 2: Analyze a batch of clauses
async function analyzeBatch(
  content: { text?: string; base64?: string; mimeType?: string },
  batch: ClauseOutline[]
): Promise<Clause[]> {
  const clauseList = batch.map(c => `- ${c.id}: "${c.title}"`).join("\n")
  console.log(`[v0] Pass 2: Analyzing batch of ${batch.length} clauses`)

  const documentParts = buildDocumentParts(content)
  const parts = [
    { text: `${systemPrompt}\n\n${batchAnalysisPrompt}\n${clauseList}\n\nBe concise. Return ONLY valid JSON. No markdown fences.\n\n--- DOCUMENT START ---` },
    ...documentParts,
    { text: "--- DOCUMENT END ---" },
  ]

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 16000,
    },
  })

  const responseText = response.text
  if (!responseText) throw new Error("No content in batch response")

  console.log(`[v0] Pass 2: Batch response length: ${responseText.length} chars`)

  const parsed = parseJsonResponse(responseText)
  
  let clauses: Clause[]
  if (Array.isArray(parsed)) {
    clauses = parsed as Clause[]
  } else if (typeof parsed === 'object' && parsed !== null && 'clauses' in parsed) {
    clauses = (parsed as { clauses: Clause[] }).clauses
  } else {
    throw new Error("Invalid batch response format")
  }

  console.log(`[v0] Pass 2: Batch returned ${clauses.length} clauses`)
  return clauses
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

    // Build content object
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
          // Pass 1: Get clause outline
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

          // Pass 2: Analyze in batches
          const batches: ClauseOutline[][] = []
          for (let i = 0; i < outline.length; i += BATCH_SIZE) {
            batches.push(outline.slice(i, i + BATCH_SIZE))
          }

          console.log(`[v0] Processing ${batches.length} batches of up to ${BATCH_SIZE} clauses each`)

          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i]
            console.log(`[v0] Processing batch ${i + 1}/${batches.length}`)
            
            try {
              const clauses = await analyzeBatch(content, batch)
              
              const batchData = {
                type: "batch",
                batchIndex: i,
                totalBatches: batches.length,
                clauses,
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(batchData)}\n\n`))
            } catch (batchError) {
              console.error(`[v0] Batch ${i + 1} failed:`, batchError)
              const errorData = {
                type: "batch_error",
                batchIndex: i,
                error: batchError instanceof Error ? batchError.message : "Batch analysis failed",
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`))
            }
          }

          // Send completion signal
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
      if (error.message.includes("rate limit") || error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "API rate limit reached. Please try again in a few minutes."
        statusCode = 429
      } else if (error.message.includes("API key")) {
        errorMessage = "AI service configuration error. Please contact support."
        statusCode = 500
      } else {
        errorMessage = `Analysis failed: ${error.message}`
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
