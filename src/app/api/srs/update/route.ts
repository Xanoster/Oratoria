import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';

// SM-2 algorithm implementation
function calculateNextReview(
    quality: number, // 0, 0.5, or 1
    easeFactor: number,
    interval: number,
    repetitions: number
): { nextInterval: number; nextEaseFactor: number; nextRepetitions: number } {
    // Convert quality to 0-5 scale for SM-2
    const q = quality === 1 ? 5 : quality === 0.5 ? 3 : 0;

    if (q < 3) {
        // Failed or partial - reset
        return {
            nextInterval: 1,
            nextEaseFactor: Math.max(1.3, easeFactor - 0.2),
            nextRepetitions: 0
        };
    }

    // Correct answer
    let newInterval: number;
    let newRepetitions = repetitions + 1;

    if (repetitions === 0) {
        newInterval = 1;
    } else if (repetitions === 1) {
        newInterval = 6;
    } else {
        newInterval = Math.round(interval * easeFactor);
    }

    // Update ease factor
    const newEaseFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    );

    return {
        nextInterval: newInterval,
        nextEaseFactor: newEaseFactor,
        nextRepetitions: newRepetitions
    };
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth().catch(() => null);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { srsStateId, quality, outputType } = body;

        if (!srsStateId || quality === undefined || !outputType) {
            return NextResponse.json(
                { error: 'Missing required fields: srsStateId, quality, outputType' },
                { status: 400 }
            );
        }

        // Get current SRS state
        const srsState = await prisma.sRSState.findUnique({
            where: { id: srsStateId },
            include: { sentence: true }
        });

        if (!srsState || srsState.userId !== user.id) {
            return NextResponse.json(
                { error: 'SRS state not found' },
                { status: 404 }
            );
        }

        // Calculate next review using SM-2
        const { nextInterval, nextEaseFactor, nextRepetitions } = calculateNextReview(
            quality,
            srsState.easeFactor,
            srsState.interval,
            srsState.repetitions
        );

        // Calculate next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + nextInterval);

        // Update SRS state
        await prisma.sRSState.update({
            where: { id: srsStateId },
            data: {
                interval: nextInterval,
                easeFactor: nextEaseFactor,
                repetitions: nextRepetitions,
                nextReview,
                lastReview: new Date()
            }
        });

        // Append to review history (immutable log)
        await prisma.reviewHistory.create({
            data: {
                srsStateId,
                quality,
                outputType,
                intervalAfter: nextInterval,
                easeFactorAfter: nextEaseFactor
            }
        });

        // Update ProgressState metrics
        await prisma.progressState.update({
            where: { userId: user.id },
            data: {
                // Update retention rate (rolling average would be better but this is simpler)
                srsRetentionRate: {
                    increment: quality > 0 ? 0.01 : -0.01
                }
            }
        });

        return NextResponse.json({
            success: true,
            nextReview: nextReview.toISOString(),
            nextInterval,
            repetitions: nextRepetitions
        });

    } catch (error) {
        console.error('Error updating SRS state:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
