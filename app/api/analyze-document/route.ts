import { NextResponse, type NextRequest } from "next/server"
import { generateText, Output } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Rate limiting setup
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 analyses per hour
})

// Schema for the analysis output
const clauseSchema = z.object({
  title: z.string(),
  clauseNumber: z.string(),
  originalText: z.string(),
  plainMeaning: z.string(),
  whyMatters: z.array(z.string()),
  riskLevel: z.enum(["low", "medium", "high"]),
  favors: z.string(),
  questions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
})

const analysisSchema = z.object({
  summary: z.string(),
  overallRisk: z.enum(["low", "medium", "high"]),
  clauses: z.array(clauseSchema),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit check
    const { success, limit, reset, remaining } = await ratelimit.limit(
      user.id
    )

    if (!success) {
      const now = Date.now()
      const resetTime = new Date(reset * 1000)
      const minutesRemaining = Math.ceil((resetTime.getTime() - now) / 60000)
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please try again in ${minutesRemaining} minutes.`,
        },
        { status: 429, headers: { "X-RateLimit-Reset": reset.toString() } }
      )
    }

    const body = await request.json()
    const { text, filename, documentId } = body

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      )
    }

    console.log(
      `[v0] Analyzing document: ${filename} for user: ${user.id}`
    )

    // Create analysis record in database
    const { data: analysis, error: createError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        document_id: documentId,
        status: "processing",
      })
      .select()
      .single()

    if (createError) {
      console.error("[v0] Failed to create analysis record:", createError)
      return NextResponse.json(
        { error: "Failed to create analysis" },
        { status: 500 }
      )
    }

    // Call Claude for analysis
    const result = await generateText({
      model: "anthropic/claude-3-5-sonnet-20241022",
      system: `You are an expert legal document analyst specializing in contract review and clause extraction. 
Your task is to analyze legal documents and break them down into individual clauses with plain-language explanations.
For each clause, identify:
1. The clause title
2. Plain meaning in simple language
3. Why it matters (list of impacts/implications)
4. Risk level (low/medium/high)
5. Who it favors (e.g., "Company", "User", "Mutual", etc.)
6. Common questions and answers about the clause`,

      prompt: `Please analyze the following legal document and extract all clauses. For each clause provide the structured analysis. Document: ${text.substring(0, 10000)}`,

      output: Output.object({
        schema: analysisSchema,
      }),
    })

    const analysisData = result.object as z.infer<typeof analysisSchema>

    // Save clauses to database
    const clausesData = analysisData.clauses.map((clause) => ({
      analysis_id: analysis.id,
      title: clause.title,
      clause_number: clause.clauseNumber,
      original_text: clause.originalText,
      plain_meaning: clause.plainMeaning,
      why_matters: clause.whyMatters,
      risk_level: clause.riskLevel,
      favors: clause.favors,
      questions: clause.questions,
    }))

    const { error: clausesError } = await supabase
      .from("clauses")
      .insert(clausesData)

    if (clausesError) {
      console.error("[v0] Failed to save clauses:", clausesError)
    }

    // Update analysis record with results
    const { error: updateError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        summary: analysisData.summary,
        overall_risk: analysisData.overallRisk,
        raw_response: JSON.stringify(analysisData),
      })
      .eq("id", analysis.id)

    if (updateError) {
      console.error("[v0] Failed to update analysis:", updateError)
    }

    // Increment user's analysis count
    await supabase.rpc("increment_analysis_count", { user_id: user.id })

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        summary: analysisData.summary,
        overallRisk: analysisData.overallRisk,
        clauses: analysisData.clauses,
      },
    })
  } catch (error) {
    console.error("[v0] Analysis error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    )
  }
}

function parseDocumentIntoSections(text: string, filename: string) {
  const lines = text.split("\n").filter((line) => line.trim())
  const clauses: any[] = []

  // Common section patterns
  const sectionPatterns = [
    /^(\d+)\.\s+(.+)$/, // "1. Section Title"
    /^Section\s+(\d+)[:.]?\s*(.*)$/i, // "Section 1: Title"
    /^Article\s+(\d+)[:.]?\s*(.*)$/i, // "Article 1: Title"
    /^§\s*(\d+)[:.]?\s*(.*)$/, // "§ 1: Title"
    /^([IVXLCDM]+)\.\s+(.+)$/, // "I. Section Title"
    /^([A-Z])\.\s+(.+)$/, // "A. Section Title"
    /^ARTICLE\s+([IVXLCDM]+)[:.]?\s*(.*)$/i, // "ARTICLE I: Title"
  ]

  let currentSection: { number: string; title: string; content: string[] } | null = null
  let sectionCount = 0

  for (const line of lines) {
    let matched = false

    for (const pattern of sectionPatterns) {
      const match = line.match(pattern)
      if (match) {
        // Save previous section
        if (currentSection && currentSection.content.length > 0) {
          sectionCount++
          clauses.push(createClause(currentSection, sectionCount))
        }

        currentSection = {
          number: match[1],
          title: match[2] || `Section ${match[1]}`,
          content: [],
        }
        matched = true
        break
      }
    }

    if (!matched && currentSection) {
      currentSection.content.push(line)
    } else if (!matched && !currentSection && line.length > 20) {
      // Start capturing content even without a section header
      currentSection = {
        number: "1",
        title: "Document Content",
        content: [line],
      }
    }
  }

  // Save last section
  if (currentSection && currentSection.content.length > 0) {
    sectionCount++
    clauses.push(createClause(currentSection, sectionCount))
  }

  // If no sections were found, create one from the entire document
  if (clauses.length === 0) {
    clauses.push({
      id: "clause-1",
      clauseNumber: "§ 1",
      title: filename.replace(/\.[^/.]+$/, ""),
      humanTitle: "Document Content",
      subtitle: "Main document content",
      originalText: text.substring(0, 2000),
      plainMeaning:
        "This document contains the terms and conditions as outlined in the text. Review each section carefully to understand your rights and obligations.",
      whyMatters: [
        "Understanding the full document helps you know what you are agreeing to",
        "Key terms and conditions affect your rights",
        "Being informed helps you make better decisions",
      ],
      riskLevel: "medium",
      favors: "Neutral",
      commonness: "Standard",
      definitions: [],
      questions: [
        {
          question: "What is this document about?",
          answer:
            "This document outlines specific terms, conditions, or agreements that the parties involved need to understand and follow.",
          clauseReference: "§ 1",
        },
      ],
    })
  }

  return clauses
}

function createClause(section: { number: string; title: string; content: string[] }, index: number) {
  const originalText = section.content.join("\n").trim()
  const wordCount = originalText.split(/\s+/).length

  // Determine risk level based on keywords
  const highRiskKeywords = ["indemnify", "liability", "termination", "breach", "damages", "waive", "forfeit", "penalty"]
  const mediumRiskKeywords = ["obligation", "requirement", "must", "shall", "warranty", "guarantee", "limitation"]

  const textLower = originalText.toLowerCase()
  let riskLevel = "low"
  let riskScore = 0

  highRiskKeywords.forEach((keyword) => {
    if (textLower.includes(keyword)) riskScore += 2
  })
  mediumRiskKeywords.forEach((keyword) => {
    if (textLower.includes(keyword)) riskScore += 1
  })

  if (riskScore >= 4) riskLevel = "high"
  else if (riskScore >= 2) riskLevel = "medium"

  // Determine who the clause favors
  let favors = "Neutral"
  if (textLower.includes("licensor") || textLower.includes("company") || textLower.includes("employer")) {
    favors = textLower.includes("licensor") ? "Licensor" : textLower.includes("employer") ? "Employer" : "Provider"
  } else if (textLower.includes("licensee") || textLower.includes("user") || textLower.includes("employee")) {
    favors = textLower.includes("licensee") ? "Licensee" : textLower.includes("employee") ? "Employee" : "User"
  }

  // Create human-readable title
  const humanTitle =
    section.title
      .replace(/[^a-zA-Z\s]/g, "")
      .split(" ")
      .slice(0, 4)
      .join(" ")
      .trim() || `Section ${index}`

  // Generate plain meaning
  const plainMeaning = generatePlainMeaning(section.title, originalText, riskLevel)

  // Generate why it matters
  const whyMatters = generateWhyMatters(section.title, riskLevel)

  // Extract definitions if any
  const definitions = extractDefinitions(originalText)

  return {
    id: `clause-${index}`,
    clauseNumber: `§ ${section.number}`,
    title: section.title,
    humanTitle,
    subtitle: `${wordCount} words • ${riskLevel} risk`,
    originalText: originalText.substring(0, 3000),
    plainMeaning,
    whyMatters,
    riskLevel,
    favors,
    commonness: riskLevel === "high" ? "Aggressive" : riskLevel === "medium" ? "Standard" : "Favorable",
    definitions,
    questions: [
      {
        question: `What does the ${humanTitle} section mean for me?`,
        answer: plainMeaning,
        clauseReference: `§ ${section.number}`,
      },
      {
        question: "Is this section standard in similar agreements?",
        answer:
          riskLevel === "high"
            ? "This section contains terms that may be more aggressive than typical agreements. Consider reviewing carefully."
            : "This section contains fairly standard language found in similar agreements.",
        clauseReference: `§ ${section.number}`,
      },
    ],
  }
}

function generatePlainMeaning(title: string, text: string, riskLevel: string): string {
  const titleLower = title.toLowerCase()
  const textLower = text.toLowerCase()

  if (titleLower.includes("definition") || titleLower.includes("interpret")) {
    return "This section explains the specific meanings of key terms used throughout the document. Understanding these definitions is crucial as they affect how the entire agreement is interpreted."
  }
  if (titleLower.includes("grant") || titleLower.includes("license")) {
    return "This section describes what rights or permissions are being given, including any limitations on how those rights can be used."
  }
  if (titleLower.includes("payment") || titleLower.includes("fee") || textLower.includes("payment")) {
    return "This section outlines the financial obligations, including amounts due, payment schedules, and any consequences for late or missed payments."
  }
  if (titleLower.includes("termination") || titleLower.includes("cancel")) {
    return "This section explains how and when the agreement can be ended, what happens when it ends, and any obligations that continue after termination."
  }
  if (titleLower.includes("liability") || titleLower.includes("indemnif")) {
    return "This section addresses who is responsible if something goes wrong, including limits on damages and obligations to protect the other party from claims."
  }
  if (titleLower.includes("confidential") || titleLower.includes("privacy")) {
    return "This section covers what information must be kept private, how it can be used, and what happens if confidentiality is breached."
  }
  if (titleLower.includes("warrant") || titleLower.includes("guarantee")) {
    return "This section describes what promises or guarantees are being made about the product or service, and importantly, what is NOT being guaranteed."
  }

  return riskLevel === "high"
    ? "This section contains important terms that significantly affect your rights and obligations. Review it carefully and consider seeking clarification on any unclear points."
    : "This section establishes standard terms for this type of agreement. While routine, it is still important to understand what you are agreeing to."
}

function generateWhyMatters(title: string, riskLevel: string): string[] {
  const matters = []

  if (riskLevel === "high") {
    matters.push("Contains terms that could significantly impact your rights")
    matters.push("May include obligations that are difficult to reverse")
    matters.push("Worth discussing with legal counsel if unclear")
  } else if (riskLevel === "medium") {
    matters.push("Establishes important obligations you need to follow")
    matters.push("Affects how you can use or interact with the subject matter")
    matters.push("Understanding this helps avoid unintentional breaches")
  } else {
    matters.push("Provides helpful context for the agreement")
    matters.push("Contains standard terms typical for this type of document")
    matters.push("Ensures both parties have clear expectations")
  }

  return matters
}

function extractDefinitions(text: string): any[] {
  const definitions: any[] = []

  // Look for patterns like "Term" means or 'Term' means
  const defPattern = /["']([^"']+)["']\s+(?:means?|refers?\s+to|shall\s+mean)/gi
  let match

  while ((match = defPattern.exec(text)) !== null && definitions.length < 5) {
    definitions.push({
      term: match[1],
      plainMeaning: `The specific meaning of "${match[1]}" as used in this document.`,
      example: `When you see "${match[1]}" in this agreement, it refers to the definition provided here.`,
      importance: "Understanding this term helps interpret the entire document correctly.",
    })
  }

  return definitions
}

export async function POST(request: Request) {
  try {
    const { text, filename } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "No text content provided" }, { status: 400 })
    }

    // Parse document into sections using rule-based analysis
    const clauses = parseDocumentIntoSections(text, filename)

    // Generate a unique document ID
    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`

    return NextResponse.json({
      documentId,
      filename,
      clauses,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze document" }, { status: 500 })
  }
}
