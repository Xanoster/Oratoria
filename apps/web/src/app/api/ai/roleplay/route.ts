import { NextRequest, NextResponse } from 'next/server';
import { roleplayResponse, SCENARIOS } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { scenarioId, message, history = [], level = 'A1' } = body;

        if (!scenarioId || !message) {
            return NextResponse.json(
                { error: 'Missing scenarioId or message' },
                { status: 400 }
            );
        }

        const response = await roleplayResponse(scenarioId, message, history, level);

        return NextResponse.json(response);
    } catch (error) {
        console.error('Roleplay API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Return available scenarios
    return NextResponse.json({
        scenarios: Object.entries(SCENARIOS).map(([id, scenario]) => ({
            id,
            title: scenario.title,
            level: scenario.level,
            description: scenario.context,
        })),
    });
}
