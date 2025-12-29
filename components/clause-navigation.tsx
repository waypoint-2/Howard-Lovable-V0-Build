"use client"

import { cn } from "@/lib/utils"
import type { Clause } from "@/lib/legal-data"

interface ClauseNavigationProps {
  clauses: Clause[]
  activeClauseId: string | null
  reviewedClauses: Set<string>
  onClauseSelect: (clauseId: string) => void
}

export function ClauseNavigation({ clauses, activeClauseId, reviewedClauses, onClauseSelect }: ClauseNavigationProps) {
  const getRiskIndicator = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return {
          dot: "bg-[var(--risk-high)]",
          text: "text-[var(--risk-high)]",
          label: "Review carefully",
        }
      case "medium":
        return {
          dot: "bg-[var(--risk-medium)]",
          text: "text-[var(--risk-medium)]",
          label: "Worth noting",
        }
      default:
        return null
    }
  }

  return (
    <div className="w-64 border-r border-border bg-sidebar flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border shrink-0">
        <h1 className="font-serif text-lg text-sidebar-foreground">Document Review</h1>
        <p className="text-xs text-muted-foreground mt-1">Software License Agreement</p>
      </div>

      {/* Clause List */}
      <nav className="flex-1 overflow-y-auto legal-scroll p-4 min-h-0">
        <ul className="space-y-0.5 stagger-children">
          {clauses.map((clause) => {
            const riskIndicator = getRiskIndicator(clause.riskLevel)
            return (
              <li key={clause.id}>
                <button
                  onClick={() => onClauseSelect(clause.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-md transition-all duration-200 ease-out group",
                    "hover:bg-sidebar-accent/70 hover:translate-x-0.5",
                    activeClauseId === clause.id && "bg-sidebar-accent shadow-sm",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {riskIndicator && (
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-transform duration-200",
                          riskIndicator.dot,
                          "group-hover:scale-125",
                        )}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-serif text-sm text-sidebar-foreground block leading-snug">
                        {clause.title}
                      </span>
                      {riskIndicator && (
                        <span
                          className={cn(
                            "text-[10px] mt-0.5 block transition-colors duration-200 font-medium",
                            riskIndicator.text,
                          )}
                        >
                          {riskIndicator.label}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer Progress */}
      <div className="p-4 border-t border-sidebar-border shrink-0">
        <div className="mb-2">
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--success)] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(reviewedClauses.size / clauses.length) * 100}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="text-[var(--success)] font-medium">{reviewedClauses.size}</span> of {clauses.length} reviewed
        </p>
      </div>
    </div>
  )
}
