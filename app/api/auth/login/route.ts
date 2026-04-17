import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { createSession, setSessionCookie } from '@/lib/session';
import bcrypt from 'bcrypt';
import { loginSchema } from '@/lib/schemas/login';

type TeamMemberRow = {
    id: number;
    lofy_id: string;
    name: string;
    display_name: string | null;
    role_id: number;
    is_active: boolean;
    password_hash: string | null;
};

const REQUIRED_MEMBER_COLUMNS = [
    'id',
    'name',
    'role_id',
    'is_active',
    'password_hash',
    'lofy_id',
] as const;

const LOOKUP_COLUMNS = ['email', 'lofy_id'] as const;

async function getTeamTableColumns(): Promise<Set<string>> {
    const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lofy_team'
    `;

    return new Set(rows.map((row) => row.column_name));
}

async function findTeamMember(identifier: string): Promise<TeamMemberRow | null> {
    const availableColumns = await getTeamTableColumns();
    const missingRequiredColumns = REQUIRED_MEMBER_COLUMNS.filter(
        (column) => !availableColumns.has(column)
    );

    if (missingRequiredColumns.length > 0) {
        throw new Error(`lofy_team is missing required columns: ${missingRequiredColumns.join(', ')}`);
    }

    const usableLookupColumns = LOOKUP_COLUMNS.filter((column) => availableColumns.has(column));

    if (usableLookupColumns.length === 0) {
        throw new Error('lofy_team is missing both email and lofy_id lookup columns');
    }

    const selectList = [
        '"id"',
        '"lofy_id"',
        '"name"',
        availableColumns.has('display_name') ? '"display_name"' : 'NULL::text AS "display_name"',
        '"role_id"',
        '"is_active"',
        '"password_hash"',
    ].join(', ');

    const whereClause = usableLookupColumns
        .map((column, index) => `"${column}" = $${index + 1}`)
        .join(' OR ');
    const params = usableLookupColumns.map(() => identifier);

    const rows = await prisma.$queryRawUnsafe<TeamMemberRow[]>(
        `SELECT ${selectList} FROM "public"."lofy_team" WHERE ${whereClause} LIMIT 1`,
        ...params
    );

    return rows[0] ?? null;
}

async function updateLastLoginAt(memberId: number): Promise<void> {
    const availableColumns = await getTeamTableColumns();

    if (!availableColumns.has('last_login_at')) {
        return;
    }

    await prisma.$executeRawUnsafe(
        'UPDATE "public"."lofy_team" SET "last_login_at" = NOW() WHERE "id" = $1',
        memberId
    );
}

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

        const member = await findTeamMember(identifier);

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

        await setSessionCookie(token);

        await updateLastLoginAt(member.id);

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
