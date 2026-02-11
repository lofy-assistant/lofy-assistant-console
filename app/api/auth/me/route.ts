import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';
import { prisma } from '@/lib/database';

export async function GET() {
    const session = await getSessionFromCookie();

    if (!session) {
        return NextResponse.json(
            { error: 'Not authenticated.' },
            { status: 401 }
        );
    }

    // Fetch team info from database using the lofyId from session
    const team = await prisma.lofy_team.findUnique({
        where: { lofy_id: session.lofyId },
        select: {
            name: true,
            display_name: true,
            email: true,
        },
    });

    return NextResponse.json({
        user: {
            userId: session.userId,
            lofyId: session.lofyId,
            name: session.name,
            displayName: session.displayName,
            role: session.role,
        },
        team: team ?? null,
    });
}
