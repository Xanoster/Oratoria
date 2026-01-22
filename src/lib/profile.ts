import prisma from '@/lib/db';

export async function getProfileData(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { progressState: true }
    });

    if (!user) throw new Error("User not found");

    return {
        name: user.name || '',
        email: user.email,
        level: user.cefrLevel,
        // Daily goal is logically part of User or Progress, but schema might not have it.
        // Schema has targetDurationMin in Lesson, but per user?
        // Let's assume default 10 if not in schema. Schema `ProgressState` has `speechSecondsToday` but not a Goal setting?
        // Ah, `Lesson.targetDurationMin`.
        // Let's check schema again. `User` doesn't have dailyGoal. 
        // We'll return 10 as default or store it if we migrate schema. 
        // For now, hardcode 10 as per constitution "5-15 minutes".
        dailyGoal: 10,

        // Metrics
        srsRetention: Math.round((user.progressState?.srsRetentionRate || 0) * 100),
        errorRecovery: Math.round((user.progressState?.errorRecoveryRate || 0) * 100),
        dailyShieldActive: (user.progressState?.speechSecondsToday || 0) > 300 // > 5 mins
    };
}
