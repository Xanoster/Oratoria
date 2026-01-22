import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { RoleplayAgent } from '@/lib/roleplay/roleplay-agent';
import { CEFRLevel } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { scenarioId, userMessage, history } = body;

        const scenario = await prisma.roleplayScenario.findUnique({
            where: { id: scenarioId }
        });

        if (!scenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        const agent = new RoleplayAgent();
        const response = await agent.generateResponse(
            history || [],
            userMessage,
            {
                persona: scenario.persona,
                personaPrompt: scenario.personaPrompt,
                setting: scenario.setting,
                radius: scenario.cefrLevel as CEFRLevel
            }
        );

        return NextResponse.json({
            success: true,
            response
        });

    } catch (error) {
        console.error('Roleplay turn error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
