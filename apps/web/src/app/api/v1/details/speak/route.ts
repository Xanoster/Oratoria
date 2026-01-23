import { NextResponse } from 'next/server';
import { analyzeSpeech } from '@/lib/ai/gemini';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { transcript, context, level } = body;

        if (!transcript) {
            return NextResponse.json({ error: 'Transcript required' }, { status: 400 });
        }

        const result = await analyzeSpeech(transcript, context, level);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Speech analysis error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
