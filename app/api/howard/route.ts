import { NextResponse, type NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, clauseText, clauseTitle, documentContext } = body

    if (!question || !clauseText || !clauseTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const systemPrompt = `You are Howard, a legal analyst. Answer in plain English. Be direct and flag concerns. Keep answers under 4 sentences unless the question genuinely requires more.`

    const userPrompt = `The user is reviewing this clause: ${clauseTitle}\n\nClause text: ${clauseText}\n\nContext: ${documentContext}\n\nQuestion: ${question}`

    // Use streaming response
    const encoder = new TextEncoder()

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          const stream = anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 500,
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: userPrompt,
              },
            ],
          })

          stream.on("text", (text) => {
            controller.enqueue(encoder.encode(text))
          })

          stream.on("error", (error) => {
            console.error("[v0] Stream error:", error)
            controller.error(error)
          })

          stream.on("end", () => {
            controller.close()
          })
        } catch (error) {
          console.error("[v0] Howard error:", error)
          controller.error(error)
        }
      },
    })

    return new NextResponse(customReadable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("[v0] Howard API error:", error)
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    )
  }
}
