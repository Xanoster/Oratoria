import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require authentication
const protectedPaths = ["/dashboard", "/profile", "/lesson", "/roadmap", "/roleplay"];

// Paths that should redirect to dashboard if already authenticated
const authPaths = ["/login", "/signup"];

// Paths that require assessment completion (subset of protected paths)
const assessmentRequiredPaths = ["/dashboard", "/lesson", "/roadmap", "/roleplay", "/profile"];

export async function middleware(request: NextRequest) {
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

    // Assessment gate: Check if user has completed assessment
    // This is done via cookie set after assessment completion
    if (assessmentRequiredPaths.some((path) => pathname.startsWith(path)) && isAuthenticated) {
        const assessmentComplete = request.cookies.get("assessment-complete");

        // If no assessment cookie, redirect to assessment page
        // The assessment page will check the database and redirect if already complete
        if (!assessmentComplete) {
            // Allow if already on assessment page
            if (!pathname.startsWith("/assessment")) {
                return NextResponse.redirect(new URL("/assessment", request.url));
            }
        }
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
        "/assessment/:path*",
    ],
};
