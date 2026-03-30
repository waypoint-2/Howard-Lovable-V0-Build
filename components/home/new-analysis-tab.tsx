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

  const [fileInputKey, setFileInputKey] = useState(0)

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
    console.log("[v0] handleFileSelect fired, files:", files?.length)
    if (files && files.length > 0) {
      console.log("[v0] File selected:", files[0].name, files[0].size)
      setUploadedFile(files[0])
      setUploadState("idle")
      setError(null)
    }
  }, [])

  const handleBrowseClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[v0] handleBrowseClick fired, fileInputRef:", fileInputRef.current)
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
      const { rawText, fileBase64, fileType, documentId, url: blobUrl } = uploadResult

      setUploadState("analyzing")

      // Analyze with AI using Server-Sent Events
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

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      // Initialize storage for streaming results
      let allClauses: any[] = []
      let documentTitle = ""
      let totalClauses = 0

      // Read SSE stream
      const reader = analyzeResponse.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            
            if (data === "[DONE]") {
              // Persist to Supabase (best-effort — fails gracefully if user not logged in)
              let analysisId: string | null = null
              try {
                const saveResponse = await fetch("/api/save-analysis", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    documentId,
                    blobUrl,
                    filename: uploadedFile.name,
                    documentTitle,
                    clauses: allClauses,
                  }),
                })
                if (saveResponse.ok) {
                  const saveResult = await saveResponse.json()
                  if (saveResult.persisted) analysisId = saveResult.analysisId
                }
              } catch (saveErr) {
                console.warn("[v0] Could not persist analysis to Supabase:", saveErr)
              }

              // Store final result and redirect
              sessionStorage.setItem(
                "analyzedDocument",
                JSON.stringify({
                  document_title: documentTitle,
                  clauses: allClauses,
                  filename: uploadedFile.name,
                  documentId,
                  analysisId,
                  analyzedAt: new Date().toISOString(),
                }),
              )
              setProgress(100)
              setUploadState("complete")
              router.push("/review")
              return
            }

            try {
              const parsed = JSON.parse(data)
              
              // Handle metadata event (pass 1 complete)
              if (parsed.type === "metadata") {
                totalClauses = parsed.totalClauses || 0
                documentTitle = parsed.document_title || ""
                console.log(`[v0] Received metadata: ${totalClauses} clauses`)
              }
              
              // Handle individual clause event (pass 2 - new parallel format)
              if (parsed.type === "clause" && parsed.clause) {
                allClauses.push(parsed.clause)
                const progressPercent = totalClauses > 0 
                  ? Math.min(50 + Math.floor((allClauses.length / totalClauses) * 50), 99)
                  : 50 + allClauses.length * 5
                setProgress(progressPercent)
                console.log(`[v0] Received clause: ${parsed.clause.id}, total: ${allClauses.length}`)
              }
              
              // Handle batch event (fallback for older format)
              if (parsed.type === "batch" && parsed.clauses) {
                allClauses = [...allClauses, ...parsed.clauses]
                const progressPercent = totalClauses > 0 
                  ? Math.min(50 + Math.floor((allClauses.length / totalClauses) * 50), 99)
                  : 50 + allClauses.length * 5
                setProgress(progressPercent)
                console.log(`[v0] Received batch: ${parsed.clauses.length} clauses, total: ${allClauses.length}`)
              }
              
              // Handle error event
              if (parsed.type === "error") {
                throw new Error(parsed.message || "Analysis failed")
              }
            } catch (parseError) {
              console.error("[v0] Failed to parse SSE data:", data)
            }
          }
        }
      }
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
    setFileInputKey((k) => k + 1) // reset input so same file can be re-selected
  }

  const handleAreaClick = useCallback((e: React.MouseEvent) => {
    // Only trigger if not clicking a button inside the area
    if ((e.target as HTMLElement).closest('button')) return
    if (uploadState === "uploading" || uploadState === "analyzing") return
    fileInputRef.current?.click()
  }, [uploadState])

  return (
    <div className="flex flex-col items-center">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleAreaClick}
        className={cn(
          "w-full max-w-2xl relative rounded-2xl border-2 border-dashed transition-all duration-300",
          "bg-card/50 hover:bg-card",
          uploadState === "uploading" || uploadState === "analyzing"
            ? "border-[var(--brand)] bg-[var(--brand-light)] cursor-default"
            : isDragging
              ? "border-[var(--brand)] bg-[var(--brand-light)] scale-[1.02] cursor-copy"
              : uploadState === "error"
                ? "border-[var(--risk-high)] bg-[var(--risk-high-bg)] cursor-pointer"
                : "border-border/60 hover:border-border cursor-pointer",
        )}
      >
        <div className="flex flex-col items-center justify-center py-16 md:py-20">
          <input
            key={fileInputKey}
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
