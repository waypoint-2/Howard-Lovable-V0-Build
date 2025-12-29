"use client"

import { useState } from "react"
import { ChevronDown, AlertCircle, Info, CheckCircle, Sparkles, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Clause } from "@/lib/legal-data"

interface InterpretationPanelProps {
  clause: Clause | undefined
  totalClauses: number
}

export function InterpretationPanel({ clause, totalClauses }: InterpretationPanelProps) {
  const [expandedDefinitions, setExpandedDefinitions] = useState<Set<string>>(new Set())
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [aiChatOpen, setAiChatOpen] = useState(false)
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])

  if (!clause) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-background">
        <p className="text-muted-foreground/60 text-sm animate-subtle-pulse text-center">
          Select a clause to view its interpretation
        </p>
      </div>
    )
  }

  const toggleDefinition = (term: string) => {
    setExpandedDefinitions((prev) => {
      const next = new Set(prev)
      if (next.has(term)) {
        next.delete(term)
      } else {
        next.add(term)
      }
      return next
    })
  }

  const toggleQuestion = (question: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(question)) {
        next.delete(question)
      } else {
        next.add(question)
      }
      return next
    })
  }

  const handleAskHoward = () => {
    if (!aiQuestion.trim()) return

    setAiMessages((prev) => [...prev, { role: "user", content: aiQuestion }])

    setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Based on ${clause.clauseNumber} (${clause.title}), ${aiQuestion.toLowerCase().includes("risk") ? "the primary risk consideration is that " + clause.whyMatters[0]?.toLowerCase() : "this provision essentially establishes that " + clause.plainMeaning.toLowerCase()} For specific legal guidance, please consult with a qualified attorney.`,
        },
      ])
    }, 800)

    setAiQuestion("")
  }

  const clauseNumber = Number.parseInt(clause.clauseNumber.replace("§ ", ""))

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
    <div key={clause.id} className="h-full overflow-y-auto legal-scroll bg-background">
      <div className="p-5 md:p-8 animate-fade-in-up">
        {/* Reading State Indicator */}
        <div className="mb-4 md:mb-6">
          <p className="text-[10px] md:text-[11px] text-muted-foreground/60 font-mono tracking-wide">
            Clause {clauseNumber} of {totalClauses}
          </p>
        </div>

        {/* Clause Header */}
        <header className="mb-6 md:mb-8">
          <h2 className="font-sans text-lg md:text-xl font-medium text-foreground mb-1 text-balance">
            {clause.humanTitle}
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground/80">{clause.subtitle}</p>

          <div className="mt-4 md:mt-5 flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-full text-[10px] md:text-[11px] font-medium tracking-wide border transition-all duration-200",
                riskStyles.bg,
                riskStyles.border,
                riskStyles.text,
              )}
            >
              <RiskIcon className="w-3 h-3" />
              {riskStyles.label}
            </span>
            <span className="inline-flex items-center px-2 md:px-2.5 py-1 rounded-full text-[10px] md:text-[11px] bg-[var(--info-bg)] border border-[var(--info-border)] text-[var(--info)] font-medium tracking-wide">
              Favors {clause.favors}
            </span>
          </div>
        </header>

        {/* Context Before Detail */}
        <section className="mb-6 md:mb-8">
          <p className="text-[10px] md:text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-3 md:mb-4 font-medium">
            In plain terms
          </p>

          <div className="space-y-4 md:space-y-5">
            <div>
              <h3 className="text-xs md:text-sm font-medium text-foreground/90 mb-2">What this means</h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{clause.plainMeaning}</p>
            </div>

            <div>
              <h3 className="text-xs md:text-sm font-medium text-foreground/90 mb-2">Why this matters</h3>
              {clause.whyMatters.map((point, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-xs md:text-sm text-muted-foreground leading-relaxed mb-2 pl-3 border-l-2 transition-colors duration-200",
                    clause.riskLevel === "high"
                      ? "border-[var(--risk-high)]/30"
                      : clause.riskLevel === "medium"
                        ? "border-[var(--risk-medium)]/30"
                        : "border-border/60",
                  )}
                >
                  {point}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Notable Characteristics */}
        {clause.riskLevel !== "low" && clause.notableCharacteristics && (
          <section className="mb-6 md:mb-8">
            <h3 className="text-[10px] md:text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-3 md:mb-4 font-medium">
              Worth knowing
            </h3>
            <div
              className={cn(
                "rounded-lg p-3 md:p-4 border",
                clause.riskLevel === "high"
                  ? "bg-[var(--risk-high-bg)] border-[var(--risk-high-border)]"
                  : "bg-[var(--warning-bg)] border-[var(--warning-border)]",
              )}
            >
              <ul className="space-y-2">
                {clause.notableCharacteristics.map((char, i) => (
                  <li
                    key={i}
                    className={cn(
                      "text-xs md:text-sm leading-relaxed flex items-start gap-2",
                      clause.riskLevel === "high" ? "text-[var(--risk-high)]" : "text-[var(--warning)]",
                    )}
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                    <span className="text-foreground/80">{char}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Definitions Panel */}
        {clause.definitions && clause.definitions.length > 0 && (
          <section className="mb-6 md:mb-8">
            <h3 className="text-[10px] md:text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-3 md:mb-4 font-medium">
              Key terms
            </h3>
            <div className="border border-border/60 rounded-lg divide-y divide-border/60 overflow-hidden">
              {clause.definitions.map((def) => (
                <div key={def.term}>
                  <button
                    onClick={() => toggleDefinition(def.term)}
                    className="w-full flex items-center justify-between px-3 md:px-4 py-3 text-left hover:bg-[var(--info-bg)]/50 active:bg-[var(--info-bg)]/70 transition-colors duration-200"
                  >
                    <span className="text-xs md:text-sm font-medium text-foreground/90">{def.term}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted-foreground/50 transition-transform duration-200",
                        expandedDefinitions.has(def.term) && "rotate-180",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      expandedDefinitions.has(def.term) ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                    )}
                  >
                    <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-3 bg-[var(--info-bg)]/30">
                      <div>
                        <p className="text-[10px] text-[var(--info)] uppercase tracking-wider mb-1 font-medium">
                          Plain English
                        </p>
                        <p className="text-xs md:text-sm text-foreground/80">{def.plainMeaning}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--info)] uppercase tracking-wider mb-1 font-medium">
                          Example
                        </p>
                        <p className="text-xs md:text-sm text-foreground/80">{def.example}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Clause-Specific Q&A */}
        {clause.questions && clause.questions.length > 0 && (
          <section className="mb-6 md:mb-8">
            <h3 className="text-[10px] md:text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-3 md:mb-4 font-medium">
              Common questions
            </h3>
            <div className="space-y-2">
              {clause.questions.map((qa) => (
                <div key={qa.question} className="border border-border/60 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleQuestion(qa.question)}
                    className="w-full flex items-center justify-between px-3 md:px-4 py-3 text-left hover:bg-accent/50 active:bg-accent/70 transition-colors duration-200"
                  >
                    <span className="text-xs md:text-sm text-foreground/90 pr-2">{qa.question}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted-foreground/50 flex-shrink-0 transition-transform duration-200",
                        expandedQuestions.has(qa.question) && "rotate-180",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      expandedQuestions.has(qa.question) ? "max-h-48 opacity-100" : "max-h-0 opacity-0",
                    )}
                  >
                    <div className="px-3 md:px-4 pb-3 md:pb-4 bg-secondary/20">
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{qa.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-6 md:mb-8">
          <button
            onClick={() => setAiChatOpen(!aiChatOpen)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[var(--brand-light)] to-[var(--info-bg)] rounded-xl border border-[var(--brand)]/20 hover:border-[var(--brand)]/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--info)] flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Ask Howard</p>
                <p className="text-xs text-muted-foreground">Get AI-powered answers about this clause</p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-[var(--brand)] transition-transform duration-200",
                aiChatOpen && "rotate-180",
              )}
            />
          </button>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              aiChatOpen ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0",
            )}
          >
            <div className="bg-card rounded-xl border border-border/60 overflow-hidden shadow-sm">
              {/* Chat Messages */}
              <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                {aiMessages.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-[var(--brand-light)] flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-[var(--brand)]" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Ask Howard anything</p>
                    <p className="text-xs text-muted-foreground">About "{clause.title}"</p>
                  </div>
                ) : (
                  aiMessages.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-[var(--brand)] text-white rounded-br-md"
                            : "bg-secondary/50 text-foreground rounded-bl-md",
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border/60 bg-secondary/10">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAskHoward()}
                    placeholder="Ask about this clause..."
                    className="flex-1 px-4 py-2.5 text-sm bg-background border border-border/60 rounded-xl focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 transition-all"
                  />
                  <button
                    onClick={handleAskHoward}
                    disabled={!aiQuestion.trim()}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--brand)] text-white hover:bg-[var(--brand)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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

        {/* Clause Provenance */}
        <footer className="pt-4 md:pt-6 border-t border-border/40">
          <p className="text-[10px] md:text-[11px] text-muted-foreground/50">
            Based on {clause.clauseNumber} and defined terms only.
          </p>
        </footer>
      </div>
    </div>
  )
}
