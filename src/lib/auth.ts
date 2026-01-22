import prisma from '@/lib/db';

/**
 * Get the current user or create a default guest user.
 * For MVP, we operate in single-player/guest mode.
 */
export async function getOrCreateDefaultUser() {
    // Try to find an existing user
    const existingUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' } // Stable selection
    });

    if (existingUser) {
        return existingUser;
    }

    // Create default guest user
    return prisma.user.create({
        data: {
            email: 'guest@oratoria.ai',
            name: 'Guest User',
            cefrLevel: 'A1',
        }
    });
}
