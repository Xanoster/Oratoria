import prisma from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';

function getRelativeTime(date: Date) {
    return formatDistanceToNow(date, { addSuffix: true });
}

export async function getDashboardData(userId: string) {
    // 1. Stats
    // Streak: distinct days with SpeakingAttempt in desc order
    const attempts = await prisma.speakingAttempt.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100 // Last 100 attempts sufficient to check streak
    });

    // Simple streak calculation
    let streak = 0;
    if (attempts.length > 0) {
        // For efficiency, just distinct days
        const days = new Set(attempts.map(a => a.createdAt.toISOString().split('T')[0]));

        const uniqueDays = Array.from(days).sort().reverse();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
            streak = 1;
            // Iterate back
            for (let i = 0; i < uniqueDays.length - 1; i++) {
                const current = new Date(uniqueDays[i]);
                const next = new Date(uniqueDays[i + 1]);
                const diff = (current.getTime() - next.getTime()) / (1000 * 3600 * 24);
                if (Math.round(diff) === 1) {
                    streak++;
                } else {
                    break;
                }
            }
        } else {
            streak = 0; // Streak broken, but maybe 0 is harsh? No, dashboard shows current streak.
        }
    }

    // Mastered Sentences (Interval > 14 days)
    const masteredCount = await prisma.sRSState.count({
        where: {
            userId,
            interval: { gt: 14 }
        }
    });

    // 2. Recent Activity
    const recentRaw = await prisma.speakingAttempt.findMany({
        where: { userId },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { sentence: true }
    });

    const recentActivity = recentRaw.map(attempt => ({
        id: attempt.id,
        title: attempt.sentence.germanText.substring(0, 30) + (attempt.sentence.germanText.length > 30 ? '...' : ''),
        date: getRelativeTime(attempt.createdAt),
        score: Math.round(attempt.confidence * 100) + '%',
        status: attempt.outcome === 'success' ? 'Success' : (attempt.outcome === 'partial' ? 'Review Needed' : 'Missed')
    }));

    // 3. User Info
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { cefrLevel: true, name: true }
    });

    // 4. Progress / Next Goal
    const progress = await prisma.progressState.findUnique({
        where: { userId }
    });

    let nextGoal = "Start your journey";
    let progressPercent = 0;

    const currentNodeIndex = progress?.currentNarrativeNode || 0;

    const node = await prisma.narrativeNode.findFirst({
        where: { orderIndex: currentNodeIndex }
    });

    if (node) {
        nextGoal = `Goal: ${node.title}`;
        progressPercent = Math.min(100, (attempts.length % 5) * 20); // Mock-ish flux
    }

    // 5. Random Tip
    const TIPS = [
        "In German main clauses, the verb always comes second (V2 rule).",
        "Nouns in German are always capitalized.",
        "Use 'Sie' for formal situations and 'Du' for friends.",
        "The article 'das' is for neutral nouns like 'Mädchen'.",
        "Practice speaking daily for at least 5 minutes to build muscle memory."
    ];
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];

    return {
        level: user?.cefrLevel || 'A1',
        streak,
        masteredCount,
        recentActivity,
        userName: user?.name?.split(' ')[0] || 'Learner',
        nextGoal,
        progressPercent,
        tip: randomTip
    };
}
