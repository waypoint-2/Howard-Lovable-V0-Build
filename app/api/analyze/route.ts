import { type NextRequest, NextResponse } from "next/server"

interface AnalysisResult {
  wordCount: number
  characterCount: number
  sentenceCount: number
  paragraphCount: number
  readabilityScore: number
  readabilityGrade: string
  estimatedReadTime: number
  sections: Section[]
  keyTerms: KeyTerm[]
  riskIndicators: RiskIndicator[]
  documentType: string
  complexity: "Low" | "Medium" | "High"
}

interface Section {
  id: string
  title: string
  wordCount: number
  startIndex: number
}

interface KeyTerm {
  term: string
  count: number
  category: "legal" | "financial" | "technical" | "general"
}

interface RiskIndicator {
  type: string
  severity: "low" | "medium" | "high"
  description: string
  location: string
}

// Legal terms to detect
const LEGAL_TERMS = [
  "indemnify",
  "indemnification",
  "liability",
  "warrant",
  "warranty",
  "termination",
  "confidential",
  "proprietary",
  "intellectual property",
  "arbitration",
  "jurisdiction",
  "governing law",
  "force majeure",
  "severability",
  "assignment",
  "amendment",
  "waiver",
  "breach",
  "damages",
  "remedy",
  "remedies",
  "covenant",
  "representation",
  "obligation",
  "compliance",
  "dispute",
  "negligence",
  "default",
]

// Risk patterns to detect
const RISK_PATTERNS = [
  { pattern: /unlimited liability/gi, severity: "high" as const, type: "Unlimited Liability" },
  { pattern: /indemnif(y|ication)/gi, severity: "medium" as const, type: "Indemnification Clause" },
  { pattern: /waive.*right/gi, severity: "high" as const, type: "Rights Waiver" },
  { pattern: /non.?compete/gi, severity: "medium" as const, type: "Non-Compete Clause" },
  { pattern: /exclusive.*jurisdiction/gi, severity: "low" as const, type: "Jurisdiction Clause" },
  { pattern: /automatic.*renew/gi, severity: "medium" as const, type: "Auto-Renewal" },
  { pattern: /terminate.*without.*cause/gi, severity: "high" as const, type: "Termination Without Cause" },
  { pattern: /confidential.*perpetual/gi, severity: "medium" as const, type: "Perpetual Confidentiality" },
]

function detectDocumentType(text: string): string {
  const lowerText = text.toLowerCase()

  if (
    lowerText.includes("non-disclosure") ||
    lowerText.includes("nda") ||
    lowerText.includes("confidentiality agreement")
  ) {
    return "Non-Disclosure Agreement"
  }
  if (lowerText.includes("employment") && lowerText.includes("agreement")) {
    return "Employment Agreement"
  }
  if (lowerText.includes("terms of service") || lowerText.includes("terms and conditions")) {
    return "Terms of Service"
  }
  if (lowerText.includes("lease") || lowerText.includes("rental agreement")) {
    return "Lease Agreement"
  }
  if (lowerText.includes("software license") || lowerText.includes("end user license")) {
    return "Software License Agreement"
  }
  if (lowerText.includes("purchase") && lowerText.includes("agreement")) {
    return "Purchase Agreement"
  }
  if (lowerText.includes("partnership") && lowerText.includes("agreement")) {
    return "Partnership Agreement"
  }
  return "Legal Document"
}

function calculateReadability(text: string): { score: number; grade: string } {
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const syllables = words.reduce((acc, word) => {
    return acc + countSyllables(word)
  }, 0)

  const wordCount = words.length
  const sentenceCount = Math.max(sentences.length, 1)
  const avgWordsPerSentence = wordCount / sentenceCount
  const avgSyllablesPerWord = syllables / Math.max(wordCount, 1)

  // Flesch-Kincaid Reading Ease
  const score = Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord))

  let grade: string
  if (score >= 90) grade = "Very Easy"
  else if (score >= 80) grade = "Easy"
  else if (score >= 70) grade = "Fairly Easy"
  else if (score >= 60) grade = "Standard"
  else if (score >= 50) grade = "Fairly Difficult"
  else if (score >= 30) grade = "Difficult"
  else grade = "Very Difficult"

  return { score: Math.round(score), grade }
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "")
  if (word.length <= 3) return 1

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
  word = word.replace(/^y/, "")

  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

function extractSections(text: string): Section[] {
  const sections: Section[] = []
  const sectionPatterns = [
    /^(?:ARTICLE|SECTION|CLAUSE)\s*[\dIVX]+[.:]\s*(.+)$/gim,
    /^(?:\d+\.)\s*([A-Z][A-Za-z\s]+)$/gm,
    /^([A-Z][A-Z\s]{2,})$/gm,
  ]

  let id = 1
  for (const pattern of sectionPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      sections.push({
        id: `section-${id++}`,
        title: match[1].trim(),
        wordCount: 0,
        startIndex: match.index,
      })
    }
  }

  // Calculate word counts between sections
  sections.sort((a, b) => a.startIndex - b.startIndex)
  for (let i = 0; i < sections.length; i++) {
    const start = sections[i].startIndex
    const end = i < sections.length - 1 ? sections[i + 1].startIndex : text.length
    const sectionText = text.slice(start, end)
    sections[i].wordCount = sectionText.split(/\s+/).filter((w) => w.length > 0).length
  }

  return sections.slice(0, 20) // Limit to 20 sections
}

function extractKeyTerms(text: string): KeyTerm[] {
  const lowerText = text.toLowerCase()
  const terms: KeyTerm[] = []

  for (const term of LEGAL_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, "gi")
    const matches = text.match(regex)
    if (matches && matches.length > 0) {
      terms.push({
        term: term.charAt(0).toUpperCase() + term.slice(1),
        count: matches.length,
        category: "legal",
      })
    }
  }

  return terms.sort((a, b) => b.count - a.count).slice(0, 15)
}

function detectRisks(text: string): RiskIndicator[] {
  const risks: RiskIndicator[] = []

  for (const { pattern, severity, type } of RISK_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      // Find the first occurrence for location
      const match = pattern.exec(text)
      const location = match ? `Near position ${match.index}` : "Throughout document"

      risks.push({
        type,
        severity,
        description: `Found ${matches.length} instance(s) of ${type.toLowerCase()}`,
        location,
      })
    }
  }

  return risks
}

export async function POST(request: NextRequest) {
  try {
    const { text, filename } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    // Basic counts
    const words = text.split(/\s+/).filter((w: string) => w.length > 0)
    const wordCount = words.length
    const characterCount = text.length
    const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0)
    const sentenceCount = sentences.length
    const paragraphs = text.split(/\n\n+/).filter((p: string) => p.trim().length > 0)
    const paragraphCount = paragraphs.length

    // Readability
    const { score: readabilityScore, grade: readabilityGrade } = calculateReadability(text)

    // Estimated read time (assuming 200 words per minute for legal docs)
    const estimatedReadTime = Math.ceil(wordCount / 200)

    // Sections
    const sections = extractSections(text)

    // Key terms
    const keyTerms = extractKeyTerms(text)

    // Risk indicators
    const riskIndicators = detectRisks(text)

    // Document type
    const documentType = detectDocumentType(text)

    // Complexity based on readability and legal term density
    const legalTermDensity = (keyTerms.reduce((acc, t) => acc + t.count, 0) / Math.max(wordCount, 1)) * 100
    let complexity: "Low" | "Medium" | "High"
    if (readabilityScore < 30 || legalTermDensity > 5) complexity = "High"
    else if (readabilityScore < 50 || legalTermDensity > 2) complexity = "Medium"
    else complexity = "Low"

    const result: AnalysisResult = {
      wordCount,
      characterCount,
      sentenceCount,
      paragraphCount,
      readabilityScore,
      readabilityGrade,
      estimatedReadTime,
      sections,
      keyTerms,
      riskIndicators,
      documentType,
      complexity,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
