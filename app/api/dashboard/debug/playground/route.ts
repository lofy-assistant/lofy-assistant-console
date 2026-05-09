/**
 * AI Playground — forwards chat to the staging Core API only.
 * Does not query console DB; core resolves the user against its own staging data.
 *
 * Env: CORE_API_URL (staging core base URL, no path) — legacy fallbacks:
 * FASTAPI_URL, PLAYGROUND_FASTAPI_URL, PLAYGROUND_CORE_BASE_URL
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

function getFetchFailureDetails(error: unknown) {
  if (!(error instanceof TypeError) || error.message !== "fetch failed") {
    return null
  }

  const cause = (error as TypeError & { cause?: unknown }).cause
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code?: unknown }).code)
      : null

  if (code === "ECONNREFUSED") {
    return "Core API is not accepting connections. Start lofy-assistant-core or update CORE_API_URL."
  }

  if (code === "ECONNRESET") {
    return "Core API closed the connection before responding. Check the core server logs for the failed request."
  }

  return "Core API request failed before a response was received."
}

export async function POST(request: NextRequest) {
  let endpoint: string | null = null

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
        { error: "Core API URL not configured (set CORE_API_URL to your staging core base URL)" },
        { status: 503 }
      )
    }

    endpoint = `${base}/standalone/chat`

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
        const errJson = JSON.parse(errorText) as { detail?: unknown; message?: unknown; error?: unknown }
        if (typeof errJson.detail === "string") {
          detail = errJson.detail
        } else if (typeof errJson.message === "string") {
          detail = errJson.message
        } else if (Array.isArray(errJson.message)) {
          detail = errJson.message.join("\n")
        } else if (typeof errJson.error === "string") {
          detail = errJson.error
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
    const fetchFailureDetails = getFetchFailureDetails(error)

    if (fetchFailureDetails) {
      return NextResponse.json(
        {
          error: "Core API unavailable",
          details: fetchFailureDetails,
          endpoint,
        },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
