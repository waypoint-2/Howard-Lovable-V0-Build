"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Clause } from "@/lib/legal-data"
import {
  X,
  ChevronLeft,
  FileText,
  Upload,
  Download,
  Share2,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Settings,
  Bell,
  LogOut,
} from "lucide-react"

interface MobileNavDrawerProps {
  isOpen: boolean
  onClose: () => void
  clauses: Clause[]
  activeClauseId: string | null
  reviewedClauses: Set<string>
  onClauseSelect: (clauseId: string) => void
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  clauses,
  activeClauseId,
  reviewedClauses,
  onClauseSelect,
}: MobileNavDrawerProps) {
  const [fileActionsOpen, setFileActionsOpen] = useState(false)
  const [clauseNavOpen, setClauseNavOpen] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)

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

  const handleClauseClick = (clauseId: string) => {
    onClauseSelect(clauseId)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-sidebar z-50",
          "flex flex-col shadow-2xl",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navigation menu"
      >
        {/* Header - mirrors desktop AppNav left section */}
        <header className="p-4 border-b border-sidebar-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/landing"
                className="w-8 h-8 bg-foreground/90 rounded-full flex items-center justify-center hover:bg-foreground transition-colors active:scale-95"
                aria-label="Back to home"
                onClick={onClose}
              >
                <ChevronLeft className="w-4 h-4 text-background" />
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg tracking-tight text-sidebar-foreground">Howard</span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase bg-[var(--brand-light)] text-[var(--brand)] rounded">
                  Pro
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors active:scale-95"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* AI Status indicator - mirrors desktop */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-[10px] font-medium tracking-wide">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-subtle-pulse" />
              <span className="text-[var(--success)]">Saved</span>
            </span>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto legal-scroll">
          {/* Document Section - mirrors desktop file dropdown */}
          <div className="border-b border-sidebar-border">
            <button
              onClick={() => setFileActionsOpen(!fileActionsOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors active:bg-sidebar-accent"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium text-sidebar-foreground">Current Document</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">Software License Agreement</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  fileActionsOpen && "rotate-180",
                )}
              />
            </button>

            {/* File Actions - expanded state */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                fileActionsOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="px-4 pb-3 space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent/80 rounded-lg transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  Upload new document
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent/80 rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  Export translations
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent/80 rounded-lg transition-colors">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                  Share document
                </button>
              </div>
            </div>
          </div>

          {/* Clause Navigation Section - mirrors desktop ClauseNavigation */}
          <div className="border-b border-sidebar-border">
            <button
              onClick={() => setClauseNavOpen(!clauseNavOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors active:bg-sidebar-accent"
            >
              <div>
                <p className="text-sm font-medium text-sidebar-foreground text-left">Document Clauses</p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-[var(--success)] font-medium">{reviewedClauses.size}</span> of {clauses.length}{" "}
                  reviewed
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  clauseNavOpen && "rotate-180",
                )}
              />
            </button>

            {/* Clause List */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                clauseNavOpen ? "max-h-[50vh] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <nav className="px-2 pb-3 overflow-y-auto max-h-[50vh]">
                <ul className="space-y-0.5">
                  {clauses.map((clause, index) => {
                    const riskIndicator = getRiskIndicator(clause.riskLevel)
                    const isActive = activeClauseId === clause.id
                    const isReviewed = reviewedClauses.has(clause.id)

                    return (
                      <li key={clause.id}>
                        <button
                          onClick={() => handleClauseClick(clause.id)}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group",
                            "active:scale-[0.98]",
                            isActive ? "bg-sidebar-accent shadow-sm" : "hover:bg-sidebar-accent/50",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {/* Risk indicator dot */}
                            {riskIndicator ? (
                              <span className={cn("w-2 h-2 rounded-full mt-1 shrink-0", riskIndicator.dot)} />
                            ) : (
                              <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-border" />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-serif text-sm text-sidebar-foreground leading-snug line-clamp-2">
                                  {clause.title}
                                </span>
                                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />}
                              </div>
                              {riskIndicator && (
                                <span className={cn("text-[10px] mt-0.5 block font-medium", riskIndicator.text)}>
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
            </div>
          </div>

          {/* Progress Section */}
          <div className="px-4 py-4 border-b border-sidebar-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Review Progress</p>
            <div className="mb-2">
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--success)] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(reviewedClauses.size / clauses.length) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-[var(--success)] font-medium">{reviewedClauses.size}</span> of {clauses.length}{" "}
              clauses reviewed
            </p>
          </div>

          <div className="border-b border-sidebar-border">
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors active:bg-sidebar-accent"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">JD</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-sidebar-foreground">John Doe</p>
                  <p className="text-xs text-muted-foreground">john@example.com</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  accountOpen && "rotate-180",
                )}
              />
            </button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                accountOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="px-4 pb-3 space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent/80 rounded-lg transition-colors">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Settings
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent/80 rounded-lg transition-colors">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  Notifications
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent/80 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - mirrors desktop AppNav right section */}
        <footer className="p-4 border-t border-sidebar-border shrink-0 safe-area-bottom">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors active:bg-sidebar-accent/80">
            <HelpCircle className="w-4 h-4" />
            Help & Support
          </button>
        </footer>
      </aside>
    </>
  )
}
