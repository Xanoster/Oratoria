import prisma from '@/lib/db';
import { CEFRLevel } from '@/types';

export async function seedRoleplayScenarios() {
    console.log('Seeding roleplay scenarios...');

    const bakeryNode = await prisma.narrativeNode.create({
        data: {
            title: 'The Bakery',
            setting: 'A cozy German bakery in Munich',
            goal: 'Buy breakfast for yourself',
            obstacle: 'The baker needs to know exactly what type of bread you want',
            linguisticObjective: 'Ordering food, polite requests (Ich möchte/hätte gern)',
            orderIndex: 0,
            unlockCriteria: JSON.stringify({
                speakingDurationMin: 0,
                errorRecoveryRate: 0,
                srsRetention: 0
            }),
        }
    });

    await prisma.roleplayScenario.create({
        data: {
            narrativeNodeId: bakeryNode.id,
            persona: 'Friendly Baker',
            personaPrompt: `You are a friendly baker (Bäcker) in Munich. 
            You speak simple German (A1 level). 
            Your goal is to sell bread rolls (Brötchen) and coffee.
            
            Rules:
            1. Speak only in German.
            2. Keep sentences short (max 10 words).
            3. Ask only one question at a time.
            4. If the user makes a grammar mistake, understand them but model the correct phrasing in your reply.
            5. Be polite and encouraging.`,
            cefrLevel: CEFRLevel.A1,
            setting: 'Morning at the bakery. The smell of fresh bread is in the air.',
            objective: 'Order 2 bread rolls and a coffee',
            maxTurns: 6,
        }
    });

    console.log('Roleplay scenarios seeded!');
}
