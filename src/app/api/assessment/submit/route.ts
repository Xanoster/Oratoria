import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';

interface TaskResult {
    taskId: number;
    userInput: string;
    expected: string;
    isCorrect: boolean;
    grammarFocus: string;
}

// Infer CEFR level based on assessment results
function inferCEFRLevel(results: TaskResult[]): string {
    const totalTasks = results.length;
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = correctCount / totalTasks;

    // Error analysis by grammar type
    const errorsByType: Record<string, number> = {};
    results.forEach(r => {
        if (!r.isCorrect) {
            errorsByType[r.grammarFocus] = (errorsByType[r.grammarFocus] || 0) + 1;
        }
    });

    // Level inference logic
    if (accuracy < 0.2) {
        return 'A0'; // Complete beginner
    } else if (accuracy < 0.4) {
        return 'A1'; // Elementary - struggles with basic structures
    } else if (accuracy < 0.6) {
        // Check specific error patterns
        const hasVerbPositionIssues = (errorsByType['VERB_POSITION'] || 0) >= 2;
        const hasCaseIssues = (errorsByType['CASE'] || 0) >= 2;

        if (hasVerbPositionIssues && hasCaseIssues) {
            return 'A1'; // Fundamental issues with both V2 and cases
        }
        return 'A2'; // Pre-intermediate
    } else if (accuracy < 0.8) {
        return 'A2'; // Solid A2
    } else {
        // 80%+ accuracy
        const hasTenseIssues = (errorsByType['TENSE'] || 0) >= 1;
        if (hasTenseIssues) {
            return 'A2'; // Good basics but Perfekt needs work
        }
        return 'B1'; // Intermediate
    }
}

// Get initial sentences for seeding SRS based on level
async function getInitialSentences(cefrLevel: string, limit: number = 10) {
    // First try to find sentences matching the level
    let sentences = await prisma.sentence.findMany({
        where: {
            cefrLevel: cefrLevel,
            publishedAt: { not: null }
        },
        take: limit,
        orderBy: { createdAt: 'asc' }
    });

    // If no sentences at that level, try one level below
    if (sentences.length === 0 && cefrLevel !== 'A0') {
        const lowerLevel = cefrLevel === 'B1' ? 'A2' :
            cefrLevel === 'A2' ? 'A1' : 'A1';
        sentences = await prisma.sentence.findMany({
            where: {
                cefrLevel: lowerLevel,
                publishedAt: { not: null }
            },
            take: limit,
            orderBy: { createdAt: 'asc' }
        });
    }

    return sentences;
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
        const results: TaskResult[] = body.results;

        if (!results || !Array.isArray(results) || results.length === 0) {
            return NextResponse.json(
                { error: 'Invalid assessment results' },
                { status: 400 }
            );
        }

        // Infer CEFR level from results
        const cefrLevel = inferCEFRLevel(results);

        // Calculate metrics for ProgressState
        const correctCount = results.filter(r => r.isCorrect).length;
        const srsRetentionRate = correctCount / results.length;

        // Update user's CEFR level
        await prisma.user.update({
            where: { id: user.id },
            data: { cefrLevel }
        });

        // Create or update ProgressState
        await prisma.progressState.upsert({
            where: { userId: user.id },
            update: {
                srsRetentionRate,
                updatedAt: new Date()
            },
            create: {
                userId: user.id,
                currentNarrativeNode: 0,
                currentLesson: 0,
                srsRetentionRate,
                totalSpeakingMs: 0,
                recentSpeakingMs: 0,
                errorRecoveryRate: 0,
                speechSecondsToday: 0,
                roleplayTurnCount: 0,
                outputFrequency: 0
            }
        });

        // Seed initial SRSState entries based on level
        const initialSentences = await getInitialSentences(cefrLevel);

        for (const sentence of initialSentences) {
            // Check if SRSState already exists
            const existing = await prisma.sRSState.findUnique({
                where: {
                    userId_sentenceId: {
                        userId: user.id,
                        sentenceId: sentence.id
                    }
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
                        nextReview: new Date(), // Due immediately
                        lastReview: null
                    }
                });
            }
        }

        const response = NextResponse.json({
            success: true,
            cefrLevel,
            correctCount,
            totalTasks: results.length,
            accuracy: srsRetentionRate,
            sentencesSeeded: initialSentences.length
        });

        // Set cookie to indicate assessment is complete (for middleware)
        response.cookies.set('assessment-complete', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365 // 1 year
        });

        return response;

    } catch (error) {
        console.error('Error submitting assessment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
