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

const CHUNK_SIZE = 15000 // Characters per chunk
const API_TIMEOUT = 60000 // 60 seconds

// Helper function to extract document title from first heading/line
function extractDocumentTitle(rawText: string): string {
  if (!rawText) return ""
  
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  for (const line of lines.slice(0, 10)) {
    if (line.length < 5 || line.length > 150) continue
    
    if (line === line.toUpperCase() && line.length > 5) {
      return line
    }
    
    if ((line.includes("Agreement") || line.includes("Contract") || 
         line.includes("License") || line.includes("Policy") ||
         line.includes("Terms") || line.includes("Confidentiality") ||
         line.includes("Disclosure") || line.includes("Service")) && 
        line.length > 10) {
      return line
    }
  }
  
  return lines[0] || ""
}

// Split text into chunks at natural boundaries
function splitIntoChunks(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text]
  
  const chunks: string[] = []
  let remaining = text
  
  while (remaining.length > 0) {
    if (remaining.length <= CHUNK_SIZE) {
      chunks.push(remaining)
      break
    }
    
    // Find a good break point (section boundary or paragraph)
    let breakPoint = CHUNK_SIZE
    
    // Look for section boundaries first
    const sectionPatterns = [/\n\d+\.\s+[A-Z]/g, /\nSection\s+\d+/gi, /\nArticle\s+/gi, /\n[A-Z]{3,}[:\s]/g]
    for (const pattern of sectionPatterns) {
      const matches = [...remaining.substring(CHUNK_SIZE * 0.7, CHUNK_SIZE).matchAll(pattern)]
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1]
        breakPoint = Math.floor(CHUNK_SIZE * 0.7) + (lastMatch.index || 0)
        break
      }
    }
    
    // Fallback to paragraph break
    if (breakPoint === CHUNK_SIZE) {
      const paragraphBreak = remaining.lastIndexOf('\n\n', CHUNK_SIZE)
      if (paragraphBreak > CHUNK_SIZE * 0.5) {
        breakPoint = paragraphBreak
      }
    }
    
    chunks.push(remaining.substring(0, breakPoint))
    remaining = remaining.substring(breakPoint).trim()
  }
  
  return chunks
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
- originalText: string, the clause content WITHOUT the section heading/title as the first line (it's shown separately). WITH MARKDOWN FORMATTING:
  - Do NOT include the clause title or heading as the first line
  - Start with the actual content of the clause
  - Use **bold** for defined terms and internal sub-headings
  - Use numbered lists (1. 2. 3.) for numbered provisions
  - Indent lettered sub-clauses: "   (a) text here"
  - Indent roman numerals: "      (i) text here"
  - Preserve paragraph breaks
- plainMeaning: string, 2-3 sentence plain English explanation
- whyMatters: string array, 2-4 practical bullet points
- riskLevel: "low" | "medium" | "high"
- favors: string, e.g. "Licensor" or "Licensee" or "Neutral"
- commonness: "Standard" | "Aggressive" | "Favorable"
- notableCharacteristics: optional string array, 2-3 bullets for medium/high risk clauses only
- definitions: optional array of { term, plainMeaning, example, importance }
- questions: optional array of { question, answer, clauseReference }

Never skip content — every substantive provision must be captured.
The document_title should be the actual heading from the document, not the filename.

Return ONLY valid JSON. No wrapper, no markdown.`

const chunkPrompt = (chunkIndex: number, totalChunks: number) => `Analyze this PART ${chunkIndex + 1} of ${totalChunks} of a legal document. Return a JSON object:
{
  "clauses": [array of clause objects for THIS PART ONLY]
}

Each clause object must have:
- id: string, format "clause-N" (continue numbering from previous parts if applicable)
- clauseNumber: string, format "§ N"
- title: string, original legal heading
- humanTitle: string, max 4 words plain English
- subtitle: string, e.g. "142 words • high risk"
- originalText: string, clause content WITHOUT heading (shown separately). Use markdown:
  - **bold** for defined terms
  - Numbered lists for provisions
  - Indented (a), (b), (i), (ii) for sub-clauses
- plainMeaning: string, 2-3 sentences plain English
- whyMatters: string array, 2-4 bullets
- riskLevel: "low" | "medium" | "high"
- favors: string
- commonness: "Standard" | "Aggressive" | "Favorable"

Return ONLY valid JSON.`

async function analyzeChunk(
  content: Anthropic.ContentBlockParam[],
  isChunk: boolean,
  chunkIndex: number,
  totalChunks: number
): Promise<{ document_title?: string; clauses: Clause[] }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)
  
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            ...content,
            {
              type: "text",
              text: isChunk ? chunkPrompt(chunkIndex, totalChunks) : userPrompt,
            },
          ],
        },
      ],
    })
    
    clearTimeout(timeout)
    
    const textContent = response.content.find((block) => block.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from Claude")
    }
    
    // Strip markdown code fences if present
    let jsonText = textContent.text.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7)
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3)
    }
    jsonText = jsonText.trim()
    
    return JSON.parse(jsonText)
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
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

    const extractedTitle = extractDocumentTitle(rawText || "")
    
    // For PDF/images, use base64 directly (no chunking)
    if (fileBase64) {
      const mediaType = fileType === "application/pdf" ? "application/pdf" : (fileType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
      const content: Anthropic.ContentBlockParam[] = [{
        type: "document",
        source: {
          type: "base64",
          media_type: mediaType,
          data: fileBase64,
        },
      }]
      
      const result = await analyzeChunk(content, false, 0, 1)
      const finalDocumentTitle = result.document_title || extractedTitle || filename
      
      return NextResponse.json({
        documentId,
        filename,
        document_title: finalDocumentTitle,
        clauses: result.clauses,
        analyzedAt: new Date().toISOString(),
      })
    }
    
    // For text content, chunk if needed
    const chunks = splitIntoChunks(rawText)
    const isMultiChunk = chunks.length > 1
    
    let allClauses: Clause[] = []
    let documentTitle = ""
    
    for (let i = 0; i < chunks.length; i++) {
      const content: Anthropic.ContentBlockParam[] = [{
        type: "text",
        text: chunks[i],
      }]
      
      const result = await analyzeChunk(content, isMultiChunk, i, chunks.length)
      
      if (i === 0 && result.document_title) {
        documentTitle = result.document_title
      }
      
      // Renumber clauses for merged output
      const renumberedClauses = result.clauses.map((clause, idx) => ({
        ...clause,
        id: `clause-${allClauses.length + idx + 1}`,
        clauseNumber: `§ ${allClauses.length + idx + 1}`,
      }))
      
      allClauses = [...allClauses, ...renumberedClauses]
    }
    
    const finalDocumentTitle = documentTitle || extractedTitle || filename

    return NextResponse.json({
      documentId,
      filename,
      document_title: finalDocumentTitle,
      clauses: allClauses,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    const errorMessage = error instanceof Error && error.name === "AbortError" 
      ? "Analysis timed out. Please try with a smaller document."
      : "Analysis failed"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
