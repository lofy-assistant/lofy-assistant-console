import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'lofy_session';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/api/auth/login',
    '/api/auth/logout', // Allow logout without auth check
];

// Static file extensions to allow through
const STATIC_EXTENSIONS = ['.ico', '.png', '.jpg', '.jpeg', '.svg', '.css', '.js', '.woff', '.woff2', '.ttf'];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow Next.js internals and static files
    if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/favicon') ||
        STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))
    ) {
        return NextResponse.next();
    }

    // Check if route is public
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));

    if (isPublicRoute) {
        // If authenticated user tries to access login, redirect to dashboard
        if (pathname === '/login') {
            const token = request.cookies.get(COOKIE_NAME)?.value;
            if (token && await verifyToken(token)) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }
        return NextResponse.next();
    }

    // All other routes require authentication
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
        // No token found - redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify the JWT
    const isValid = await verifyToken(token);

    if (!isValid) {
        // Invalid or expired token - clear cookie and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.set({
            name: COOKIE_NAME,
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });
        return response;
    }

    // Add security headers to all authenticated requests
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    return response;
}

async function verifyToken(token: string): Promise<boolean> {
    try {
        const SECRET = process.env.JWT_SECRET;
        if (!SECRET) {
            console.error('JWT_SECRET is not defined');
            return false;
        }

        const secret = new TextEncoder().encode(SECRET);
        await jwtVerify(token, secret);
        return true;
    } catch (error) {
        // Token verification failed (expired, invalid signature, etc.)
        return false;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, robots.txt, etc.
         */
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
    ],
};
