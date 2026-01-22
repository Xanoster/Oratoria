import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require authentication
const protectedPaths = ["/dashboard", "/profile", "/lesson", "/roadmap", "/roleplay"];

// Paths that should redirect to dashboard if already authenticated
const authPaths = ["/login", "/signup"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the user has a session token
    const sessionToken =
        request.cookies.get("next-auth.session-token") ||
        request.cookies.get("__Secure-next-auth.session-token");

    const isAuthenticated = !!sessionToken;

    // Redirect unauthenticated users trying to access protected routes
    if (protectedPaths.some((path) => pathname.startsWith(path)) && !isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from auth pages
    if (authPaths.some((path) => pathname.startsWith(path)) && isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/profile/:path*",
        "/lesson/:path*",
        "/roadmap/:path*",
        "/roleplay/:path*",
        "/login",
        "/signup",
    ],
};
