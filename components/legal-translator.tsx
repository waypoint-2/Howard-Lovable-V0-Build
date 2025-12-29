"use client"

import { useState, useEffect, useCallback } from "react"
import { ClauseNavigation } from "./clause-navigation"
import { OriginalDocument } from "./original-document"
import { InterpretationPanel } from "./interpretation-panel"
import { EmptyState } from "./empty-state"
import { ReadingModeToggle } from "./reading-mode-toggle"
import { AppNav } from "./app-nav"
import { MobileMultiFrame } from "./mobile-multi-frame"
import { MobileNavDrawer } from "./mobile-nav-drawer"
import { DocumentOverview } from "./document-overview"
import { clauses } from "@/lib/legal-data"
import { Menu } from "lucide-react"

export function LegalTranslator() {
  const [activeClauseId, setActiveClauseId] = useState<string | null>("clause-7")
  const [documentLoaded, setDocumentLoaded] = useState(true)
  const [readingMode, setReadingMode] = useState<"reading" | "overview">("reading")
  const [reviewedClauses, setReviewedClauses] = useState<Set<string>>(
    new Set(["clause-1", "clause-2", "clause-3", "clause-4", "clause-5", "clause-6"]),
  )
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const activeClause = clauses.find((c) => c.id === activeClauseId)
  const currentIndex = clauses.findIndex((c) => c.id === activeClauseId)

  const handleClauseSelect = useCallback((clauseId: string) => {
    setActiveClauseId(clauseId)
    setReviewedClauses((prev) => new Set([...prev, clauseId]))
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!activeClauseId) return
      const currentIndex = clauses.findIndex((c) => c.id === activeClauseId)
      if (e.key === "ArrowDown" && currentIndex < clauses.length - 1) {
        e.preventDefault()
        handleClauseSelect(clauses[currentIndex + 1].id)
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        e.preventDefault()
        handleClauseSelect(clauses[currentIndex - 1].id)
      }
    },
    [activeClauseId, handleClauseSelect],
  )

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      handleClauseSelect(clauses[currentIndex - 1].id)
    }
  }, [currentIndex, handleClauseSelect])

  const goToNext = useCallback(() => {
    if (currentIndex < clauses.length - 1) {
      handleClauseSelect(clauses[currentIndex + 1].id)
    }
  }, [currentIndex, handleClauseSelect])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!documentLoaded) {
    return <EmptyState onUpload={() => setDocumentLoaded(true)} />
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Desktop Nav - hidden on mobile */}
      <div className="hidden lg:block">
        <AppNav />
      </div>

      <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/60">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl hover:bg-accent/50 active:scale-95 transition-all"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-foreground/70" />
          </button>
          <div className="flex-1 text-center px-2">
            <p className="font-serif text-sm text-foreground leading-tight truncate">Software License Agreement</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
              {reviewedClauses.size} of {clauses.length} clauses reviewed
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/60 flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">JD</span>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        clauses={clauses}
        activeClauseId={activeClauseId}
        reviewedClauses={reviewedClauses}
        onClauseSelect={(id) => {
          handleClauseSelect(id)
          setMobileNavOpen(false)
        }}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop: Left Column - Document Navigation */}
        <div className="hidden lg:block shrink-0">
          <ClauseNavigation
            clauses={clauses}
            activeClauseId={activeClauseId}
            reviewedClauses={reviewedClauses}
            onClauseSelect={handleClauseSelect}
          />
        </div>

        {/* Desktop Main Workspace */}
        <div className="hidden lg:flex flex-col flex-1 min-w-0 relative">
          <div className="absolute top-4 right-6 z-10">
            <ReadingModeToggle mode={readingMode} onModeChange={setReadingMode} />
          </div>

          {readingMode === "reading" ? (
            <div className="flex flex-1 min-h-0">
              <div className="flex-1 min-w-0">
                <OriginalDocument
                  clauses={clauses}
                  activeClauseId={activeClauseId}
                  onClauseSelect={handleClauseSelect}
                />
              </div>
              <div className="w-[420px] xl:w-[480px] shrink-0 border-l border-border">
                <InterpretationPanel clause={activeClause} totalClauses={clauses.length} />
              </div>
            </div>
          ) : (
            <DocumentOverview
              reviewedCount={reviewedClauses.size}
              totalClauses={clauses.length}
              onSwitchToReading={() => setReadingMode("reading")}
            />
          )}
        </div>

        <div className="lg:hidden flex-1 min-h-0">
          <MobileMultiFrame
            clauses={clauses}
            activeClause={activeClause}
            activeClauseId={activeClauseId}
            currentIndex={currentIndex}
            reviewedClauses={reviewedClauses}
            onClauseSelect={handleClauseSelect}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        </div>
      </div>
    </div>
  )
}
