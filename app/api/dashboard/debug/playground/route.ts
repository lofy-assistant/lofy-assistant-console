/**
 * AI Playground — forwards chat to the staging Core API only.
 * Does not query console DB; core resolves the user against its own staging data.
 *
 * Env: CORE_API_URL (staging core base URL, no path) — legacy fallbacks:
 * FASTAPI_URL, PLAYGROUND_FASTAPI_URL, PLAYGROUND_CORE_BASE_URL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/session"
import { getFetchFailureDetails, getPlaygroundCoreBaseUrl, isValidUuid } from "@/lib/playground-core"

interface PlaygroundRequestBody {
  message?: string
  user_id?: string
  media?: {
    type?: "image" | "audio"
    mime_type?: string
    data_base64?: string
    filename?: string
  }
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
  let endpoint: string | null = null

  try {
    if (!(await getSessionFromCookie())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as PlaygroundRequestBody
    const message = body.message
    const userId = body.user_id?.trim()
    const media = body.media

    if ((!message || typeof message !== "string" || !message.trim()) && !media) {
      return NextResponse.json({ error: "Message or media is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "A user ID (canonical UUID) is required" }, { status: 400 })
    }

    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "user_id must be a valid UUID" }, { status: 400 })
    }

    if (media) {
      if (
        (media.type !== "image" && media.type !== "audio") ||
        typeof media.mime_type !== "string" ||
        typeof media.data_base64 !== "string" ||
        !media.mime_type.trim() ||
        !media.data_base64.trim()
      ) {
        return NextResponse.json({ error: "Valid media type, MIME type, and base64 data are required" }, { status: 400 })
      }
    }
    const normalizedMedia = media
      ? {
          type: media.type as "image" | "audio",
          mime_type: media.mime_type as string,
          data_base64: media.data_base64 as string,
          filename: media.filename,
        }
      : null

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
      message: message?.trim() || "",
      ...(normalizedMedia
        ? {
            media: {
              type: normalizedMedia.type,
              mime_type: normalizedMedia.mime_type.trim(),
              data_base64: normalizedMedia.data_base64.trim(),
              filename: normalizedMedia.filename,
            },
          }
        : {}),
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
