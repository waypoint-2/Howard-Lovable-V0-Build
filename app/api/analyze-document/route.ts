import { NextResponse, type NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_WORDS = 5000
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

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

function sanitizeJson(jsonText: string): string {
  let inString = false
  let escaped = false
  let fixed = ""
  for (let i = 0; i < jsonText.length; i++) {
    const char = jsonText[i]
    const code = char.charCodeAt(0)
    if (escaped) {
      fixed += char
      escaped = false
      continue
    }
    if (char === "\\") {
      fixed += char
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      fixed += char
      continue
    }
    if (inString && code < 32) {
      if (code === 10) fixed += "\\n"
      else if (code === 13) fixed += "\\r"
      else if (code === 9) fixed += "\\t"
      else if (code === 8) fixed += "\\b"
      else if (code === 12) fixed += "\\f"
      // drop all other control chars
    } else {
      fixed += char
    }
  }
  return fixed
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
}

const systemPrompt = `You are Howard, a legal document analyst. Analyze legal documents clause by clause and return structured JSON helping non-lawyers understand what they are signing. Be precise and plain-spoken. Conservative on risk. Return valid JSON only. No preamble, no markdown fences, just the JSON object.`

const userPrompt = `Analyze this legal document and return a JSON object:
{
  "document_title": "actual document title/heading from the document",
  "clauses": [array of clause objects]
}

Each clause object must have:
- id: "clause-N"
- clauseNumber: "§ N"
- title: original legal heading
- humanTitle: max 4 words plain English
- subtitle: e.g. "142 words • high risk"
- originalText: clause content WITHOUT the section heading as first line. Use markdown: **bold** for defined terms, numbered lists, indented (a) (b) (i) (ii) on separate lines
- plainMeaning: 2-3 sentence plain English
- whyMatters: string array, 2-4 bullets
- riskLevel: "low" | "medium" | "high"
- favors: e.g. "Licensor" or "Neutral"
- commonness: "Standard" | "Aggressive" | "Favorable"
- notableCharacteristics: optional string array
- definitions: optional array of { term, plainMeaning, example, importance }
- questions: optional array of { question, answer, clauseReference }

Return ONLY valid JSON. No markdown fences.`

async function analyzeDocument(
  content: Anthropic.ContentBlockParam[]
): Promise<{ document_title?: string; clauses: Clause[] }> {
  console.log(`[v0] analyzeDocument: Calling Claude API...`)

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 6000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          ...content,
          { type: "text", text: userPrompt },
        ],
      },
    ],
  })

  console.log(`[v0] analyzeDocument: Claude responded, stop_reason: ${response.stop_reason}`)

  const textContent = response.content.find((block) => block.type === "text")
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude")
  }

  console.log(`[v0] analyzeDocument: Response length: ${textContent.text.length} chars`)

  // Strip markdown code fences if Claude added them despite instructions
  let jsonText = textContent.text.trim()
  if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
  else if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
  if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
  jsonText = jsonText.trim()

  // Sanitize control characters inside string values before parsing
  jsonText = sanitizeJson(jsonText)

  console.log(`[v0] analyzeDocument: Parsing JSON...`)
  const parsed = JSON.parse(jsonText)
  console.log(`[v0] analyzeDocument: Parsed successfully, clauses: ${parsed.clauses?.length || 0}`)
  return parsed
}

export async function POST(request: NextRequest) {
  console.log("[v0] POST /api/analyze-document: Starting...")

  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    console.log(`[v0] Rate limit check for IP: ${ip}`)
    const { success } = await ratelimit.limit(ip)

    if (!success) {
      console.log("[v0] Rate limit exceeded")
      return NextResponse.json({ error: "Rate limit exceeded. Maximum 10 analyses per hour." }, { status: 429 })
    }

    const body = await request.json()
    const { rawText, fileBase64, fileType, filename, documentId, fileSize } = body
    console.log(`[v0] Received: filename=${filename}, hasRawText=${!!rawText}, hasBase64=${!!fileBase64}, textLength=${rawText?.length || 0}`)

    if (!rawText && !fileBase64) {
      return NextResponse.json({ error: "No document content provided" }, { status: 400 })
    }

    // Check document size limits
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      console.log(`[v0] File too large: ${fileSize} bytes`)
      return NextResponse.json({
        error: "This document is too large for a free analysis. Upload a shorter document or upgrade to Howard Pro for full analysis of large documents."
      }, { status: 413 })
    }

    if (rawText) {
      const wordCount = countWords(rawText)
      console.log(`[v0] Word count: ${wordCount}`)
      if (wordCount > MAX_WORDS) {
        console.log(`[v0] Document too long: ${wordCount} words`)
        return NextResponse.json({
          error: "This document is too large for a free analysis. Upload a shorter document or upgrade to Howard Pro for full analysis of large documents."
        }, { status: 413 })
      }
    }

    const extractedTitle = extractDocumentTitle(rawText || "")
    console.log(`[v0] Extracted title: ${extractedTitle}`)

    let content: Anthropic.ContentBlockParam[]

    // PDF/images — send as base64 directly
    if (fileBase64) {
      console.log(`[v0] Processing base64 file, type: ${fileType}`)
      const mediaType = fileType === "application/pdf"
        ? "application/pdf"
        : (fileType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
      content = [{
        type: "document",
        source: { type: "base64", media_type: mediaType, data: fileBase64 },
      }]
    } else {
      // Text content
      console.log(`[v0] Processing text content`)
      content = [{ type: "text", text: rawText }]
    }

    const result = await analyzeDocument(content)
    console.log(`[v0] Analysis complete, clauses: ${result.clauses?.length || 0}`)

    return NextResponse.json({
      documentId,
      filename,
      document_title: result.document_title || extractedTitle || filename,
      clauses: result.clauses,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    let errorMessage = "Analysis failed"
    let statusCode = 500
    if (error instanceof Error) {
      console.error(`[v0] Error: ${error.name} - ${error.message}`)
      if (error.message.includes("rate limit") || error.message.includes("429")) {
        errorMessage = "API rate limit reached. Please try again in a few minutes."
        statusCode = 429
      } else if (error.message.includes("credit") || error.message.includes("billing")) {
        errorMessage = "API billing issue. Please check your Anthropic account."
        statusCode = 402
      } else if (error.message.includes("JSON") || error.message.includes("control character")) {
        errorMessage = "Failed to parse AI response. Please try again."
      } else {
        errorMessage = `Analysis failed: ${error.message}`
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
