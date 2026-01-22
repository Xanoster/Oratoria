import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/auth';
import {
    calculateNextReview,
    createInitialSRSState,
    SRSState,
    recomputeStateFromHistory,
    ReviewInput
} from '@/lib/srs/srs';
import { OutputType } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sentenceId, speakingAttemptId, quality, outputType } = body;

        if (!sentenceId || quality === undefined || !outputType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const user = await getOrCreateDefaultUser();

        // Transaction to ensure atomicity:
        // 1. Get/Create SRS State
        // 2. Create ReviewHistory record
        // 3. Update SRS State
        // 4. Verify integrity (recompute check) -- optional but good pattern to ensure logic match

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current SRS state or create default
            let srsState = await tx.sRSState.findUnique({
                where: {
                    userId_sentenceId: {
                        userId: user.id,
                        sentenceId: sentenceId,
                    }
                }
            });

            if (!srsState) {
                const initial = createInitialSRSState();
                srsState = await tx.sRSState.create({
                    data: {
                        userId: user.id,
                        sentenceId: sentenceId,
                        easeFactor: initial.easeFactor,
                        interval: initial.interval,
                        repetitions: initial.repetitions,
                        stability: initial.stability,
                        difficulty: initial.difficulty,
                        nextReview: initial.nextReview,
                    }
                });
            }

            // Map DB model to domain Types
            const currentState: SRSState = {
                easeFactor: srsState.easeFactor,
                interval: srsState.interval,
                repetitions: srsState.repetitions,
                stability: srsState.stability,
                difficulty: srsState.difficulty,
                nextReview: srsState.nextReview,
                lastReview: srsState.lastReview,
            };

            const input: ReviewInput = {
                quality: quality as 0 | 0.5 | 1,
                outputType: outputType as OutputType,
            };

            // 2. Compute next state
            const nextState = calculateNextReview(currentState, input);

            // 3. Create History Entry
            const history = await tx.reviewHistory.create({
                data: {
                    srsStateId: srsState.id,
                    quality: input.quality,
                    outputType: input.outputType,
                    intervalAfter: nextState.interval,
                    easeFactorAfter: nextState.easeFactor,
                    reviewedAt: new Date(),
                }
            });

            // 4. Update SRS Record
            const updatedSRS = await tx.sRSState.update({
                where: { id: srsState.id },
                data: {
                    easeFactor: nextState.easeFactor,
                    interval: nextState.interval,
                    repetitions: nextState.repetitions,
                    stability: nextState.stability,
                    difficulty: nextState.difficulty,
                    nextReview: nextState.nextReview,
                    lastReview: nextState.lastReview, // now
                }
            });

            return updatedSRS;
        });

        return NextResponse.json({
            success: true,
            srsState: result,
        });

    } catch (error) {
        console.error('Error in SRS review:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
