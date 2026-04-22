import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/session"
import { getPlaygroundCoreBaseUrl, isValidUuid } from "@/lib/playground-core"

export async function GET(request: NextRequest) {
  try {
    if (!(await getSessionFromCookie())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get("userId")?.trim()

    if (!userId) {
      return NextResponse.json({ error: "A user ID is required" }, { status: 400 })
    }

    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "userId must be a valid UUID" }, { status: 400 })
    }

    const base = getPlaygroundCoreBaseUrl()
    if (!base) {
      return NextResponse.json(
        {
          error: "Playground core URL not configured",
          details: "Set FASTAPI_URL to your staging FastAPI base URL (same as playground chat).",
        },
        { status: 503 }
      )
    }

    const endpoint = `${base}/standalone/playground/context?user_id=${encodeURIComponent(userId)}`
    const upstream = await fetch(endpoint, { cache: "no-store" })
    const text = await upstream.text()

    let payload: unknown
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      return NextResponse.json(
        {
          error: "Invalid response from playground core",
          details: text.slice(0, 200),
        },
        { status: 502 }
      )
    }

    if (!upstream.ok) {
      const detail =
        typeof payload === "object" &&
        payload !== null &&
        "detail" in payload &&
        typeof (payload as { detail: unknown }).detail === "string"
          ? (payload as { detail: string }).detail
          : upstream.statusText
      return NextResponse.json(
        {
          error: upstream.status === 404 ? "User not found" : "Failed to load user context",
          details: detail,
        },
        { status: upstream.status }
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Error loading playground context:", error)
    return NextResponse.json(
      {
        error: "Failed to load user context",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
