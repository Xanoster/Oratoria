import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { RoleplayAgent } from '@/lib/roleplay/roleplay-agent';
import { CEFRLevel } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { scenarioId } = body;

        if (!scenarioId) {
            return NextResponse.json({ error: 'Missing scenarioId' }, { status: 400 });
        }

        let scenario;

        if (scenarioId === 'demo') {
            scenario = await prisma.roleplayScenario.findFirst();
        } else {
            scenario = await prisma.roleplayScenario.findUnique({
                where: { id: scenarioId }
            });
        }

        if (!scenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        const agent = new RoleplayAgent();
        const greeting = agent.getGreeting();

        return NextResponse.json({
            success: true,
            sessionId: 'mock-session-id-' + Date.now(), // In real app, persist session to DB
            greeting,
            persona: scenario.persona,
            setting: scenario.setting
        });

    } catch (error) {
        console.error('Roleplay start error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
