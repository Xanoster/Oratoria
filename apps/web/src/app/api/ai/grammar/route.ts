import { NextRequest, NextResponse } from 'next/server';
import { explainGrammar } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sentence, error, level = 'A1' } = body;

        if (!sentence) {
            return NextResponse.json(
                { error: 'Missing sentence' },
                { status: 400 }
            );
        }

        const explanation = await explainGrammar(sentence, error || 'general', level);

        return NextResponse.json(explanation);
    } catch (error) {
        console.error('Grammar API error:', error);
        return NextResponse.json(
            { error: 'Failed to explain grammar' },
            { status: 500 }
        );
    }
}
