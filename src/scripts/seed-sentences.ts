/**
 * SEED SCRIPT: Initial A1 Sentence Corpus
 * 
 * This seeds the database with curated A1 German sentences.
 * These are CANONICAL - never regenerated at runtime.
 * 
 * Usage: npx ts-node src/scripts/seed-sentences.ts
 */

import prisma from '../lib/db';

// Pre-generated canonical sentences (from offline Gemini generation)
const A1_SENTENCES = [
    // Accusative after haben
    {
        germanText: 'Ich habe einen Termin.',
        englishText: 'I have an appointment.',
        cefrLevel: 'A1',
        grammarFocus: 'Accusative after haben',
        clozeTargets: '[{"type":"ARTICLE","startIdx":9,"endIdx":14}]'
    },
    {
        germanText: 'Er hat einen Hund.',
        englishText: 'He has a dog.',
        cefrLevel: 'A1',
        grammarFocus: 'Accusative after haben',
        clozeTargets: '[{"type":"ARTICLE","startIdx":7,"endIdx":12}]'
    },
    {
        germanText: 'Wir haben eine Wohnung.',
        englishText: 'We have an apartment.',
        cefrLevel: 'A1',
        grammarFocus: 'Accusative after haben',
        clozeTargets: '[{"type":"ARTICLE","startIdx":10,"endIdx":14}]'
    },
    {
        germanText: 'Sie hat ein Kind.',
        englishText: 'She has a child.',
        cefrLevel: 'A1',
        grammarFocus: 'Accusative after haben',
        clozeTargets: '[{"type":"ARTICLE","startIdx":8,"endIdx":11}]'
    },

    // V2 word order
    {
        germanText: 'Heute gehe ich zur Arbeit.',
        englishText: 'Today I go to work.',
        cefrLevel: 'A1',
        grammarFocus: 'V2 word order',
        clozeTargets: '[{"type":"VERB_POSITION","startIdx":6,"endIdx":10}]'
    },
    {
        germanText: 'Morgen kaufe ich Brot.',
        englishText: 'Tomorrow I buy bread.',
        cefrLevel: 'A1',
        grammarFocus: 'V2 word order',
        clozeTargets: '[{"type":"VERB_POSITION","startIdx":7,"endIdx":12}]'
    },
    {
        germanText: 'Um 8 Uhr beginnt die Arbeit.',
        englishText: 'At 8 o\'clock work begins.',
        cefrLevel: 'A1',
        grammarFocus: 'V2 word order',
        clozeTargets: '[{"type":"VERB_POSITION","startIdx":10,"endIdx":17}]'
    },

    // Dative after prepositions
    {
        germanText: 'Ich gehe zu dem Arzt.',
        englishText: 'I go to the doctor.',
        cefrLevel: 'A1',
        grammarFocus: 'Dative after prepositions',
        clozeTargets: '[{"type":"CASE_ENDING","startIdx":13,"endIdx":16}]'
    },
    {
        germanText: 'Sie wohnt bei der Familie.',
        englishText: 'She lives with the family.',
        cefrLevel: 'A1',
        grammarFocus: 'Dative after prepositions',
        clozeTargets: '[{"type":"CASE_ENDING","startIdx":13,"endIdx":16}]'
    },
    {
        germanText: 'Das Buch ist von dem Mann.',
        englishText: 'The book is from the man.',
        cefrLevel: 'A1',
        grammarFocus: 'Dative after prepositions',
        clozeTargets: '[{"type":"CASE_ENDING","startIdx":17,"endIdx":20}]'
    },

    // Article gender
    {
        germanText: 'Der Mann arbeitet hier.',
        englishText: 'The man works here.',
        cefrLevel: 'A1',
        grammarFocus: 'Article gender - masculine',
        clozeTargets: '[{"type":"ARTICLE","startIdx":0,"endIdx":3}]'
    },
    {
        germanText: 'Die Frau trinkt Kaffee.',
        englishText: 'The woman drinks coffee.',
        cefrLevel: 'A1',
        grammarFocus: 'Article gender - feminine',
        clozeTargets: '[{"type":"ARTICLE","startIdx":0,"endIdx":3}]'
    },
    {
        germanText: 'Das Kind spielt draußen.',
        englishText: 'The child plays outside.',
        cefrLevel: 'A1',
        grammarFocus: 'Article gender - neuter',
        clozeTargets: '[{"type":"ARTICLE","startIdx":0,"endIdx":3}]'
    },

    // Basic Perfekt
    {
        germanText: 'Ich habe gegessen.',
        englishText: 'I have eaten.',
        cefrLevel: 'A1',
        grammarFocus: 'Perfekt tense',
        clozeTargets: '[{"type":"VERB_POSITION","startIdx":9,"endIdx":17}]'
    },
    {
        germanText: 'Er hat gearbeitet.',
        englishText: 'He has worked.',
        cefrLevel: 'A1',
        grammarFocus: 'Perfekt tense',
        clozeTargets: '[{"type":"VERB_POSITION","startIdx":7,"endIdx":17}]'
    },
    {
        germanText: 'Wir haben das Buch gelesen.',
        englishText: 'We have read the book.',
        cefrLevel: 'A1',
        grammarFocus: 'Perfekt tense',
        clozeTargets: '[{"type":"VERB_POSITION","startIdx":19,"endIdx":26}]'
    }
];

async function seedSentences() {
    console.log('🌱 Seeding A1 sentences...\n');

    let created = 0;
    let skipped = 0;

    for (const sentenceData of A1_SENTENCES) {
        // Check if sentence already exists
        const existing = await prisma.sentence.findFirst({
            where: { germanText: sentenceData.germanText }
        });

        if (existing) {
            console.log(`⏭️  Skipped: ${sentenceData.germanText.substring(0, 30)}...`);
            skipped++;
            continue;
        }

        // Create sentence
        await prisma.sentence.create({
            data: {
                germanText: sentenceData.germanText,
                englishText: sentenceData.englishText,
                cefrLevel: sentenceData.cefrLevel,
                grammarFocus: sentenceData.grammarFocus,
                clozeTargets: sentenceData.clozeTargets,
                publishedAt: new Date() // Mark as published
            }
        });

        console.log(`✅ Created: ${sentenceData.germanText}`);
        created++;
    }

    console.log(`\n📊 Seeding complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
}

// Run if called directly
seedSentences()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Seeding error:', error);
        process.exit(1);
    });
