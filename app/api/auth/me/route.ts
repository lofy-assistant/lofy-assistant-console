import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/session';

export async function GET() {
    const session = await getSessionFromCookie();

    if (!session) {
        return NextResponse.json(
            { error: 'Not authenticated.' },
            { status: 401 }
        );
    }

    return NextResponse.json({
        user: {
            userId: session.userId,
            lofyId: session.lofyId,
            name: session.name,
            displayName: session.displayName,
            role: session.role,
        },
    });
}
