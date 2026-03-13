import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as mammoth from "mammoth"

async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

async function fileToBase64(buffer: ArrayBuffer): Promise<string> {
  return Buffer.from(buffer).toString("base64")
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`[v0] Uploading file: ${file.name} (${file.size} bytes)`)

    const buffer = await file.arrayBuffer()
    let rawText: string | undefined
    let fileBase64: string | undefined
    let fileType: string = file.type

    // Extract content based on file type
    if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx") ||
      file.name.toLowerCase().endsWith(".doc")
    ) {
      try {
        rawText = await extractTextFromDocx(buffer)
      } catch (error) {
        console.error("[v0] DOCX parsing error:", error)
        return NextResponse.json(
          { error: "Failed to parse DOCX file" },
          { status: 400 }
        )
      }
    } else if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      // For PDFs, send as base64 for Claude to process
      fileBase64 = await fileToBase64(buffer)
      fileType = "application/pdf"
    } else if (
      file.type === "text/plain" ||
      file.name.toLowerCase().endsWith(".txt")
    ) {
      // For plain text files, extract as text
      rawText = new TextDecoder().decode(buffer)
    } else if (
      file.type.startsWith("image/") ||
      file.name.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/i)
    ) {
      // For images, send as base64
      fileBase64 = await fileToBase64(buffer)
      fileType = file.type || "image/jpeg"
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, TXT, or image files." },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const blob = await put(`documents/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    // Try to save document to Supabase (optional)
    let documentId = null
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: document } = await supabase
          .from("documents")
          .insert({
            user_id: user.id,
            filename: file.name,
            blob_url: blob.url,
            raw_text: rawText || null,
            file_size: file.size,
            file_type: file.type,
            upload_status: "success",
          })
          .select()
          .single()

        if (document) {
          documentId = document.id
        }
      }
    } catch (dbError) {
      console.log("[v0] Could not save to database (user may not be logged in)")
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      documentId,
      rawText,
      fileBase64,
      fileType,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
