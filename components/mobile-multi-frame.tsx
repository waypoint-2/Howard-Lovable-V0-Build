"use client"

import type React from "react"

import { useRef } from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Clause } from "@/lib/legal-data"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
  CheckCircle,
  FileText,
  MessageSquareText,
  LayoutGrid,
  List,
  Menu,
  Sparkles,
  Send,
  MessageSquare,
} from "lucide-react"

type FrameType = "document" | "explanation" | "clauses" | "overview"

interface MobileMultiFrameProps {
  clauses: Clause[]
  activeClause: Clause | undefined
  activeClauseId: string | null
  currentIndex: number
  reviewedClauses: Set<string>
  onClauseSelect: (clauseId: string) => void
  onPrevious: () => void
  onNext: () => void
  onMenuToggle: () => void
}

export function MobileMultiFrame({
  clauses,
  activeClause,
  activeClauseId,
  currentIndex,
  reviewedClauses,
  onClauseSelect,
  onPrevious,
  onNext,
  onMenuToggle,
}: MobileMultiFrameProps) {
  const [activeFrame, setActiveFrame] = useState<FrameType>("explanation")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Frame configuration
  const frames: { id: FrameType; label: string; icon: React.ReactNode; shortLabel: string }[] = [
    { id: "document", label: "Document", shortLabel: "Doc", icon: <FileText className="w-4 h-4" /> },
    { id: "explanation", label: "Explanation", shortLabel: "Explain", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "clauses", label: "Clauses", shortLabel: "List", icon: <List className="w-4 h-4" /> },
    { id: "overview", label: "Overview", shortLabel: "Summary", icon: <LayoutGrid className="w-4 h-4" /> },
  ]

  const handleFrameChange = (frame: FrameType) => {
    if (frame === activeFrame) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveFrame(frame)
      setIsTransitioning(false)
      // Scroll to top when changing frames
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }, 150)
  }

  const handleClauseSelectAndSwitch = (clauseId: string) => {
    onClauseSelect(clauseId)
    handleFrameChange("explanation")
  }

  const handleDrawerClauseSelect = (clauseId: string) => {
    onClauseSelect(clauseId)
    handleFrameChange("explanation")
  }

  const activeClauseForExplanation = clauses.find((c) => c.id === activeClauseId) || clauses[0]
  const activeIndexForExplanation = clauses.findIndex((c) => c.id === activeClauseForExplanation?.id)

  const navigateClause = useCallback(
    (direction: "prev" | "next") => {
      const newIndex =
        direction === "prev"
          ? Math.max(0, activeIndexForExplanation - 1)
          : Math.min(clauses.length - 1, activeIndexForExplanation + 1)
      onClauseSelect(clauses[newIndex].id)
    },
    [activeIndexForExplanation, clauses, onClauseSelect],
  )

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Top Header */}
      <header className="h-14 border-b border-border/60 bg-sidebar/80 backdrop-blur-sm flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuToggle}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-foreground/70" />
          </button>

          <div className="flex items-center gap-2">
            <Link href="/landing" className="flex items-center gap-2">
              <span className="font-serif text-base tracking-tight text-foreground/90">Howard</span>
            </Link>
            <span className="px-1.5 py-0.5 text-[8px] font-semibold tracking-wider uppercase bg-[var(--brand-light)] text-[var(--brand)] rounded">
              Pro
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            <span className="text-[var(--success)]">Saved</span>
          </span>
          <div className="w-7 h-7 rounded-full bg-accent/60 flex items-center justify-center">
            <span className="text-[10px] font-medium text-muted-foreground">JD</span>
          </div>
        </div>
      </header>

      {/* Frame Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeFrame === "document" && (
          <DocumentFrame
            clauses={clauses}
            activeClauseId={activeClauseId}
            onClauseSelect={handleClauseSelectAndSwitch}
          />
        )}
        {activeFrame === "explanation" && (
          <ExplanationFrame
            clause={activeClauseForExplanation}
            totalClauses={clauses.length}
            currentIndex={activeIndexForExplanation}
            onNavigate={navigateClause}
          />
        )}
        {activeFrame === "clauses" && (
          <ClausesFrame
            clauses={clauses}
            activeClauseId={activeClauseId}
            reviewedClauses={reviewedClauses}
            onClauseSelect={(id) => {
              onClauseSelect(id)
              setActiveFrame("explanation")
            }}
          />
        )}
        {activeFrame === "overview" && <OverviewFrame clauses={clauses} reviewedClauses={reviewedClauses} />}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="h-16 border-t border-border/60 bg-sidebar/80 backdrop-blur-sm flex items-center justify-around px-2 shrink-0 safe-area-bottom">
        {[
          { id: "document" as FrameType, icon: FileText, label: "Document" },
          { id: "explanation" as FrameType, icon: MessageSquare, label: "Explain" },
          { id: "clauses" as FrameType, icon: List, label: "Clauses" },
          { id: "overview" as FrameType, icon: LayoutGrid, label: "Overview" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFrame(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
              activeFrame === tab.id
                ? "text-[var(--brand)] bg-[var(--brand-light)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// Document Frame Component
function DocumentFrame({
  clauses,
  activeClauseId,
  onClauseSelect,
}: {
  clauses: Clause[]
  activeClauseId: string | null
  onClauseSelect: (clauseId: string) => void
}) {
  const clauseRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (activeClauseId && clauseRefs.current.has(activeClauseId)) {
      const element = clauseRefs.current.get(activeClauseId)
      setTimeout(() => {
        element?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 200)
    }
  }, [activeClauseId])

  return (
    <div className="py-6 px-4 bg-paper min-h-full">
      {/* Document Header */}
      <header className="mb-8 pb-6 border-b border-highlight-border animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Original Document
          </span>
        </div>
        <h1 className="font-serif text-xl text-paper-foreground mb-1">Software License Agreement</h1>
        <p className="font-serif text-xs text-muted-foreground italic">Effective Date: January 1, 2024</p>
        <p className="text-xs text-muted-foreground mt-3">Tap any clause to view its plain-language explanation</p>
      </header>

      {/* Clauses */}
      <div className="space-y-6">
        {clauses.map((clause, index) => {
          const isActive = activeClauseId === clause.id

          return (
            <article
              key={clause.id}
              ref={(el) => {
                if (el) clauseRefs.current.set(clause.id, el)
              }}
              onClick={() => onClauseSelect(clause.id)}
              className={cn(
                "relative -mx-2 px-3 py-4 rounded-xl cursor-pointer",
                "transition-all duration-200",
                "active:scale-[0.995]",
                isActive ? "bg-highlight/60 shadow-sm ring-1 ring-border/40" : "hover:bg-highlight/30",
              )}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {/* Risk indicator bar */}
              <div
                className={cn(
                  "absolute left-0 top-3 bottom-3 w-1 rounded-full transition-all duration-200",
                  clause.riskLevel === "high" && "bg-[var(--risk-high)]",
                  clause.riskLevel === "medium" && "bg-[var(--risk-medium)]",
                  clause.riskLevel === "low" && "bg-[var(--risk-low)]/50",
                )}
              />

              {/* Clause header */}
              <div className="flex items-center gap-2 mb-2 pl-2">
                <span className="font-mono text-[10px] text-muted-foreground/60 tracking-wide">
                  {clause.clauseNumber}
                </span>
                {clause.riskLevel !== "low" && (
                  <span
                    className={cn(
                      "text-[9px] font-medium px-1.5 py-0.5 rounded-full",
                      clause.riskLevel === "high"
                        ? "bg-[var(--risk-high-bg)] text-[var(--risk-high)]"
                        : "bg-[var(--risk-medium-bg)] text-[var(--risk-medium)]",
                    )}
                  >
                    {clause.riskLevel === "high" ? "Review" : "Note"}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[var(--brand)] ml-auto" />}
              </div>

              {/* Clause title */}
              <h2 className="font-serif text-base text-paper-foreground mb-3 pl-2 text-pretty pr-6">{clause.title}</h2>

              {/* Clause text preview */}
              <div className="font-serif text-[13px] text-paper-foreground/75 leading-[1.7] pl-2 line-clamp-4">
                {clause.originalText}
              </div>
            </article>
          )
        })}
      </div>

      {/* Document Footer */}
      <footer className="mt-12 pt-6 border-t border-highlight-border">
        <p className="font-serif text-xs text-muted-foreground/50 text-center">End of Document</p>
      </footer>
    </div>
  )
}

// Explanation Frame Component
function ExplanationFrame({
  clause,
  totalClauses,
  currentIndex,
  onNavigate,
}: {
  clause: Clause | undefined
  totalClauses: number
  currentIndex: number
  onNavigate: (direction: "prev" | "next") => void
}) {
  const [expandedDefinitions, setExpandedDefinitions] = useState<Set<string>>(new Set())
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])

  if (!clause) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-background animate-fade-in">
        <MessageSquareText className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="font-serif text-lg text-foreground text-center mb-2">Select a clause</p>
        <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
          Choose a clause from the Document or Clauses view to see its plain-language explanation.
        </p>
      </div>
    )
  }

  const toggleDefinition = (term: string) => {
    setExpandedDefinitions((prev) => {
      const next = new Set(prev)
      if (next.has(term)) next.delete(term)
      else next.add(term)
      return next
    })
  }

  const toggleQuestion = (question: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(question)) next.delete(question)
      else next.add(question)
      return next
    })
  }

  const handleAskHoward = () => {
    if (!aiQuestion.trim()) return

    // Add user message
    setAiMessages((prev) => [...prev, { role: "user", content: aiQuestion }])

    // Simulate AI response
    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Based on ${clause.clauseNumber} (${clause.title}), ${aiQuestion.toLowerCase().includes("risk") ? "the main risk here is that " + clause.whyMatters[0]?.toLowerCase() : "this clause essentially means that " + clause.plainMeaning.toLowerCase()} If you have specific concerns, I recommend consulting with a qualified attorney.`,
        },
      ])
    }, 800)

    setAiQuestion("")
  }

  const getRiskStyles = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return {
          bg: "bg-[var(--risk-high-bg)]",
          border: "border-[var(--risk-high-border)]",
          text: "text-[var(--risk-high)]",
          icon: AlertCircle,
          label: "Higher exposure",
        }
      case "medium":
        return {
          bg: "bg-[var(--risk-medium-bg)]",
          border: "border-[var(--risk-medium-border)]",
          text: "text-[var(--risk-medium)]",
          icon: Info,
          label: "Standard terms",
        }
      default:
        return {
          bg: "bg-[var(--risk-low-bg)]",
          border: "border-[var(--risk-low-border)]",
          text: "text-[var(--risk-low)]",
          icon: CheckCircle,
          label: "Lower risk",
        }
    }
  }

  const riskStyles = getRiskStyles(clause.riskLevel)
  const RiskIcon = riskStyles.icon

  return (
    <div className="h-full flex flex-col bg-background animate-fade-in">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              Clause {currentIndex + 1} of {totalClauses}
            </span>
          </div>

          <h2 className="font-serif text-xl text-foreground mb-1">{clause.humanTitle}</h2>
          <p className="text-sm text-muted-foreground mb-4">{clause.subtitle}</p>

          {/* Risk Badge */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
                riskStyles.bg,
                riskStyles.border,
                riskStyles.text,
              )}
            >
              <RiskIcon className="w-3 h-3" />
              {riskStyles.label}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] bg-[var(--info-bg)] border border-[var(--info-border)] text-[var(--info)] font-medium">
              Favors {clause.favors}
            </span>
          </div>

          {/* Plain Meaning */}
          <section className="mb-6">
            <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">
              In plain terms
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-foreground/90 mb-2">What this means</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{clause.plainMeaning}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground/90 mb-2">Why this matters</h4>
                {clause.whyMatters.map((point, i) => (
                  <p
                    key={i}
                    className={cn(
                      "text-sm text-muted-foreground leading-relaxed mb-2 pl-3 border-l-2",
                      clause.riskLevel === "high" ? "border-[var(--risk-high)]/30" : "border-border/60",
                    )}
                  >
                    {point}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {/* Key Terms */}
          {clause.definitions && clause.definitions.length > 0 && (
            <section className="mb-6">
              <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">Key terms</h3>
              <div className="border border-border/60 rounded-lg divide-y divide-border/60 overflow-hidden">
                {clause.definitions.map((def) => (
                  <div key={def.term}>
                    <button
                      onClick={() => toggleDefinition(def.term)}
                      className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground/90">{def.term}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground/50 transition-transform",
                          expandedDefinitions.has(def.term) && "rotate-180",
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        expandedDefinitions.has(def.term) ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                      )}
                    >
                      <div className="px-3 pb-3 space-y-2 bg-[var(--info-bg)]/30">
                        <p className="text-xs text-foreground/80">{def.plainMeaning}</p>
                        <p className="text-xs text-muted-foreground italic">{def.example}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Q&A */}
          {clause.questions && clause.questions.length > 0 && (
            <section className="mb-6">
              <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-medium">
                Common questions
              </h3>
              <div className="space-y-2">
                {clause.questions.map((qa) => (
                  <div key={qa.question} className="border border-border/60 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleQuestion(qa.question)}
                      className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-sm text-foreground/90 pr-2">{qa.question}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground/50 shrink-0 transition-transform",
                          expandedQuestions.has(qa.question) && "rotate-180",
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        expandedQuestions.has(qa.question) ? "max-h-48 opacity-100" : "max-h-0 opacity-0",
                      )}
                    >
                      <div className="px-3 pb-3 bg-secondary/20">
                        <p className="text-sm text-muted-foreground leading-relaxed">{qa.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-6">
            <button
              onClick={() => setAiChatOpen(!aiChatOpen)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[var(--brand-light)] to-[var(--info-bg)] rounded-xl border border-[var(--brand)]/20 hover:border-[var(--brand)]/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--info)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Ask Howard</p>
                  <p className="text-xs text-muted-foreground">Get AI-powered answers about this clause</p>
                </div>
              </div>
              <ChevronDown
                className={cn("w-5 h-5 text-[var(--brand)] transition-transform", aiChatOpen && "rotate-180")}
              />
            </button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                aiChatOpen ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0",
              )}
            >
              <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
                {/* Chat Messages */}
                <div className="max-h-48 overflow-y-auto p-4 space-y-3">
                  {aiMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Ask Howard anything about "{clause.title}"
                    </p>
                  ) : (
                    aiMessages.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[85%] px-3 py-2 rounded-xl text-sm",
                            msg.role === "user" ? "bg-[var(--brand)] text-white" : "bg-secondary/50 text-foreground",
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border/60 bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAskHoward()}
                      placeholder="Ask about this clause..."
                      className="flex-1 px-3 py-2 text-sm bg-background border border-border/60 rounded-lg focus:outline-none focus:border-[var(--brand)] transition-colors"
                    />
                    <button
                      onClick={handleAskHoward}
                      disabled={!aiQuestion.trim()}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
                    AI responses are for informational purposes only
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="px-4 py-3 border-t border-border/60 bg-sidebar/80 flex items-center justify-between shrink-0">
        <button
          onClick={() => onNavigate("prev")}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <span className="text-xs text-muted-foreground font-medium">
          {currentIndex + 1} / {totalClauses}
        </span>
        <button
          onClick={() => onNavigate("next")}
          disabled={currentIndex === totalClauses - 1}
          className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Clauses Frame Component - List view
function ClausesFrame({
  clauses,
  activeClauseId,
  reviewedClauses,
  onClauseSelect,
}: {
  clauses: Clause[]
  activeClauseId: string | null
  reviewedClauses: Set<string>
  onClauseSelect: (clauseId: string) => void
}) {
  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return { dot: "bg-[var(--risk-high)]", label: "Review carefully", text: "text-[var(--risk-high)]" }
      case "medium":
        return { dot: "bg-[var(--risk-medium)]", label: "Worth noting", text: "text-[var(--risk-medium)]" }
      default:
        return { dot: "bg-[var(--risk-low)]", label: null, text: null }
    }
  }

  return (
    <div className="min-h-full bg-background animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-4 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center gap-2 mb-1">
          <List className="w-4 h-4 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">All Clauses</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-lg font-semibold text-foreground">Document Clauses</h2>
          <span className="text-xs text-muted-foreground">
            <span className="text-[var(--success)] font-medium">{reviewedClauses.size}</span>/{clauses.length} reviewed
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--success)] rounded-full transition-all duration-500"
            style={{ width: `${(reviewedClauses.size / clauses.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Clause list */}
      <div className="px-4 py-4 space-y-2">
        {clauses.map((clause, index) => {
          const riskConfig = getRiskConfig(clause.riskLevel)
          const isActive = activeClauseId === clause.id
          const isReviewed = reviewedClauses.has(clause.id)

          return (
            <button
              key={clause.id}
              onClick={() => onClauseSelect(clause.id)}
              className={cn(
                "w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200",
                "active:scale-[0.98]",
                isActive ? "bg-highlight/60 shadow-sm ring-1 ring-border/40" : "hover:bg-highlight/30",
              )}
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <div className="flex items-start gap-3">
                {/* Risk indicator */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    clause.riskLevel === "high" && "bg-[var(--risk-high)]",
                    clause.riskLevel === "medium" && "bg-[var(--risk-medium)]",
                    clause.riskLevel === "low" && "bg-[var(--risk-low)]/50",
                  )}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-serif text-sm font-medium text-foreground truncate">{clause.title}</span>
                    {isReviewed && <CheckCircle className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{clause.clauseNumber}</span>
                    {riskConfig.label && (
                      <span className={cn("text-[10px] font-medium", riskConfig.text)}>{riskConfig.label}</span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  className={cn(
                    "w-4 h-4 text-muted-foreground/50 shrink-0 transition-colors",
                    isActive && "text-[var(--brand)]",
                  )}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Overview Frame Component
function OverviewFrame({
  clauses,
  reviewedClauses,
}: {
  clauses: Clause[]
  reviewedClauses: Set<string>
}) {
  const highRiskClauses = clauses.filter((c) => c.riskLevel === "high")
  const mediumRiskClauses = clauses.filter((c) => c.riskLevel === "medium")
  const lowRiskClauses = clauses.filter((c) => c.riskLevel === "low")
  const progressPercent = Math.round((reviewedClauses.size / clauses.length) * 100)

  return (
    <div className="h-full overflow-y-auto bg-background animate-fade-in">
      {/* Hero Section */}
      <div className="relative px-4 py-8 bg-gradient-to-b from-[var(--brand-light)] to-background border-b border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <LayoutGrid className="w-4 h-4 text-[var(--brand)]" />
          <span className="text-[10px] text-[var(--brand)] uppercase tracking-wider font-semibold">
            Document Summary
          </span>
        </div>
        <h2 className="font-serif text-2xl text-foreground mb-2">Software License Agreement</h2>
        <p className="text-sm text-muted-foreground">Enterprise software licensing and service terms</p>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 border border-border/40">
            <p className="text-2xl font-semibold text-foreground">{clauses.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Clauses</p>
          </div>
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 border border-border/40">
            <p className="text-2xl font-semibold text-[var(--risk-high)]">{highRiskClauses.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">High Risk</p>
          </div>
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 border border-border/40">
            <p className="text-2xl font-semibold text-[var(--success)]">{progressPercent}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Reviewed</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Review Progress Card */}
        <div className="p-5 bg-card rounded-2xl border border-border/40 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Review Progress</h3>
            <span className="text-sm font-medium text-[var(--success)]">
              {reviewedClauses.size}/{clauses.length}
            </span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[var(--success)] to-[var(--info)] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {clauses.length - reviewedClauses.size === 0
              ? "All clauses reviewed. Ready for final assessment."
              : `${clauses.length - reviewedClauses.size} clause${clauses.length - reviewedClauses.size > 1 ? "s" : ""} remaining for complete review.`}
          </p>
        </div>

        {/* Risk Distribution */}
        <div className="p-5 bg-card rounded-2xl border border-border/40 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Risk Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[var(--risk-high)]" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">High Attention</span>
                  <span className="text-xs text-muted-foreground">{highRiskClauses.length}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--risk-high)] rounded-full"
                    style={{ width: `${(highRiskClauses.length / clauses.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[var(--risk-medium)]" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">Worth Noting</span>
                  <span className="text-xs text-muted-foreground">{mediumRiskClauses.length}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--risk-medium)] rounded-full"
                    style={{ width: `${(mediumRiskClauses.length / clauses.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[var(--risk-low)]" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">Standard Terms</span>
                  <span className="text-xs text-muted-foreground">{lowRiskClauses.length}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--risk-low)] rounded-full"
                    style={{ width: `${(lowRiskClauses.length / clauses.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Attention Items */}
        {highRiskClauses.length > 0 && (
          <div className="p-5 bg-gradient-to-br from-[var(--risk-high-bg)] to-card rounded-2xl border border-[var(--risk-high-border)] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-[var(--risk-high)]" />
              <h3 className="text-sm font-semibold text-foreground">Requires Attention</h3>
            </div>
            <ul className="space-y-2">
              {highRiskClauses.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--risk-high)] mt-2 shrink-0" />
                  <span>{c.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Obligations */}
        <div className="p-5 bg-card rounded-2xl border border-border/40 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4">Key Obligations</h3>
          <ul className="space-y-3">
            {[
              "License fees payable within 30 days of invoice",
              "Confidentiality obligations extend 5 years post-termination",
              "Broad indemnification requirements for IP infringement",
              "Limitation of liability capped at fees paid",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                <span className="w-6 h-6 rounded-full bg-[var(--brand-light)] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-[var(--brand)]">{i + 1}</span>
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Powered by Howard */}
        <div className="flex items-center justify-center gap-2 py-4">
          <Sparkles className="w-4 h-4 text-[var(--brand)]" />
          <span className="text-xs text-muted-foreground">Analysis powered by Howard AI</span>
        </div>

        {/* Disclaimer */}
        <footer className="pt-4 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed text-center">
            This overview is generated for informational purposes only and does not constitute legal advice. Consult
            with qualified legal counsel before making decisions based on this analysis.
          </p>
        </footer>
      </div>
    </div>
  )
}
