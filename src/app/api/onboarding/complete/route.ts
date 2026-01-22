import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth().catch(() => null);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { cefrLevel, skipAssessment } = body;

        const level = cefrLevel || 'A1';

        // Update user's CEFR level
        await prisma.user.update({
            where: { id: user.id },
            data: { cefrLevel: level }
        });

        // Create ProgressState
        await prisma.progressState.upsert({
            where: { userId: user.id },
            update: { updatedAt: new Date() },
            create: {
                userId: user.id,
                currentNarrativeNode: 0,
                currentLesson: 0,
                srsRetentionRate: 0,
                totalSpeakingMs: 0,
                recentSpeakingMs: 0,
                errorRecoveryRate: 0,
                speechSecondsToday: 0,
                roleplayTurnCount: 0,
                outputFrequency: 0
            }
        });

        // Get ALL published sentences (we have few, so give all)
        const sentences = await prisma.sentence.findMany({
            where: { publishedAt: { not: null } },
            orderBy: { createdAt: 'asc' }
        });

        // Seed SRSState entries for this user
        let seededCount = 0;
        for (const sentence of sentences) {
            const existing = await prisma.sRSState.findUnique({
                where: {
                    userId_sentenceId: { userId: user.id, sentenceId: sentence.id }
                }
            });

            if (!existing) {
                await prisma.sRSState.create({
                    data: {
                        userId: user.id,
                        sentenceId: sentence.id,
                        easeFactor: 2.5,
                        interval: 1,
                        repetitions: 0,
                        stability: 1.0,
                        difficulty: 0.3,
                        nextReview: new Date(),
                        lastReview: null
                    }
                });
                seededCount++;
            }
        }

        const response = NextResponse.json({
            success: true,
            cefrLevel: level,
            sentencesSeeded: seededCount
        });

        // Set cookie for middleware
        response.cookies.set('assessment-complete', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365
        });

        return response;

    } catch (error) {
        console.error('Onboarding error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
