import { type NextRequest, NextResponse } from 'next/server';

// Public routes that don't require auth
const publicRoutes = ['/', '/auth', '/auth/login', '/auth/signup', '/auth/callback'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (publicRoutes.some(route => pathname === route || pathname.startsWith('/auth'))) {
        return NextResponse.next();
    }

    // Check for dev auth cookie
    const devAuth = request.cookies.get('dev_auth');

    // If no auth, redirect to login
    if (!devAuth?.value) {
        const loginUrl = new URL('/auth', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         * - api routes
         */
        '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
