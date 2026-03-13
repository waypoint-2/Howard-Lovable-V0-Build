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
import { clauses as defaultClauses, type Clause } from "@/lib/legal-data"
import { Menu } from "lucide-react"

interface LegalTranslatorProps {
  documentData?: {
    clauses: Clause[]
    filename: string
    documentTitle?: string
  } | null
}

export function LegalTranslator({ documentData }: LegalTranslatorProps) {
  const clauses = documentData?.clauses?.length ? documentData.clauses : defaultClauses
  const documentTitle = documentData?.documentTitle || documentData?.filename || "Document Review"

  const [activeClauseId, setActiveClauseId] = useState<string | null>(clauses[0]?.id || "clause-1")
  const [documentLoaded, setDocumentLoaded] = useState(true)
  const [readingMode, setReadingMode] = useState<"reading" | "overview">("reading")
  const [reviewedClauses, setReviewedClauses] = useState<Set<string>>(new Set())
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (clauses.length > 0) {
      setActiveClauseId(clauses[0].id)
      setReviewedClauses(new Set())
    }
  }, [documentData])

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
    [activeClauseId, handleClauseSelect, clauses],
  )

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      handleClauseSelect(clauses[currentIndex - 1].id)
    }
  }, [currentIndex, handleClauseSelect, clauses])

  const goToNext = useCallback(() => {
    if (currentIndex < clauses.length - 1) {
      handleClauseSelect(clauses[currentIndex + 1].id)
    }
  }, [currentIndex, handleClauseSelect, clauses])

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
      <div className="hidden lg:block relative z-50">
        <AppNav documentTitle={documentTitle} />
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
            <p className="font-serif text-sm text-foreground leading-tight truncate">{documentTitle}</p>
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
                  documentTitle={documentTitle}
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
