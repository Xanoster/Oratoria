import { NextResponse } from 'next/server';
import { analyzePlacement } from '@/lib/ai/gemini';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { responses } = body;

        if (!responses) {
            return NextResponse.json({ error: 'Responses required' }, { status: 400 });
        }

        const result = await analyzePlacement(responses);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Placement analysis error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
