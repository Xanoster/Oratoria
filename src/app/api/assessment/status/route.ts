import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/db';

// Check if user has completed assessment (has ProgressState)
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth().catch(() => null);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if ProgressState exists for user
        const progressState = await prisma.progressState.findUnique({
            where: { userId: user.id }
        });

        const assessmentComplete = !!progressState;

        // Get user's CEFR level if assessment is complete
        const userData = assessmentComplete ? await prisma.user.findUnique({
            where: { id: user.id },
            select: { cefrLevel: true }
        }) : null;

        return NextResponse.json({
            assessmentComplete,
            cefrLevel: userData?.cefrLevel || null
        });

    } catch (error) {
        console.error('Error checking assessment status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
