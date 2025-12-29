"use client"

import { Upload } from "lucide-react"

interface EmptyStateProps {
  onUpload: () => void
}

export function EmptyState({ onUpload }: EmptyStateProps) {
  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <header className="lg:hidden px-4 py-3 border-b border-border/60">
        <p className="font-serif text-lg tracking-tight text-foreground">Howard</p>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="font-serif text-xl md:text-2xl text-foreground mb-3 text-balance">Review a legal document</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Upload an agreement to see a plain-language interpretation alongside the original text.
          </p>
          <button
            onClick={onUpload}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>
    </div>
  )
}
