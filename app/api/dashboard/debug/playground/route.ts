/**
 * AI Playground API Route
 *
 * This endpoint forwards debug playground messages to the staging FastAPI backend.
 *
 * Configuration:
 * - Set PLAYGROUND_FASTAPI_URL to the staging backend URL
 * - FastAPI endpoint: POST /standalone/chat
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/session"

interface PlaygroundMessage {
  role: "user" | "assistant"
  content: string
}

interface PlaygroundPayload {
  mode: "live-user" | "new-user" | "expired-trial" | "seasoned-user"
  personality?: "atlas" | "brad" | "lexi" | "rocco"
  seeded_profile_key?: string
  include_token_usage?: boolean
  conversation_history?: PlaygroundMessage[]
}

interface PlaygroundRequestBody {
  message?: string
  playground?: PlaygroundPayload
}

interface ChatResponse {
  message: string
  cta_url?: string
  cta_text?: string
  buttons?: unknown[]
  usage?: {
    total_input_tokens: number
    total_output_tokens: number
    calls: Array<{
      call_type: string
      provider: string
      model: string
      input_tokens: number
      output_tokens: number
      system_prompt_tokens?: number | null
      session_context_tokens?: number | null
      conversation_history_tokens?: number | null
      tools_schema_tokens?: number | null
    }>
  }
}

function getBackendLabel(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.host
  } catch {
    return "Invalid backend URL"
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getSessionFromCookie()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse the request body
    const body = (await request.json()) as PlaygroundRequestBody
    const message = body.message

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    const fastapiUrl = process.env.PLAYGROUND_FASTAPI_URL

    if (!fastapiUrl) {
      console.error("PLAYGROUND_FASTAPI_URL is not defined in environment variables")
      return NextResponse.json(
        { error: "Playground staging backend URL not configured" },
        { status: 500 }
      )
    }

    // Ensure we don't have double slashes if fastapiUrl ends with a slash
    const base = fastapiUrl.endsWith("/") ? fastapiUrl.slice(0, -1) : fastapiUrl
    // The standalone router has a prefix of "/standalone"
    const endpoint = `${base}/standalone/chat`

    console.log("Calling FastAPI endpoint:", endpoint)

    const requestPayload = {
      user_id: session.lofyId,
      user_id_is_canonical: true,
      message: message.trim(),
      playground: body.playground,
    }
    console.log("Request payload:", requestPayload)

    // Call the FastAPI backend with the correct format
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("FastAPI error:", response.status, response.statusText, errorText)
      console.error("Attempted endpoint:", endpoint)
      return NextResponse.json(
        { 
          error: "Failed to get response from AI",
          details: `${response.status} ${response.statusText}`,
          endpoint: endpoint
        },
        { status: response.status }
      )
    }

    const data: ChatResponse = await response.json()

    // Return the response with all fields from FastAPI
    return NextResponse.json({
      response: data.message,
      cta_url: data.cta_url,
      cta_text: data.cta_text,
      buttons: data.buttons,
      usage: data.usage,
      backend_label: getBackendLabel(base),
    })
  } catch (error) {
    console.error("Error in playground API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
