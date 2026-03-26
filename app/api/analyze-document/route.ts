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
    } else {
      fixed += char
    }
  }
  return fixed
}

async function analyzeWithGemini(
  content: { text?: string; base64?: string; mimeType?: string }
): Promise<{ document_title?: string; clauses: Clause[]; wasTruncated: boolean }> {
  console.log(`[v0] analyzeWithGemini: Calling Gemini API...`)

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  // Add the prompt
  parts.push({ text: `${systemPrompt}\n\n${userPrompt}\n\n--- DOCUMENT START ---` })

  // Add document content
  if (content.base64 && content.mimeType) {
    console.log(`[v0] Sending as inline base64, mimeType: ${content.mimeType}`)
    parts.push({
      inlineData: {
        mimeType: content.mimeType,
        data: content.base64,
      },
    })
  } else if (content.text) {
    console.log(`[v0] Sending as plain text, length: ${content.text.length}`)
    parts.push({ text: content.text })
  }

  parts.push({ text: "--- DOCUMENT END ---" })

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 32000,
    },
  })

  const finishReason = response.candidates?.[0]?.finishReason
  console.log(`[v0] analyzeWithGemini: Gemini responded, finishReason: ${finishReason}`)

  const responseText = response.text
  if (!responseText) {
    throw new Error("No content in Gemini response")
  }

  console.log(`[v0] analyzeWithGemini: Response length: ${responseText.length} chars`)

  const wasTruncated = finishReason === "MAX_TOKENS" || finishReason === "LENGTH"
  
  let parsed
  try {
    let jsonText = responseText.trim()
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7)
    else if (jsonText.startsWith("```")) jsonText = jsonText.slice(3)
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3)
    jsonText = sanitizeJson(jsonText.trim())
    
    const rawParsed = JSON.parse(jsonText)
    
    // Handle both formats: plain array or wrapped object with clauses property
    if (Array.isArray(rawParsed)) {
      parsed = { clauses: rawParsed }
    } else if (rawParsed.clauses && Array.isArray(rawParsed.clauses)) {
      parsed = rawParsed
    } else {
      throw new Error("Response is neither an array nor has a clauses property")
    }
  } catch (e) {
    console.error(`[v0] Failed to parse Gemini response:`, responseText.substring(0, 500))
    throw new Error("Failed to parse AI response")
  }
  
  console.log(`[v0] analyzeWithGemini: Parsed successfully, clauses: ${parsed.clauses?.length || 0}, truncated: ${wasTruncated}`)
  return { ...parsed, wasTruncated }
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
    
    // For PDFs and images, send as base64 inline data
    if (fileBase64 && fileType) {
      console.log(`[v0] Processing base64 file, type: ${fileType}`)
      result = await analyzeWithGemini({
        base64: fileBase64,
        mimeType: fileType,
      })
    } else {
      // For DOCX/TXT, send as plain text
      console.log(`[v0] Processing text content, length: ${rawText?.length || 0}`)
      result = await analyzeWithGemini({ text: rawText })
    }

    // If response was truncated, mark the last clause
    if (result.wasTruncated && result.clauses?.length > 0) {
      console.log("[v0] Response was truncated, marking last clause")
      result.clauses[result.clauses.length - 1].truncated = true
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
