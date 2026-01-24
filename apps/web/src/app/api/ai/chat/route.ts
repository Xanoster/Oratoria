import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, history = [], level = 'A1' } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Missing message' },
                { status: 400 }
            );
        }

        const response = await chat(message, history, level);

        return NextResponse.json({ response });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}
