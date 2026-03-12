import { NextResponse } from "next/server"

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
