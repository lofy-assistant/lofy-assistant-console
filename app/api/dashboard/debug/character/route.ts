import { createHash, randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookie } from "@/lib/session"
import { connectStagingMongo, getStagingPrisma } from "@/lib/staging-database"

type CharacterRequestBody = {
  email?: string
  name?: string
  phone?: string
  timezone?: string
  ai_persona?: string
  custom_instruction?: string
  subscription_status?: string
  subscription_period_end?: string
}

const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur"
const DEFAULT_SUBSCRIPTION_END = "2099-12-31T23:59:59.000Z"
const CHARACTER_PIN = "000000"

function hashValue(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function parseFutureDate(value: string | undefined) {
  const date = new Date(value || DEFAULT_SUBSCRIPTION_END)
  if (Number.isNaN(date.getTime())) {
    throw new Error("subscription_period_end must be a valid ISO date")
  }
  return date
}

export async function POST(request: NextRequest) {
  try {
    if (!(await getSessionFromCookie())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as CharacterRequestBody
    const email = body.email?.trim().toLowerCase() || null
    const name = body.name?.trim() || null
    const timezone = body.timezone?.trim() || DEFAULT_TIMEZONE
    const aiPersona = body.ai_persona?.trim() || null
    const customInstruction = body.custom_instruction?.trim() || null
    const subscriptionStatus = body.subscription_status?.trim() || "active"
    const subscriptionPeriodEnd = parseFutureDate(body.subscription_period_end)

    if (!email && !name && !body.phone?.trim()) {
      return NextResponse.json({ error: "Enter at least an email, display name, or external identifier" }, { status: 400 })
    }

    const phoneIdentifier = body.phone?.trim() || `character:${email || name || randomUUID()}`
    const encryptedPhone = `debug:${hashValue(phoneIdentifier).slice(0, 16)}`
    const hashedPhone = hashValue(phoneIdentifier)
    const prisma = getStagingPrisma()

    const existing = await prisma.users.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          { hashed_phone: hashedPhone },
        ],
      },
      select: { id: true, email: true, name: true },
    })

    if (existing) {
      return NextResponse.json(
        {
          error: "A staging user with that email or identifier already exists",
          data: { user_id: existing.id, email: existing.email, name: existing.name },
        },
        { status: 409 }
      )
    }

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.users.create({
        data: {
          encrypted_phone: encryptedPhone,
          hashed_phone: hashedPhone,
          pin: CHARACTER_PIN,
          email,
          name,
          ai_persona: aiPersona,
          custom_instruction: customInstruction,
          email_verified: Boolean(email),
          metadata: {
            source: "dashboard_debug_character",
            created_for: "playground",
          },
        },
      })

      await tx.subscriptions.create({
        data: {
          user_id: created.id,
          subscription_status: subscriptionStatus,
          current_period_end: subscriptionPeriodEnd,
        },
      })

      return created
    })

    const mongo = await connectStagingMongo()
    if (!mongo.db) {
      throw new Error("Staging Mongo connection did not expose a database handle")
    }

    const now = new Date()
    await mongo.db.collection("users").updateOne(
      { user_id: user.id },
      {
        $setOnInsert: {
          user_id: user.id,
          encrypted_phone: encryptedPhone,
          hashed_phone: hashedPhone,
          created_at: now,
        },
        $set: {
          timezone,
          metadata: {
            source: "dashboard_debug_character",
            email,
            name,
          },
          updated_at: now,
        },
      },
      { upsert: true }
    )

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          pin: CHARACTER_PIN,
          timezone,
          aiPersona,
          customInstruction,
        },
        subscription: {
          status: subscriptionStatus,
          currentPeriodEnd: subscriptionPeriodEnd.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error("Error creating staging character:", error)
    return NextResponse.json(
      {
        error: "Failed to create staging character",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
