import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';

// Get the user's SRS queue (due items)
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth().catch(() => null);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Due now: nextReview <= now
        const dueNow = await prisma.sRSState.findMany({
            where: {
                userId: user.id,
                nextReview: { lte: now }
            },
            include: {
                sentence: {
                    select: {
                        id: true,
                        germanText: true,
                        englishText: true,
                        clozeTargets: true,
                        cefrLevel: true
                    }
                }
            },
            orderBy: { nextReview: 'asc' },
            take: 15 // Batch limit
        });

        // Overdue: nextReview < today (missed reviews)
        const overdueCount = await prisma.sRSState.count({
            where: {
                userId: user.id,
                nextReview: { lt: todayStart }
            }
        });

        // New today: items never reviewed (repetitions = 0, created today or earlier)
        const newToday = await prisma.sRSState.count({
            where: {
                userId: user.id,
                repetitions: 0,
                lastReview: null
            }
        });

        // Total in queue
        const totalDue = await prisma.sRSState.count({
            where: {
                userId: user.id,
                nextReview: { lte: now }
            }
        });

        return NextResponse.json({
            items: dueNow,
            counts: {
                dueNow: dueNow.length,
                overdue: overdueCount,
                newToday,
                totalDue
            }
        });

    } catch (error) {
        console.error('Error fetching SRS queue:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
