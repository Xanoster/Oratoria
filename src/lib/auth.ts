import { auth } from "@/lib/auth.config";
import prisma from "@/lib/db";

/**
 * Get the authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser() {
    const session = await auth();

    if (!session?.user?.email) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    return user;
}

/**
 * Get the authenticated user or throw an error.
 * Use this in API routes that require authentication.
 */
export async function requireAuth() {
    const user = await getAuthenticatedUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    return user;
}
