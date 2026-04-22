/**
 * AI Playground — forwards chat to staging FastAPI only.
 * Does not query console DB; core resolves the user against its own staging data.
 *
 * Env: FASTAPI_URL (staging core base URL, no path) — optional fallbacks: PLAYGROUND_FASTAPI_URL, PLAYGROUND_CORE_BASE_URL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/session"
import { getPlaygroundCoreBaseUrl, isValidUuid } from "@/lib/playground-core"

interface PlaygroundRequestBody {
  message?: string
  user_id?: string
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
    if (!(await getSessionFromCookie())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as PlaygroundRequestBody
    const message = body.message
    const userId = body.user_id?.trim()

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "A user ID (canonical UUID) is required" }, { status: 400 })
    }

    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "user_id must be a valid UUID" }, { status: 400 })
    }

    const base = getPlaygroundCoreBaseUrl()
    if (!base) {
      return NextResponse.json(
        { error: "Playground core URL not configured (set FASTAPI_URL to your staging FastAPI base URL)" },
        { status: 503 }
      )
    }

    const endpoint = `${base}/standalone/chat`

    const requestPayload = {
      user_id: userId,
      user_id_is_canonical: true,
      message: message.trim(),
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let detail = `${response.status} ${response.statusText}`
      try {
        const errJson = JSON.parse(errorText) as { detail?: unknown }
        if (typeof errJson.detail === "string") {
          detail = errJson.detail
        }
      } catch {
        if (errorText) {
          detail = errorText.slice(0, 500)
        }
      }
      return NextResponse.json(
        {
          error: "Failed to get response from AI",
          details: detail,
          endpoint,
        },
        { status: response.status }
      )
    }

    const data: ChatResponse = await response.json()

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
