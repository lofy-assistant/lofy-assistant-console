import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const EXPIRES_IN = '24h';
const COOKIE_NAME = 'lofy_session';

export interface SessionPayload {
    userId: string;
    lofyId: string;
    name: string;
    displayName: string | null;
    role: number;
}

export async function createSession(payload: SessionPayload): Promise<string> {
    const SECRET = process.env.JWT_SECRET;
    if (!SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const secret = new TextEncoder().encode(SECRET);

    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(EXPIRES_IN)
        .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
    try {
        const SECRET = process.env.JWT_SECRET;
        if (!SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const secret = new TextEncoder().encode(SECRET);
        const { payload } = await jwtVerify(token, secret);

        return {
            userId: payload.userId as string,
            lofyId: payload.lofyId as string,
            name: payload.name as string,
            displayName: payload.displayName as string | null,
            role: payload.role as number,
        };
    } catch {
        return null;
    }
}

export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });
}

export async function getSessionFromCookie(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    return verifySession(token);
}

export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };