import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { analyzeGrammar } from '@/lib/gemini';

// Grammar analysis API using Gemini AI
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
        const { userInput, expectedSentence, cefrLevel } = body;

        if (!userInput || !expectedSentence) {
            return NextResponse.json(
                { error: 'Missing userInput or expectedSentence' },
                { status: 400 }
            );
        }

        // Use Gemini for grammar analysis
        const result = await analyzeGrammar(
            userInput,
            expectedSentence,
            cefrLevel || 'A1'
        );

        return NextResponse.json(result);

    } catch (error) {
        console.error('Grammar analysis error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
