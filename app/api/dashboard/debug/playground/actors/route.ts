import { NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/session"
import { getStagingPrisma } from "@/lib/staging-database"

export type PlaygroundActor = {
  id: string
  label: string
  name: string | null
  email: string | null
}

export async function GET() {
  try {
    if (!(await getSessionFromCookie())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prisma = getStagingPrisma()
    const users = await prisma.users.findMany({
      orderBy: [{ created_at: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    const actors: PlaygroundActor[] = users.map((user) => {
      const name = user.name?.trim() || null
      const email = user.email?.trim() || null

      return {
        id: user.id,
        name,
        email,
        label: name || email || `Unnamed user (${user.id.slice(0, 8)})`,
      }
    })

    return NextResponse.json({ actors })
  } catch (error) {
    console.error("Error loading staging playground users:", error)
    return NextResponse.json({
      actors: [] as PlaygroundActor[],
      warning: error instanceof Error ? error.message : "Failed to load staging users",
    })
  }
}
