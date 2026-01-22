import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { analyzeGrammar } from '@/lib/grammar/grammar-doctor';
import { ErrorType } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sentenceId, transcript, durationMs } = body;

        if (!sentenceId || typeof transcript !== 'string') {
            return NextResponse.json(
                { error: 'Missing required fields: sentenceId, transcript' },
                { status: 400 }
            );
        }

        // Get authenticated user
        const user = await requireAuth().catch(() => null);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 1. Fetch sentence to compare against
        const sentence = await prisma.sentence.findUnique({
            where: { id: sentenceId },
        });

        if (!sentence) {
            return NextResponse.json(
                { error: 'Sentence not found' },
                { status: 404 }
            );
        }

        // 2. Perform server-side grammar analysis for data integrity
        // (We trust the server logic over client claims)
        const analysis = analyzeGrammar({
            expectedText: sentence.germanText,
            actualText: transcript,
        });

        // 3. Serialize errors for storage
        // Schema expects JSON string
        const errorsJson = JSON.stringify(
            analysis.errors.map(e => ({
                type: e.type,
                position: e.position,
                expected: e.expected,
                actual: e.actual,
                explanation: e.explanation
            }))
        );

        // 4. Persist result
        const attempt = await prisma.speakingAttempt.create({
            data: {
                userId: user.id,
                sentenceId: sentence.id,
                transcript: transcript,
                confidence: 1.0, // Used typed/server recognized, treat as high confidence or get from body if available
                outcome: analysis.outcome,
                durationMs: durationMs || 0,
                errors: errorsJson,
                audioPath: null, // Audio privacy invariant: opt-in only
            },
        });

        return NextResponse.json({
            success: true,
            attemptId: attempt.id,
            outcome: attempt.outcome,
            analysis: analysis, // Return analysis for client feedback
        });

    } catch (error) {
        console.error('Error creating speaking attempt:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
