"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { FileText, MoreHorizontal, ExternalLink, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

const documents = [
  {
    id: 1,
    name: "Software License Agreement - Acme Corp",
    type: "License Agreement",
    riskLevel: "high",
    status: "pending",
    clauses: 24,
    updated: "2 hours ago",
  },
  {
    id: 2,
    name: "NDA - TechStart Inc.",
    type: "Non-Disclosure",
    riskLevel: "low",
    status: "reviewed",
    clauses: 12,
    updated: "5 hours ago",
  },
  {
    id: 3,
    name: "Employment Contract Template",
    type: "Employment",
    riskLevel: "medium",
    status: "reviewed",
    clauses: 18,
    updated: "Yesterday",
  },
  {
    id: 4,
    name: "Vendor Agreement - CloudServe",
    type: "Vendor Agreement",
    riskLevel: "high",
    status: "pending",
    clauses: 32,
    updated: "Yesterday",
  },
  {
    id: 5,
    name: "Partnership Agreement Draft",
    type: "Partnership",
    riskLevel: "low",
    status: "draft",
    clauses: 8,
    updated: "3 days ago",
  },
]

export function DashboardDocuments() {
  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden animate-fade-in">
      <div className="p-5 md:p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground">Recent Documents</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Your latest document analyses</p>
          </div>
          <Link
            href="/dashboard/documents"
            className="flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:text-foreground transition-colors"
          >
            View all
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {documents.map((doc, i) => (
          <Link
            key={doc.id}
            href="/"
            className={cn("flex items-center gap-4 p-4 md:px-6 hover:bg-accent/30 transition-colors")}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                doc.riskLevel === "high" && "bg-[var(--risk-high-bg)]",
                doc.riskLevel === "medium" && "bg-[var(--warning-bg)]",
                doc.riskLevel === "low" && "bg-[var(--success-bg)]",
              )}
            >
              <FileText
                className={cn(
                  "w-5 h-5",
                  doc.riskLevel === "high" && "text-[var(--risk-high)]",
                  doc.riskLevel === "medium" && "text-[var(--warning)]",
                  doc.riskLevel === "low" && "text-[var(--success)]",
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm truncate">{doc.name}</span>
                {doc.riskLevel === "high" && <AlertTriangle className="w-3.5 h-3.5 text-[var(--risk-high)] shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{doc.type}</span>
                <span className="text-muted-foreground/30">•</span>
                <span className="text-xs text-muted-foreground">{doc.clauses} clauses</span>
              </div>
            </div>

            {/* Status */}
            <div className="hidden sm:flex items-center gap-3">
              <span
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium",
                  doc.status === "reviewed" && "bg-[var(--success-bg)] text-[var(--success)]",
                  doc.status === "pending" && "bg-[var(--warning-bg)] text-[var(--warning)]",
                  doc.status === "draft" && "bg-accent text-muted-foreground",
                )}
              >
                {doc.status === "reviewed" && <CheckCircle2 className="w-3 h-3" />}
                {doc.status === "pending" && <Clock className="w-3 h-3" />}
                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
              </span>
              <span className="text-xs text-muted-foreground w-20 text-right">{doc.updated}</span>
            </div>

            {/* Actions */}
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent/60 transition-colors shrink-0">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </Link>
        ))}
      </div>
    </div>
  )
}
