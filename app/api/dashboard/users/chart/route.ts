import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

interface Onboarding {
  question1?: string
  question2?: string
}

interface UserMetadata {
  onboarding?: Onboarding
}

type ChartDatum = { name: string; value: number }

const q1Options = [
  'student',
  'full-time',
  'part-time',
  'self-employed',
  'neet',
  'other',
]

const q2Options = [
  'social-media',
  'search-engine',
  'friend-colleague',
  'online-advertisement',
  'article-blog',
]

function countOptions(metadatas: UserMetadata[], key: keyof Onboarding, options: string[]): ChartDatum[] {
  const counts: Record<string, number> = {}
  for (const opt of options) counts[opt] = 0
  for (const meta of metadatas || []) {
    const val = meta?.onboarding?.[key]
    if (val && options.includes(val)) counts[val] = (counts[val] ?? 0) + 1
    else if (val) counts.other = (counts.other ?? 0) + 1
  }
  return options.map((opt) => ({ name: opt, value: counts[opt] ?? 0 }))
}

export async function GET() {
  try {
    // Read Postgres users' metadata and aggregate onboarding answers
    const pgUsers: Array<{ metadata: unknown | null }> = await prisma.users.findMany({ select: { metadata: true } })
    const metadatas: UserMetadata[] = pgUsers
      .map((u) => u.metadata)
      .filter(Boolean)
      .map((md) => {
        try {
          return typeof md === 'string' ? (JSON.parse(md) as UserMetadata) : (md as UserMetadata)
        } catch (e) {
          return md as UserMetadata
        }
      })
      .filter(Boolean)

    const q1 = countOptions(metadatas, 'question1', q1Options)
    const q2 = countOptions(metadatas, 'question2', q2Options)

    return NextResponse.json({ success: true, q1, q2 })
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chart data', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
