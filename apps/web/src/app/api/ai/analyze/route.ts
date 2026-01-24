import { NextRequest, NextResponse } from 'next/server';
import { analyzeSpeech } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { transcript, targetText, level = 'A1' } = body;

        if (!transcript) {
            return NextResponse.json(
                { error: 'Missing transcript' },
                { status: 400 }
            );
        }

        const analysis = await analyzeSpeech(transcript, targetText || transcript, level);

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('Analyze API error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze speech' },
            { status: 500 }
        );
    }
}
