"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileText, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function NewAnalysisTab() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setUploadedFile(files[0])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setUploadedFile(files[0])
    }
  }, [])

  return (
    <div className="flex flex-col items-center">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "w-full max-w-2xl relative rounded-2xl border-2 border-dashed transition-all duration-300",
          "bg-card/50 hover:bg-card",
          isDragging
            ? "border-[var(--brand)] bg-[var(--brand-light)] scale-[1.02]"
            : "border-border/60 hover:border-border",
        )}
      >
        <label className="flex flex-col items-center justify-center py-16 md:py-20 cursor-pointer">
          <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileSelect} />

          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
              isDragging ? "bg-[var(--brand)] scale-110" : "bg-accent/60",
            )}
          >
            <Upload className={cn("w-7 h-7 transition-colors", isDragging ? "text-white" : "text-muted-foreground")} />
          </div>

          <h3 className="text-lg font-medium text-foreground mb-2">
            {uploadedFile ? uploadedFile.name : "Drop your document here"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {uploadedFile
              ? `${(uploadedFile.size / 1024).toFixed(1)} KB · Ready to analyze`
              : "or click to browse · PDF, DOC, DOCX, TXT"}
          </p>

          {uploadedFile ? (
            <Button className="rounded-full px-6 gap-2 bg-foreground text-background hover:bg-foreground/90">
              <Sparkles className="w-4 h-4" />
              Start Analysis
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="outline" className="rounded-full px-6 bg-transparent">
              Browse Files
            </Button>
          )}
        </label>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Quick start:</span>
        {["NDA", "Employment Contract", "Lease Agreement", "Terms of Service"].map((type) => (
          <button
            key={type}
            className="px-4 py-2 text-sm text-muted-foreground bg-card border border-border/60 rounded-full hover:bg-accent/50 hover:text-foreground transition-all"
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            {type}
          </button>
        ))}
      </div>
    </div>
  )
}
