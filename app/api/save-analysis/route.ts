import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function calculateOverallRisk(clauses: Array<{ riskLevel?: string }>): "low" | "medium" | "high" {
  const levels = clauses.map((c) => c.riskLevel || "low")
  if (levels.includes("high")) return "high"
  if (levels.includes("medium")) return "medium"
  return "low"
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ persisted: false })
    }

    const body = await request.json()
    const { documentId, blobUrl, filename, documentTitle, clauses } = body

    let finalDocumentId = documentId

    // If no document record exists (user wasn't logged in at upload time, or upload bug),
    // create a minimal document record so the analysis FK is satisfied.
    if (!finalDocumentId) {
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          file_name: filename || "Unknown",
          file_type: "unknown",
          blob_url: blobUrl || "",
          status: "uploaded",
        })
        .select("id")
        .single()

      if (docError || !doc) {
        console.error("[v0] save-analysis: failed to create document record:", docError)
        return NextResponse.json({ persisted: false })
      }
      finalDocumentId = doc.id
    }

    const overallRisk = calculateOverallRisk(clauses || [])

    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        document_id: finalDocumentId,
        user_id: user.id,
        summary: documentTitle || null,
        overall_risk: overallRisk,
        status: "completed",
      })
      .select("id")
      .single()

    if (analysisError || !analysis) {
      console.error("[v0] save-analysis: failed to create analysis record:", analysisError)
      return NextResponse.json({ persisted: false })
    }

    if (clauses && clauses.length > 0) {
      const clauseRows = clauses.map((clause: {
        clauseNumber?: string
        title?: string
        originalText?: string
        plainMeaning?: string
        whyMatters?: string[]
        riskLevel?: string
        favors?: string
        questions?: unknown[]
      }) => ({
        analysis_id: analysis.id,
        clause_number: clause.clauseNumber || "§ 1",
        title: clause.title || "Untitled",
        original_text: clause.originalText || "",
        plain_meaning: clause.plainMeaning || "",
        why_matters: clause.whyMatters || [],
        risk_level: clause.riskLevel || "low",
        favors: clause.favors || null,
        questions: clause.questions || [],
      }))

      const { error: clausesError } = await supabase.from("clauses").insert(clauseRows)

      if (clausesError) {
        // Non-fatal — analysis record exists, clauses are best-effort
        console.error("[v0] save-analysis: failed to insert clauses:", clausesError)
      }
    }

    return NextResponse.json({ analysisId: analysis.id, persisted: true })
  } catch (error) {
    console.error("[v0] save-analysis error:", error)
    return NextResponse.json({ persisted: false })
  }
}
