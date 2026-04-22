import { NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/session"

export type PlaygroundActor = {
  id: string
  label: string
}

export async function GET() {
  if (!(await getSessionFromCookie())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const raw = process.env.PLAYGROUND_ACTORS?.trim()
  if (!raw) {
    return NextResponse.json({ actors: [] as PlaygroundActor[] })
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return NextResponse.json({
        actors: [] as PlaygroundActor[],
        warning: "PLAYGROUND_ACTORS must be a JSON array of { id, label } objects",
      })
    }

    const actors: PlaygroundActor[] = parsed
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .map((entry) => ({
        id: typeof entry.id === "string" ? entry.id.trim() : "",
        label: typeof entry.label === "string" ? entry.label.trim() : "Unnamed actor",
      }))
      .filter((entry) => entry.id.length > 0)
      .slice(0, 8)

    return NextResponse.json({ actors })
  } catch {
    return NextResponse.json({
      actors: [] as PlaygroundActor[],
      warning: "Invalid PLAYGROUND_ACTORS JSON",
    })
  }
}
