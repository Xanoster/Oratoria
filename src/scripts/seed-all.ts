/**
 * MASTER SEED SCRIPT - Populates entire database
 * 
 * Run this to get a fully working app with:
 * - 50+ German sentences (A1, A2, B1)
 * - 6 Roleplay scenarios
 * - NarrativeNode
 * - Test ready!
 * 
 * Usage: npx tsx src/scripts/seed-all.ts
 */

import prisma from '../lib/db';

// ============================================================================
// SENTENCES - 50+ real German sentences
// ============================================================================

const SENTENCES = [
    // A1 - Basics (20 sentences)
    { german: 'Ich heiße Maria.', english: 'My name is Maria.', level: 'A1', focus: 'Basic introduction' },
    { german: 'Ich komme aus Deutschland.', english: 'I come from Germany.', level: 'A1', focus: 'Origin' },
    { german: 'Ich wohne in Berlin.', english: 'I live in Berlin.', level: 'A1', focus: 'Location' },
    { german: 'Ich bin 25 Jahre alt.', english: 'I am 25 years old.', level: 'A1', focus: 'Age' },
    { german: 'Ich habe einen Bruder.', english: 'I have a brother.', level: 'A1', focus: 'Accusative after haben' },
    { german: 'Ich habe eine Schwester.', english: 'I have a sister.', level: 'A1', focus: 'Accusative - feminine' },
    { german: 'Er hat ein Auto.', english: 'He has a car.', level: 'A1', focus: 'Accusative - neuter' },
    { german: 'Wir haben einen Hund.', english: 'We have a dog.', level: 'A1', focus: 'Accusative - masculine' },
    { german: 'Sie hat eine Katze.', english: 'She has a cat.', level: 'A1', focus: 'Accusative - feminine' },
    { german: 'Ich trinke Kaffee.', english: 'I drink coffee.', level: 'A1', focus: 'Basic verb' },
    { german: 'Er isst Brot.', english: 'He eats bread.', level: 'A1', focus: 'Strong verb' },
    { german: 'Wir lernen Deutsch.', english: 'We learn German.', level: 'A1', focus: 'Present tense' },
    { german: 'Das ist mein Buch.', english: 'That is my book.', level: 'A1', focus: 'Possessive' },
    { german: 'Das ist deine Tasche.', english: 'That is your bag.', level: 'A1', focus: 'Possessive - dein' },
    { german: 'Die Frau ist nett.', english: 'The woman is nice.', level: 'A1', focus: 'Article - die' },
    { german: 'Der Mann arbeitet hier.', english: 'The man works here.', level: 'A1', focus: 'Article - der' },
    { german: 'Das Kind spielt draußen.', english: 'The child plays outside.', level: 'A1', focus: 'Article - das' },
    { german: 'Ich gehe zur Schule.', english: 'I go to school.', level: 'A1', focus: 'Preposition zu + dative' },
    { german: 'Sie geht zum Arzt.', english: 'She goes to the doctor.', level: 'A1', focus: 'Preposition zu + masculine' },
    { german: 'Wir gehen ins Kino.', english: 'We go to the cinema.', level: 'A1', focus: 'Preposition in + accusative' },

    // A1 - V2 Word Order (10 sentences)
    { german: 'Heute gehe ich zur Arbeit.', english: 'Today I go to work.', level: 'A1', focus: 'V2 word order' },
    { german: 'Morgen kaufe ich Brot.', english: 'Tomorrow I buy bread.', level: 'A1', focus: 'V2 with time' },
    { german: 'Jetzt esse ich Pizza.', english: 'Now I eat pizza.', level: 'A1', focus: 'V2 with jetzt' },
    { german: 'Dann trinke ich Wasser.', english: 'Then I drink water.', level: 'A1', focus: 'V2 with dann' },
    { german: 'Später gehe ich nach Hause.', english: 'Later I go home.', level: 'A1', focus: 'V2 with später' },
    { german: 'Um 8 Uhr beginnt die Arbeit.', english: 'At 8 o\'clock work begins.', level: 'A1', focus: 'V2 with time expression' },
    { german: 'Am Montag habe ich frei.', english: 'On Monday I am off.', level: 'A1', focus: 'V2 with day' },
    { german: 'Im Sommer fahre ich ans Meer.', english: 'In summer I go to the sea.', level: 'A1', focus: 'V2 with season' },
    { german: 'Nach der Arbeit koche ich.', english: 'After work I cook.', level: 'A1', focus: 'V2 with preposition phrase' },
    { german: 'Vor dem Essen wasche ich mir die Hände.', english: 'Before eating I wash my hands.', level: 'A1', focus: 'V2 complex' },

    // A2 - Dative Case (10 sentences)
    { german: 'Ich gebe dem Mann das Buch.', english: 'I give the man the book.', level: 'A2', focus: 'Dative - masculine' },
    { german: 'Sie hilft der Frau.', english: 'She helps the woman.', level: 'A2', focus: 'Dative after helfen' },
    { german: 'Das gehört dem Kind.', english: 'That belongs to the child.', level: 'A2', focus: 'Dative after gehören' },
    { german: 'Ich danke dir.', english: 'I thank you.', level: 'A2', focus: 'Dative after danken' },
    { german: 'Es schmeckt mir gut.', english: 'It tastes good to me.', level: 'A2', focus: 'Dative after schmecken' },
    { german: 'Der Film gefällt mir.', english: 'I like the film.', level: 'A2', focus: 'Dative after gefallen' },
    { german: 'Ich wohne bei meinen Eltern.', english: 'I live with my parents.', level: 'A2', focus: 'Dative after bei' },
    { german: 'Sie kommt mit dem Bus.', english: 'She comes by bus.', level: 'A2', focus: 'Dative after mit' },
    { german: 'Das Buch ist von meinem Freund.', english: 'The book is from my friend.', level: 'A2', focus: 'Dative after von' },
    { german: 'Ich gehe zu meiner Oma.', english: 'I go to my grandma.', level: 'A2', focus: 'Dative after zu' },

    // A2 - Perfekt Tense (10 sentences)
    { german: 'Ich habe gegessen.', english: 'I have eaten.', level: 'A2', focus: 'Perfekt with haben' },
    { german: 'Er hat geschlafen.', english: 'He has slept.', level: 'A2', focus: 'Perfekt - schlafen' },
    { german: 'Wir haben gearbeitet.', english: 'We have worked.', level: 'A2', focus: 'Perfekt - arbeiten' },
    { german: 'Sie haben das Buch gelesen.', english: 'They have read the book.', level: 'A2', focus: 'Perfekt - lesen' },
    { german: 'Ich bin nach Berlin gefahren.', english: 'I have gone to Berlin.', level: 'A2', focus: 'Perfekt with sein' },
    { german: 'Sie ist zu Hause geblieben.', english: 'She has stayed home.', level: 'A2', focus: 'Perfekt - bleiben' },
    { german: 'Wir sind spazieren gegangen.', english: 'We have gone for a walk.', level: 'A2', focus: 'Perfekt - gehen' },
    { german: 'Er ist gestern angekommen.', english: 'He arrived yesterday.', level: 'A2', focus: 'Perfekt - ankommen' },
    { german: 'Ich habe meine Hausaufgaben gemacht.', english: 'I have done my homework.', level: 'A2', focus: 'Perfekt - machen' },
    { german: 'Habt ihr das verstanden?', english: 'Did you understand that?', level: 'A2', focus: 'Perfekt question' },

    // B1 - Advanced (10 sentences)
    { german: 'Wenn ich Zeit habe, gehe ich ins Kino.', english: 'When I have time, I go to the cinema.', level: 'B1', focus: 'Subordinate clause' },
    { german: 'Obwohl es regnet, gehe ich spazieren.', english: 'Although it\'s raining, I go for a walk.', level: 'B1', focus: 'Obwohl clause' },
    { german: 'Ich weiß, dass er heute kommt.', english: 'I know that he comes today.', level: 'B1', focus: 'Dass clause' },
    { german: 'Nachdem ich gegessen hatte, bin ich spazieren gegangen.', english: 'After I had eaten, I went for a walk.', level: 'B1', focus: 'Plusquamperfekt' },
    { german: 'Ich würde gerne nach Paris fahren.', english: 'I would like to go to Paris.', level: 'B1', focus: 'Konjunktiv II' },
    { german: 'Das Buch, das ich gelesen habe, war interessant.', english: 'The book that I read was interesting.', level: 'B1', focus: 'Relative clause' },
    { german: 'Je mehr ich lerne, desto besser wird mein Deutsch.', english: 'The more I learn, the better my German gets.', level: 'B1', focus: 'Je...desto' },
    { german: 'Ich lasse mein Auto reparieren.', english: 'I have my car repaired.', level: 'B1', focus: 'Lassen construction' },
    { german: 'Um Deutsch zu lernen, gehe ich zur Schule.', english: 'To learn German, I go to school.', level: 'B1', focus: 'Um...zu infinitive' },
    { german: 'Ich freue mich darauf, dich zu sehen.', english: 'I look forward to seeing you.', level: 'B1', focus: 'Reflexive + preposition' },
];

// ============================================================================
// ROLEPLAY SCENARIOS
// ============================================================================

const SCENARIOS = [
    {
        title: 'At the Bakery',
        description: 'Order bread and pastries using basic German',
        icon: '🥐',
        orderIndex: 0,
        persona: 'Friendly baker',
        personaPrompt: 'You are a friendly German baker. Greet customers warmly and help them order. Use simple A1-level German.',
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
        personaPrompt: 'You are a new colleague meeting someone for the first time. Be friendly and ask questions about their name, where they\'re from, and what they do.',
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
        personaPrompt: 'You are a helpful supermarket employee. Help customers find products and answer their questions.',
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
        personaPrompt: 'You are a professional German waiter. Take orders, recommend dishes, and be polite. Use A2-level German.',
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
        personaPrompt: 'You are a German doctor. Ask about symptoms, give simple medical advice, and be professional but friendly.',
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
        personaPrompt: 'You are a German landlord showing an apartment. Answer questions about rent, size, location, and amenities.',
        setting: 'Phone call or apartment viewing',
        objective: 'Ask about the apartment details and schedule a viewing',
        cefrLevel: 'A2',
        maxTurns: 10
    }
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedAll() {
    console.log('🌱 Starting comprehensive database seed...\n');

    // 1. Create Narrative Node
    console.log('📚 Creating narrative node...');
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
        console.log('✅ Created Narrative Node');
    } else {
        console.log('⏭️  Narrative Node already exists');
    }

    // 2. Seed Sentences
    console.log('\n📝 Seeding sentences...');
    let sentencesCreated = 0;
    let sentencesSkipped = 0;

    for (const s of SENTENCES) {
        const existing = await prisma.sentence.findFirst({
            where: { germanText: s.german }
        });

        if (existing) {
            sentencesSkipped++;
            continue;
        }

        await prisma.sentence.create({
            data: {
                germanText: s.german,
                englishText: s.english,
                cefrLevel: s.level,
                grammarFocus: s.focus,
                clozeTargets: '[]', // No specific cloze for now
                publishedAt: new Date()
            }
        });
        sentencesCreated++;
    }

    console.log(`✅ Created ${sentencesCreated} sentences`);
    console.log(`⏭️  Skipped ${sentencesSkipped} existing sentences`);

    // 3. Seed Roleplay Scenarios
    console.log('\n🎭 Seeding roleplay scenarios...');
    let scenariosCreated = 0;
    let scenariosSkipped = 0;

    for (const scenario of SCENARIOS) {
        const existing = await prisma.roleplayScenario.findFirst({
            where: { title: scenario.title }
        });

        if (existing) {
            scenariosSkipped++;
            continue;
        }

        await prisma.roleplayScenario.create({
            data: {
                narrativeNodeId: narrativeNode.id,
                ...scenario
            }
        });
        scenariosCreated++;
    }

    console.log(`✅ Created ${scenariosCreated} scenarios`);
    console.log(`⏭️  Skipped ${scenariosSkipped} existing scenarios`);

    // 4. Summary
    console.log('\n📊 Seed Summary:');
    const totalSentences = await prisma.sentence.count();
    const totalScenarios = await prisma.roleplayScenario.count();
    console.log(`   Total Sentences: ${totalSentences}`);
    console.log(`   Total Scenarios: ${totalScenarios}`);
    console.log('\n✅ Database fully seeded!');
    console.log('\n🎉 Your app is ready to use!');
    console.log('   1. Sign up with a new account');
    console.log('   2. Complete onboarding (select your level)');
    console.log('   3. Start learning!');
}

// Run
seedAll()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seed error:', error);
        process.exit(1);
    });
