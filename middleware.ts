import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'lofy_session';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        // If already authenticated and trying to access login, redirect to dashboard
        if (pathname === '/login') {
            const token = request.cookies.get(COOKIE_NAME)?.value;
            if (token) {
                const isValid = await verifyToken(token);
                if (isValid) {
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
            }
        }
        return NextResponse.next();
    }

    // Allow static assets and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check for session token
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify the JWT
    const isValid = await verifyToken(token);

    if (!isValid) {
        // Clear invalid cookie and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete(COOKIE_NAME);
        return response;
    }

    return NextResponse.next();
}

async function verifyToken(token: string): Promise<boolean> {
    try {
        const SECRET = process.env.JWT_SECRET;
        if (!SECRET) return false;

        const secret = new TextEncoder().encode(SECRET);
        await jwtVerify(token, secret);
        return true;
    } catch {
        return false;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
