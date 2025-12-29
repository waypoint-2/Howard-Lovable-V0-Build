"use client"

import Link from "next/link"
import { FileText, Clock, ArrowUpRight, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const recentDocs = [
  {
    id: 1,
    title: "Software License Agreement",
    type: "License",
    updatedAt: "2 hours ago",
    clauses: 24,
    riskLevel: "high",
    progress: 75,
  },
  {
    id: 2,
    title: "Employment Contract - Senior Developer",
    type: "Employment",
    updatedAt: "Yesterday",
    clauses: 18,
    riskLevel: "medium",
    progress: 100,
  },
  {
    id: 3,
    title: "Office Lease Agreement Q1 2025",
    type: "Real Estate",
    updatedAt: "3 days ago",
    clauses: 32,
    riskLevel: "low",
    progress: 100,
  },
  {
    id: 4,
    title: "Vendor Service Agreement - Acme Corp",
    type: "Vendor",
    updatedAt: "1 week ago",
    clauses: 15,
    riskLevel: "medium",
    progress: 45,
  },
  {
    id: 5,
    title: "Non-Disclosure Agreement - Project X",
    type: "NDA",
    updatedAt: "2 weeks ago",
    clauses: 8,
    riskLevel: "low",
    progress: 100,
  },
]

const riskConfig = {
  high: { icon: AlertTriangle, color: "text-[var(--risk-high)]", bg: "bg-[var(--risk-high-bg)]", label: "High Risk" },
  medium: { icon: Shield, color: "text-[var(--risk-medium)]", bg: "bg-[var(--risk-medium-bg)]", label: "Medium Risk" },
  low: { icon: CheckCircle, color: "text-[var(--risk-low)]", bg: "bg-[var(--risk-low-bg)]", label: "Low Risk" },
}

export function RecentTab() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="space-y-3">
        {recentDocs.map((doc, index) => {
          const risk = riskConfig[doc.riskLevel as keyof typeof riskConfig]
          const RiskIcon = risk.icon

          return (
            <Link
              key={doc.id}
              href="/"
              className={cn(
                "group flex items-center gap-4 p-4 rounded-xl",
                "bg-card border border-border/40 hover:border-border/80",
                "hover:shadow-md transition-all duration-200",
                "animate-fade-in-up",
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
                    {doc.title}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all shrink-0" />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded-full bg-accent/60">{doc.type}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {doc.updatedAt}
                  </span>
                  <span>{doc.clauses} clauses</span>
                </div>
              </div>

              {/* Risk Badge */}
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

              {/* Progress */}
              <div className="hidden md:flex flex-col items-end gap-1 shrink-0 w-20">
                <span className="text-xs text-muted-foreground">{doc.progress}%</span>
                <div className="w-full h-1.5 bg-accent/60 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      doc.progress === 100 ? "bg-[var(--success)]" : "bg-[var(--brand)]",
                    )}
                    style={{ width: `${doc.progress}%` }}
                  />
                </div>
              </div>
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
