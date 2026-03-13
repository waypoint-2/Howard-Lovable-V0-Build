import { NextResponse, type NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initialize rate limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 analyses per hour per IP
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Helper function to extract document title from first heading/line
function extractDocumentTitle(rawText: string): string {
  if (!rawText) return ""
  
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  // Look for lines that are all caps or look like titles
  for (const line of lines.slice(0, 10)) {
    // Skip very short lines and common headers
    if (line.length < 5 || line.length > 150) continue
    
    // All caps title (e.g., "NON-DISCLOSURE AGREEMENT")
    if (line === line.toUpperCase() && line.length > 5) {
      return line
    }
    
    // Title case with common legal doc keywords
    if ((line.includes("Agreement") || line.includes("Contract") || 
         line.includes("License") || line.includes("Policy") ||
         line.includes("Terms") || line.includes("Confidentiality") ||
         line.includes("Disclosure") || line.includes("Service")) && 
        line.length > 10) {
      return line
    }
  }
  
  // Fallback to first substantial line
  return lines[0] || ""
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
  definitions?: Array<{
    term: string
    plainMeaning: string
    example: string
    importance: string
  }>
  questions?: Array<{
    question: string
    answer: string
    clauseReference: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const { success } = await ratelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 analyses per hour." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { rawText, fileBase64, fileType, filename, documentId } = body

    if (!rawText && !fileBase64) {
      return NextResponse.json(
        { error: "No document content provided" },
        { status: 400 }
      )
    }

    console.log(`[v0] Analyzing document: ${filename}`)

    // Extract document title from the first line/heading
    const extractedTitle = extractDocumentTitle(rawText || "")

    const systemPrompt = `You are Howard, a legal document analyst. Analyze legal documents clause by clause and return structured JSON helping non-lawyers understand what they are signing. Be precise and plain-spoken. Conservative on risk — better to flag medium than miss it. Return valid JSON only. No preamble, no markdown, just the JSON object.`

    const userPrompt = `Analyze this legal document and return a JSON object with this top-level structure:
{
  "document_title": "string - the actual document title/heading from the document",
  "clauses": [array of clause objects]
}

Each clause object must have EXACTLY these fields:

- id: string, format "clause-N"
- clauseNumber: string, format "§ N"
- title: string, original legal heading
- humanTitle: string, max 4 words plain English title
- subtitle: string, e.g. "142 words • high risk"
- originalText: string, full original clause text WITH MARKDOWN FORMATTING PRESERVED:
  - Use **bold** for section headings and defined terms
  - Use numbered lists (1. 2. 3.) for numbered provisions
  - Indent lettered sub-clauses on separate lines: "   (a) text here"
  - Indent roman numerals further: "      (i) text here"
  - Preserve paragraph breaks with blank lines
  - Keep the original text but add markdown to maintain structure
- plainMeaning: string, 2-3 sentence plain English explanation
- whyMatters: string array, 2-4 practical bullet points
- riskLevel: "low" | "medium" | "high"
- favors: string, e.g. "Licensor" or "Licensee" or "Neutral"
- commonness: "Standard" | "Aggressive" | "Favorable"
- notableCharacteristics: optional string array, 2-3 bullets for medium/high risk clauses only
- definitions: optional array of { term, plainMeaning, example, importance } for key legal terms in this clause
- questions: optional array of { question, answer, clauseReference }, 1-2 questions a non-lawyer would ask

If the document has no clearly numbered clauses, identify logical sections yourself and number them sequentially. Never skip content — every substantive provision must be captured.

The document_title should be the actual heading or title from the document (like 'NON-DISCLOSURE AGREEMENT', 'SOFTWARE LICENSE', etc.), not the filename.

Return ONLY valid JSON. No wrapper, no markdown.`

    // Build the message with appropriate content type
    const messageContent: Anthropic.ContentBlockParam[] = []

    if (rawText) {
      messageContent.push({
        type: "text",
        text: rawText,
      })
    } else if (fileBase64) {
      const mediaType = fileType === "application/pdf" ? "application/pdf" : (fileType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
      messageContent.push({
        type: "document",
        source: {
          type: "base64",
          media_type: mediaType,
          data: fileBase64,
        },
      })
    }

    messageContent.push({
      type: "text",
      text: userPrompt,
    })

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
    })

    // Extract the text content from the response
    const textContent = response.content.find((block) => block.type === "text")
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No text response from Claude" },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let parsedResponse: { document_title: string; clauses: Clause[] }
    try {
      parsedResponse = JSON.parse(textContent.text)
    } catch (parseError) {
      console.error("[v0] Failed to parse Claude response:", textContent.text)
      return NextResponse.json(
        { error: "Analysis failed" },
        { status: 500 }
      )
    }

    const { document_title, clauses } = parsedResponse
    const finalDocumentTitle = document_title || extractedTitle || filename

    return NextResponse.json({
      documentId,
      filename,
      document_title: finalDocumentTitle,
      clauses,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    )
  }
}
