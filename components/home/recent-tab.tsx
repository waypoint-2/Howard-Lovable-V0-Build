"use client"

import Link from "next/link"
import { FileText, Clock, ArrowUpRight, Shield, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Document {
  id: string
  filename: string
  created_at: string
  analysis?: Array<{
    overall_risk: "low" | "medium" | "high"
    status: string
    clauses: Array<{ id: string }>
  }>
}

const riskConfig = {
  high: { icon: AlertTriangle, color: "text-[var(--risk-high)]", bg: "bg-[var(--risk-high-bg)]", label: "High Risk" },
  medium: { icon: Shield, color: "text-[var(--risk-medium)]", bg: "bg-[var(--risk-medium-bg)]", label: "Medium Risk" },
  low: { icon: CheckCircle, color: "text-[var(--risk-low)]", bg: "bg-[var(--risk-low-bg)]", label: "Low Risk" },
}

export function RecentTab() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("documents")
          .select(`
            id,
            file_name,
            created_at,
            analyses (
              id,
              overall_risk,
              status,
              clauses ( id )
            )
          `)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) {
          console.error("[v0] recent-tab: failed to fetch documents:", error)
        } else if (data) {
          setDocuments(
            data.map((doc) => ({
              id: doc.id,
              filename: doc.file_name,
              created_at: doc.created_at,
              analysis: doc.analyses as Document["analysis"],
            }))
          )
        }
      } catch (err) {
        console.error("[v0] recent-tab: unexpected error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-1">No documents yet</h3>
          <p className="text-sm text-muted-foreground">Upload your first document to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-3">
        {documents.map((doc, index) => {
          const analysis = doc.analysis?.[0]
          const riskLevel = analysis?.overall_risk || "low"
          const risk = riskConfig[riskLevel as keyof typeof riskConfig]
          const RiskIcon = risk.icon
          const clauseCount = analysis?.clauses?.length || 0
          const isAnalyzing = analysis?.status === "processing"

          return (
            <Link
              key={doc.id}
              href={analysis ? `/review/${doc.id}` : "#"}
              className={cn(
                "group flex items-center gap-4 p-4 rounded-xl",
                "bg-card border border-border/40 hover:border-border/80",
                "hover:shadow-md transition-all duration-200",
                "animate-fade-in-up",
                !analysis && "opacity-50 pointer-events-none"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon */}
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", risk.bg)}>
                <FileText className={cn("w-5 h-5", risk.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground truncate group-hover:text-[var(--brand)] transition-colors">
                    {doc.filename}
                  </h3>
                  {analysis && <ArrowUpRight className="w-4 h-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all shrink-0" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(doc.created_at)}
                  </span>
                  {analysis && <span>{clauseCount} clauses</span>}
                  {isAnalyzing && <span className="text-[var(--brand)]">Analyzing...</span>}
                </div>
              </div>

              {/* Risk Badge */}
              {analysis && (
                <div
                  className={cn(
                    "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    risk.bg,
                    risk.color,
                  )}
                >
                  <RiskIcon className="w-3.5 h-3.5" />
                  {risk.label}
                </div>
              )}

              {/* Progress */}
              {analysis && (
                <div className="hidden md:flex flex-col items-end gap-1 shrink-0 w-20">
                  <span className="text-xs text-muted-foreground">
                    {analysis.status === "completed" ? "100%" : "Analyzing..."}
                  </span>
                  <div className="w-full h-1.5 bg-accent/60 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        analysis.status === "completed" ? "bg-[var(--success)]" : "bg-[var(--brand)]",
                      )}
                      style={{ width: analysis.status === "completed" ? "100%" : "60%" }}
                    />
                  </div>
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* View All Link */}
      <div className="flex justify-center mt-6">
        <Link
          href="/home"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all documents
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
