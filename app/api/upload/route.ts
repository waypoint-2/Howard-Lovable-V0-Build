import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as mammoth from "mammoth"
import * as pdf from "pdf-parse/lib/pdf-parse"

async function extractText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()

  if (file.type === "application/pdf") {
    try {
      const data = await pdf(Buffer.from(buffer))
      // Check if this is a scanned PDF (very little text)
      if (data.text.trim().length < 100 && data.numpages > 1) {
        throw new Error("SCANNED_PDF")
      }
      return data.text
    } catch (error) {
      if (error instanceof Error && error.message === "SCANNED_PDF") {
        throw error
      }
      console.error("[v0] PDF parsing error:", error)
      throw new Error("Failed to parse PDF")
    }
  } else if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".docx")
  ) {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      return result.value
    } catch (error) {
      console.error("[v0] DOCX parsing error:", error)
      throw new Error("Failed to parse DOCX")
    }
  } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    const text = new TextDecoder().decode(buffer)
    return text
  } else {
    throw new Error("Unsupported file type")
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`[v0] Uploading file: ${file.name} (${file.size} bytes)`)

    // Extract text from file
    let rawText: string
    try {
      rawText = await extractText(file)
    } catch (error) {
      if (error instanceof Error && error.message === "SCANNED_PDF") {
        return NextResponse.json(
          {
            error: "This appears to be a scanned document. Scanned PDF support coming soon.",
          },
          { status: 400 }
        )
      }
      console.error("[v0] Text extraction error:", error)
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to extract text",
        },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const blob = await put(`documents/${Date.now()}-${file.name}`, file, {
      access: "private",
    })

    // Save document to Supabase
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        filename: file.name,
        blob_url: blob.url,
        raw_text: rawText,
        file_size: file.size,
        file_type: file.type,
        upload_status: "success",
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      return NextResponse.json(
        { error: "Failed to save document" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      documentId: document.id,
      text: rawText,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
