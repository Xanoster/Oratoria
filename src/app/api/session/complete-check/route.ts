import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getOrCreateDefaultUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sentenceId } = body;

        if (!sentenceId) {
            return NextResponse.json({ allowed: false, reason: 'Missing sentenceId' }, { status: 400 });
        }

        const user = await getOrCreateDefaultUser();

        // Check 1: Does a recent speaking attempt exist?
        // (For MVP, just check if ANY attempt exists for this sentence today)
        const recentAttempt = await prisma.speakingAttempt.findFirst({
            where: {
                userId: user.id,
                sentenceId: sentenceId,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }
        });

        if (!recentAttempt) {
            return NextResponse.json({
                allowed: false,
                reason: 'No speaking attempt record found on server.'
            });
        }

        // Check 2: Has SRS been updated recently?
        const srsState = await prisma.sRSState.findUnique({
            where: {
                userId_sentenceId: {
                    userId: user.id,
                    sentenceId: sentenceId,
                }
            }
        });

        if (!srsState || !srsState.lastReview ||
            (Date.now() - srsState.lastReview.getTime() > 24 * 60 * 60 * 1000)) {
            // Actually, "lastReview" should be very recent (minutes ago) if it was just done
            // But let's be lenient for the check - just ensure there IS a review.
            // If lastReview is very old, it means user didn't review *this session*.
            // Let's enforce 1 hour constraint.
            if (!srsState || !srsState.lastReview ||
                (Date.now() - srsState.lastReview.getTime() > 60 * 60 * 1000)) {
                return NextResponse.json({
                    allowed: false,
                    reason: 'SRS review not persisted recently.'
                });
            }
        }

        return NextResponse.json({ allowed: true });

    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({ allowed: false, error: 'Server error' }, { status: 500 });
    }
}
