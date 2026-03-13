"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { Clause } from "@/lib/legal-data"
import ReactMarkdown from "react-markdown"

interface OriginalDocumentProps {
  clauses: Clause[]
  activeClauseId: string | null
  onClauseSelect: (clauseId: string) => void
  documentTitle?: string
}

export function OriginalDocument({ clauses, activeClauseId, onClauseSelect, documentTitle }: OriginalDocumentProps) {
  // Get today's date formatted
  const todayDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const clauseRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (activeClauseId && clauseRefs.current.has(activeClauseId)) {
      const element = clauseRefs.current.get(activeClauseId)
      element?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [activeClauseId])

  const getClauseAccent = (riskLevel: string, isActive: boolean) => {
    if (!isActive) return "bg-transparent"
    switch (riskLevel) {
      case "high":
        return "bg-[var(--risk-high)]/40"
      case "medium":
        return "bg-[var(--risk-medium)]/40"
      default:
        return "bg-foreground/20"
    }
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto legal-scroll bg-paper lg:border-r border-border">
      <div className="max-w-2xl mx-auto py-6 px-4 md:py-12 md:px-10">
        {/* Document Header */}
        <header className="mb-8 md:mb-12 pb-6 md:pb-8 border-b border-highlight-border animate-fade-in">
          <h1 className="font-serif text-xl md:text-2xl text-paper-foreground mb-2 text-balance">
            {documentTitle || "Document Review"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3">
            <p className="font-serif text-xs md:text-sm text-muted-foreground italic">
              Effective Date: {todayDate}
            </p>
            <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-border)] rounded-full">
              Under Review
            </span>
          </div>
        </header>

        {/* Clauses */}
        <div className="space-y-6 md:space-y-8">
          {clauses.map((clause, index) => (
            <article
              key={clause.id}
              ref={(el) => {
                if (el) clauseRefs.current.set(clause.id, el)
              }}
              onClick={() => onClauseSelect(clause.id)}
              className={cn(
                "relative cursor-pointer -ml-2 md:-ml-4 pl-2 md:pl-4 rounded-lg",
                "transition-all duration-300 ease-out",
                "active:scale-[0.995]",
                activeClauseId === clause.id ? "bg-highlight/60 shadow-sm" : "hover:bg-highlight/30",
              )}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-0.5 rounded-full transition-all duration-300",
                  activeClauseId === clause.id ? getClauseAccent(clause.riskLevel, true) : "bg-transparent opacity-0",
                )}
              />

              <div className="py-4 md:py-5">
                {/* Clause Number & Risk Indicator */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] md:text-[11px] text-muted-foreground/70 tracking-wide">
                    {clause.clauseNumber}
                  </span>
                  {clause.riskLevel === "high" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-high)]" title="Higher exposure" />
                  )}
                  {clause.riskLevel === "medium" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-medium)]" title="Worth noting" />
                  )}
                </div>

                {/* Clause Title */}
                <h2 className="font-serif text-base md:text-lg text-paper-foreground mb-3 md:mb-4 text-pretty">
                  {clause.title}
                </h2>

                {/* Clause Text */}
                <div className="font-serif text-xs md:text-sm text-paper-foreground/85 leading-[1.8] prose prose-sm max-w-none prose-p:my-2 prose-li:my-0.5 prose-ol:my-2 prose-ul:my-2 prose-strong:font-semibold prose-headings:font-serif">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-3">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-paper-foreground">{children}</strong>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1">{children}</ol>,
                      ul: ({ children }) => <ul className="list-disc ml-4 space-y-1">{children}</ul>,
                      li: ({ children }) => <li className="pl-1">{children}</li>,
                    }}
                  >
                    {clause.originalText}
                  </ReactMarkdown>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Document Footer */}
        <footer className="mt-12 md:mt-16 pt-6 md:pt-8 border-t border-highlight-border">
          <p className="font-serif text-xs text-muted-foreground/60 text-center">End of Document</p>
        </footer>
      </div>
    </div>
  )
}
