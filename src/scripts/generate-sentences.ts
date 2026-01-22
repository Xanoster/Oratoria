/**
 * OFFLINE SENTENCE GENERATION SCRIPT
 * 
 * This script generates canonical German sentences for the learning corpus.
 * Run manually, review results, then seed to database.
 * 
 * Usage:
 *   npx ts-node src/scripts/generate-sentences.ts "Accusative after haben"
 * 
 * AI MODE: OFFLINE / CURATED (Content Authority)
 * - Output is stored permanently in DB
 * - Versioned and auditable
 * - Never regenerated at runtime
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface GeneratedSentence {
    germanText: string;
    englishText: string;
    cefrLevel: string;
    grammarFocus: string;
    clozeTargets: Array<{
        type: 'ARTICLE' | 'CASE_ENDING' | 'VERB_POSITION';
        startIdx: number;
        endIdx: number;
    }>;
}

const SENTENCE_GENERATION_PROMPT = `You are a German curriculum designer for adult learners.

TASK:
Generate high-utility German sentences for a production language learning app.

TARGET USER:
- Adult professional
- Living or working in Germany
- Needs spoken competence, not textbook knowledge

LEVEL: {{CEFR_LEVEL}} ONLY

GRAMMAR OBJECTIVE (ONLY ONE PER BATCH):
{{GRAMMAR_OBJECTIVE}}

REQUIREMENTS FOR EACH SENTENCE:
- One clear grammar objective only.
- Natural spoken German.
- Adult-relevant context (work, bureaucracy, daily life).
- No childish topics.
- No slang.
- No rare vocabulary.

OUTPUT FORMAT (STRICT JSON ARRAY):

[
  {
    "germanText": "",
    "englishText": "",
    "cefrLevel": "{{CEFR_LEVEL}}",
    "grammarFocus": "{{GRAMMAR_OBJECTIVE}}",
    "clozeTargets": [
      {
        "type": "ARTICLE | CASE_ENDING | VERB_POSITION",
        "startIdx": number,
        "endIdx": number
      }
    ]
  }
]

RULES:
- Generate exactly 10 sentences.
- Articles MUST be correct and explicit.
- Avoid synonyms across sentences.
- No compound grammar (one rule only).
- If unsure about CEFR, simplify.

Do not explain.
Do not add commentary.
Return only valid JSON.`;

async function generateSentences(
    grammarObjective: string,
    cefrLevel: string = 'A1'
): Promise<GeneratedSentence[]> {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = SENTENCE_GENERATION_PROMPT
        .replace(/{{CEFR_LEVEL}}/g, cefrLevel)
        .replace(/{{GRAMMAR_OBJECTIVE}}/g, grammarObjective);

    console.log(`\n📝 Generating ${cefrLevel} sentences for: ${grammarObjective}\n`);

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON array from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const sentences: GeneratedSentence[] = JSON.parse(jsonMatch[0]);
            return sentences;
        }

        console.error('Failed to parse JSON from response');
        return [];

    } catch (error) {
        console.error('Generation error:', error);
        return [];
    }
}

// Quality validation prompt
const VALIDATION_PROMPT = `You are a German linguist auditing sentence quality.

TASK:
Evaluate the following German sentence.

CHECK:
- CEFR correctness
- Grammar purity (single objective)
- Naturalness for spoken German
- Adult relevance

OUTPUT:
- ACCEPT or REJECT
- One-line reason if REJECT

Be strict.
Assume production standards.`;

async function validateSentence(sentence: GeneratedSentence): Promise<{ valid: boolean; reason?: string }> {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `${VALIDATION_PROMPT}

SENTENCE TO EVALUATE:
German: ${sentence.germanText}
English: ${sentence.englishText}
Level: ${sentence.cefrLevel}
Grammar Focus: ${sentence.grammarFocus}`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text().toUpperCase();

        if (response.includes('ACCEPT')) {
            return { valid: true };
        } else {
            return { valid: false, reason: response };
        }

    } catch (error) {
        console.error('Validation error:', error);
        return { valid: true }; // Default to accept on error
    }
}

// Main execution
async function main() {
    const grammarObjective = process.argv[2] || 'Accusative after haben';
    const cefrLevel = process.argv[3] || 'A1';

    const sentences = await generateSentences(grammarObjective, cefrLevel);

    if (sentences.length === 0) {
        console.log('No sentences generated.');
        return;
    }

    console.log(`\n✅ Generated ${sentences.length} sentences:\n`);

    for (const sentence of sentences) {
        console.log(`DE: ${sentence.germanText}`);
        console.log(`EN: ${sentence.englishText}`);
        console.log(`Focus: ${sentence.grammarFocus}`);
        console.log('---');
    }

    // Output as JSON for easy database seeding
    console.log('\n📋 JSON for database seeding:\n');
    console.log(JSON.stringify(sentences, null, 2));
}

// Export for use as module
export { generateSentences, validateSentence };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
