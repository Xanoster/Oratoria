/**
 * Seed Roleplay Scenarios for the Roadmap
 */

import prisma from '../lib/db';

const SCENARIOS = [
    {
        title: 'At the Bakery',
        description: 'Order bread and pastries using basic German',
        icon: '🥐',
        orderIndex: 0,
        persona: 'Friendly baker',
        personaPrompt: 'You are a friendly German baker. Greet customers warmly and help them order.',
        setting: 'A cozy German bakery in the morning',
        objective: 'Successfully order a bread and a pastry',
        cefrLevel: 'A1',
        maxTurns: 6
    },
    {
        title: 'Introducing Yourself',
        description: 'Meet a new colleague and introduce yourself',
        icon: '👋',
        orderIndex: 1,
        persona: 'New colleague',
        personaPrompt: 'You are a new colleague meeting someone for the first time. Be friendly and ask questions.',
        setting: 'Office break room',
        objective: 'Introduce yourself and learn about your colleague',
        cefrLevel: 'A1',
        maxTurns: 8
    },
    {
        title: 'At the Grocery Store',
        description: 'Ask for help finding items at the supermarket',
        icon: '🛒',
        orderIndex: 2,
        persona: 'Store employee',
        personaPrompt: 'You are a helpful supermarket employee. Help customers find products.',
        setting: 'German supermarket',
        objective: 'Find three items with the help of an employee',
        cefrLevel: 'A1',
        maxTurns: 8
    },
    {
        title: 'Ordering at a Restaurant',
        description: 'Order food and drinks at a German restaurant',
        icon: '🍽️',
        orderIndex: 3,
        persona: 'Waiter',
        personaPrompt: 'You are a professional German waiter. Take orders and recommend dishes.',
        setting: 'Traditional German restaurant',
        objective: 'Order a meal and a drink',
        cefrLevel: 'A2',
        maxTurns: 8
    },
    {
        title: 'At the Doctor\'s Office',
        description: 'Describe symptoms and understand medical advice',
        icon: '🏥',
        orderIndex: 4,
        persona: 'Doctor',
        personaPrompt: 'You are a German doctor. Ask about symptoms and give simple medical advice.',
        setting: 'Doctor\'s practice in Germany',
        objective: 'Describe your symptoms and understand the doctor\'s advice',
        cefrLevel: 'A2',
        maxTurns: 10
    },
    {
        title: 'Finding an Apartment',
        description: 'Ask about an apartment and schedule a viewing',
        icon: '🏠',
        orderIndex: 5,
        persona: 'Landlord',
        personaPrompt: 'You are a German landlord showing an apartment. Answer questions about the property.',
        setting: 'Phone call or apartment viewing',
        objective: 'Ask about the apartment details and schedule a viewing',
        cefrLevel: 'A2',
        maxTurns: 10
    }
];

async function seedScenarios() {
    console.log('🎭 Seeding roleplay scenarios...\n');

    // First, create a NarrativeNode if none exists
    let narrativeNode = await prisma.narrativeNode.findFirst();

    if (!narrativeNode) {
        narrativeNode = await prisma.narrativeNode.create({
            data: {
                title: 'Daily Life in Germany',
                setting: 'Various locations in Germany',
                goal: 'Master everyday German conversations',
                obstacle: 'Language barriers in daily situations',
                linguisticObjective: 'Basic A1-A2 communication skills',
                orderIndex: 0,
                unlockCriteria: '{}'
            }
        });
        console.log('✅ Created NarrativeNode: Daily Life in Germany');
    }

    let created = 0;
    let skipped = 0;

    for (const scenario of SCENARIOS) {
        const existing = await prisma.roleplayScenario.findFirst({
            where: { title: scenario.title }
        });

        if (existing) {
            console.log(`⏭️  Skipped: ${scenario.title}`);
            skipped++;
            continue;
        }

        await prisma.roleplayScenario.create({
            data: {
                narrativeNodeId: narrativeNode.id,
                title: scenario.title,
                description: scenario.description,
                icon: scenario.icon,
                orderIndex: scenario.orderIndex,
                persona: scenario.persona,
                personaPrompt: scenario.personaPrompt,
                setting: scenario.setting,
                objective: scenario.objective,
                cefrLevel: scenario.cefrLevel,
                maxTurns: scenario.maxTurns
            }
        });

        console.log(`✅ Created: ${scenario.title}`);
        created++;
    }

    console.log(`\n📊 Seeding complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
}

seedScenarios()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Seeding error:', error);
        process.exit(1);
    });
