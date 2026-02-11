import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { createSession, setSessionCookie } from '@/lib/session';
import bcrypt from 'bcrypt';
import { loginSchema } from '@/lib/schemas/login';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            const first = parsed.error.issues[0];
            return NextResponse.json(
                { error: first?.message || 'Invalid input' },
                { status: 400 }
            );
        }

        const { identifier, password } = parsed.data;

        // Query the lofy_team table for the member by email or lofy_id
        const member = await prisma.lofy_team.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { lofy_id: identifier },
                ],
            },
        });

        // Generic error — do not reveal whether the ID or password was wrong
        if (!member || !member.is_active || !member.password_hash) {
            return NextResponse.json(
                { error: 'Invalid credentials.' },
                { status: 401 }
            );
        }

        // Verify password with bcrypt
        const passwordValid = await bcrypt.compare(password, member.password_hash);

        if (!passwordValid) {
            return NextResponse.json(
                { error: 'Invalid credentials.' },
                { status: 401 }
            );
        }

        // Create JWT session token
        const token = await createSession({
            userId: member.id.toString(),
            lofyId: member.lofy_id,
            name: member.name,
            displayName: member.display_name,
            role: member.role_id,
        });

        // Set secure HttpOnly cookie
        await setSessionCookie(token);

        // Update last_login_at
        await prisma.lofy_team.update({
            where: { id: member.id },
            data: { last_login_at: new Date() },
        });

        return NextResponse.json({
            success: true,
            user: {
                name: member.display_name || member.name,
                role: member.role_id,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
