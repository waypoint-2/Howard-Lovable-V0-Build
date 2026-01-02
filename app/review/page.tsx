"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { LegalTranslator } from "@/components/legal-translator"
import { Loader2 } from "lucide-react"

function ReviewContent() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [documentData, setDocumentData] = useState<{
    clauses: any[]
    filename: string
  } | null>(null)

  useEffect(() => {
    // Check for document data in sessionStorage (set by upload flow)
    const storedData = sessionStorage.getItem("analyzedDocument")
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        setDocumentData(parsed)
      } catch (e) {
        console.error("Failed to parse stored document data")
      }
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  return <LegalTranslator documentData={documentData} />
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  )
}
