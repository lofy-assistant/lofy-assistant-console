import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';

const COOKIE_NAME = 'lofy_session';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/api/auth/login',
    '/api/auth/logout',
];

// Static file extensions to allow through
const STATIC_EXTENSIONS = ['.ico', '.png', '.jpg', '.jpeg', '.svg', '.css', '.js', '.woff', '.woff2', '.ttf'];

/**
 * Applies security headers to any NextResponse
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return response;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Allow Next.js internals and static files
    if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/favicon') ||
        STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))
    ) {
        return NextResponse.next();
    }

    // 2. Check if route is public
    // Use exact match for static pages, and startsWith for API endpoints
    const isPublicRoute = PUBLIC_ROUTES.some((route) => {
        if (route.startsWith('/api/')) {
            return pathname.startsWith(route);
        }
        return pathname === route;
    });

    if (isPublicRoute) {
        // If authenticated user tries to access login, redirect to dashboard
        if (pathname === '/login') {
            const token = request.cookies.get(COOKIE_NAME)?.value;
            if (token && await verifySession(token)) {
                return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
            }
        }
        return applySecurityHeaders(NextResponse.next());
    }

    // 3. All other routes require authentication
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
        // No token - redirect to login
        const targetPath = encodeURIComponent(pathname + request.nextUrl.search);
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', targetPath);
        return applySecurityHeaders(NextResponse.redirect(redirectUrl));
    }

    // 4. Verify the session/token
    const session = await verifySession(token);

    if (!session) {
        // Invalid or expired token - clear cookie and redirect to login
        const targetPath = encodeURIComponent(pathname + request.nextUrl.search);
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', targetPath);
        
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.set({
            name: COOKIE_NAME,
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });
        return applySecurityHeaders(response);
    }

    // 5. Authenticated Request - Add headers and return
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', session.userId);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    return applySecurityHeaders(response);
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
