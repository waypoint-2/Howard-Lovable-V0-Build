import { NextResponse, type NextRequest } from "next/server"
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
- plainMeaning: 2 sentences MAX plain English
- whyMatters: string array, 2 bullets MAX
- riskLevel: "low" | "medium" | "high"
- favors: e.g. "Licensor" or "Neutral"
- commonness: "Standard" | "Aggressive" | "Favorable"
- definitions: optional, MAX 2 terms, each with { term, plainMeaning (1 sentence), example, importance }
- questions: optional, MAX 1 question with { question, answer, clauseReference }

Be concise. Return ONLY valid JSON. No markdown fences. Return ONLY a valid JSON object starting with {. No markdown, no code fences, no preamble.`

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
      // drop other control chars
    } else {
      fixed += char
    }
  }
  return fixed
}

async function analyzeDocument(
  content: string,
  isBase64: boolean = false,
  mediaType: string = ""
): Promise<{ document_title?: string; clauses: Clause[] }> {
  console.log(`[v0] analyzeDocument: Calling Groq API...`)

  const requestBody = {
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: isBase64
          ? [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mediaType};base64,${content}`,
                },
              },
              {
                type: "text",
                text: userPrompt,
              },
            ]
          : userPrompt,
      },
    ],
    max_tokens: 16000,
    response_format: { type: "json_object" },
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[v0] Groq API error: ${response.status} - ${errorText}`)
    throw new Error(`Groq API error: ${response.status}`)
  }

  const data = await response.json()
  console.log(`[v0] analyzeDocument: Groq responded, stop_reason: ${data.choices?.[0]?.finish_reason}`)

  const message = data.choices?.[0]?.message
  if (!message?.content) {
    throw new Error("No content in Groq response")
  }

  let parsed
  try {
    // Strip code fences if present, sanitize control chars, then parse
    let jsonText = message.content.trim()
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
    else if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
    jsonText = sanitizeJson(jsonText.trim())
    parsed = JSON.parse(jsonText)
  } catch (e) {
    console.error(`[v0] Failed to parse Groq response:`, message.content?.substring(0, 500))
    throw new Error("Failed to parse AI response")
  }

  // Check if response was truncated
  if (data.choices?.[0]?.finish_reason === "length" && parsed.clauses?.length > 0) {
    console.log("[v0] Response was truncated (length), marking last clause")
    parsed.clauses[parsed.clauses.length - 1].truncated = true
  }

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

    let result
    if (fileBase64) {
      console.log(`[v0] Processing base64 file, type: ${fileType}`)
      result = await analyzeDocument(fileBase64, true, fileType || "application/pdf")
    } else {
      console.log(`[v0] Processing text content`)
      result = await analyzeDocument(rawText, false)
    }

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
      } else if (error.message.includes("Groq API error")) {
        errorMessage = "AI service error. Please try again."
        statusCode = 500
      } else {
        errorMessage = `Analysis failed: ${error.message}`
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
