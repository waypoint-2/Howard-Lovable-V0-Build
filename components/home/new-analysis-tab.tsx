"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type UploadState = "idle" | "uploading" | "analyzing" | "complete" | "error"

export function NewAnalysisTab() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setUploadState("idle")
      setError(null)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setUploadedFile(files[0])
      setUploadState("idle")
      setError(null)
    }
  }, [])

  const handleBrowseClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fileInputRef.current?.click()
  }, [])

  const startAnalysis = async () => {
    if (!uploadedFile) return

    setError(null)
    setUploadState("uploading")
    setProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 40))
      }, 200)

      // Upload file to Blob storage + extract text
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(50)

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const uploadResult = await uploadResponse.json()
      const { rawText, fileBase64, fileType, documentId } = uploadResult

      setUploadState("analyzing")

      // Analyze with AI
      const analysisInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90))
      }, 300)

      const analyzeResponse = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rawText, 
          fileBase64,
          fileType,
          filename: uploadedFile.name, 
          documentId 
        }),
      })

      clearInterval(analysisInterval)
      setProgress(100)

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const result = await analyzeResponse.json()

      // Store analysis result in sessionStorage for the review page
      sessionStorage.setItem(
        "analyzedDocument",
        JSON.stringify({
          clauses: result.clauses,
          filename: result.filename,
          documentId: result.documentId,
          analyzedAt: result.analyzedAt,
        }),
      )

      setUploadState("complete")

      // Redirect to the document review page
      router.push("/review")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setUploadState("error")
    }
  }

  const resetAnalysis = () => {
    setUploadedFile(null)
    setUploadState("idle")
    setProgress(0)
    setError(null)
  }

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
          uploadState === "uploading" || uploadState === "analyzing"
            ? "border-[var(--brand)] bg-[var(--brand-light)]"
            : isDragging
              ? "border-[var(--brand)] bg-[var(--brand-light)] scale-[1.02]"
              : uploadState === "error"
                ? "border-[var(--risk-high)] bg-[var(--risk-high-bg)]"
                : "border-border/60 hover:border-border",
        )}
      >
        <div className="flex flex-col items-center justify-center py-16 md:py-20">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            disabled={uploadState === "uploading" || uploadState === "analyzing"}
          />

          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
              uploadState === "uploading" || uploadState === "analyzing"
                ? "bg-[var(--brand)]"
                : uploadState === "error"
                  ? "bg-[var(--risk-high)]"
                  : isDragging
                    ? "bg-[var(--brand)] scale-110"
                    : "bg-accent/60",
            )}
          >
            {uploadState === "uploading" || uploadState === "analyzing" ? (
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            ) : uploadState === "error" ? (
              <AlertCircle className="w-7 h-7 text-white" />
            ) : (
              <Upload
                className={cn("w-7 h-7 transition-colors", isDragging ? "text-white" : "text-muted-foreground")}
              />
            )}
          </div>

          <h3 className="text-lg font-medium text-foreground mb-2">
            {uploadState === "uploading"
              ? "Uploading document..."
              : uploadState === "analyzing"
                ? "Howard is analyzing..."
                : uploadState === "error"
                  ? "Analysis failed"
                  : uploadedFile
                    ? uploadedFile.name
                    : "Drop your document here"}
          </h3>

          <p className="text-sm text-muted-foreground mb-6">
            {uploadState === "uploading" || uploadState === "analyzing" ? (
              <span className="flex items-center gap-2">
                <span className="font-mono">{progress}%</span>
                <span>complete</span>
              </span>
            ) : uploadState === "error" ? (
              error || "Please try again"
            ) : uploadedFile ? (
              `${(uploadedFile.size / 1024).toFixed(1)} KB · Ready to analyze`
            ) : (
              "or click to browse · PDF, DOC, DOCX, TXT"
            )}
          </p>

          {/* Progress bar */}
          {(uploadState === "uploading" || uploadState === "analyzing") && (
            <div className="w-64 h-1.5 bg-background/50 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-[var(--brand)] transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {uploadState === "error" ? (
            <Button onClick={resetAnalysis} variant="outline" className="rounded-full px-6 bg-transparent">
              Try Again
            </Button>
          ) : uploadedFile && uploadState === "idle" ? (
            <Button
              onClick={startAnalysis}
              className="rounded-full px-6 gap-2 bg-foreground text-background hover:bg-foreground/90"
            >
              Start Analysis
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            uploadState === "idle" && (
              <Button
                onClick={handleBrowseClick}
                variant="outline"
                className="rounded-full px-6 bg-transparent cursor-pointer"
              >
                Browse Files
              </Button>
            )
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {uploadState === "idle" && (
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
      )}
    </div>
  )
}
