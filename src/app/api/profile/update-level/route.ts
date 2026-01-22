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
        const { cefrLevel } = body;

        // Validate CEFR level
        const validLevels = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        if (!validLevels.includes(cefrLevel)) {
            return NextResponse.json({ error: 'Invalid CEFR level' }, { status: 400 });
        }

        // Update user's CEFR level
        await prisma.user.update({
            where: { id: user.id },
            data: { cefrLevel }
        });

        return NextResponse.json({
            success: true,
            cefrLevel
        });

    } catch (error) {
        console.error('Error updating level:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
