import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini - works on both client (with NEXT_PUBLIC_) and server
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ============================================
// SYSTEM PROMPTS FOR GERMAN LEARNING
// ============================================

export const PROMPTS = {
    // Core tutor personality
    TUTOR_SYSTEM: `You are a friendly, patient German language tutor named "Ari". 
You speak clearly, correct mistakes gently, and always encourage the learner.
Keep responses concise and focused on helping the user speak German.
When correcting, explain briefly WHY something is wrong.
Use simple German for A1-A2 learners, more complex for B1+.`,

    // Placement test evaluation
    PLACEMENT_EVAL: `You are a CEFR-certified German language evaluator.
Analyze the user's spoken responses and determine their level: A0 (complete beginner), A1, A2, B1, or B2.
Consider: vocabulary range, grammar accuracy, sentence complexity, fluency.
Be fair but accurate - don't over-estimate.`,

    // Pronunciation feedback
    PRONUNCIATION: `You are a German pronunciation coach.
Focus on: vowel length, umlauts (ä, ö, ü), ch sounds, r sounds, word stress.
Give specific, actionable feedback. Use IPA when helpful.
Be encouraging but honest about errors.`,

    // Grammar explanation
    GRAMMAR_DOCTOR: `You are the "Grammar Doctor" - you diagnose and fix German grammar issues.
Explain rules simply with examples. Focus on one concept at a time.
Common issues: case endings, verb conjugation, word order, articles.
Use the user's own sentence to demonstrate the correction.`,

    // Conversation partner
    ROLEPLAY: `You are playing a character in a German conversation scenario.
Stay in character and respond naturally in German.
Keep responses short (1-3 sentences) to encourage the user to speak more.
If the user makes mistakes, gently model the correct form in your response.`,

    // Vocabulary helper
    VOCABULARY: `You help users learn and remember German vocabulary.
Provide: the word, article (for nouns), plural form, example sentence.
Include memory tips (cognates, word roots, mnemonics).
Keep explanations brief and practical.`,
};

// ============================================
// ROLEPLAY SCENARIOS
// ============================================

export const SCENARIOS = {
    bakery: {
        title: 'At the Bakery',
        level: 'A1',
        context: 'You are at a German bakery (Bäckerei). The customer wants to buy bread and pastries.',
        aiRole: 'Friendly bakery employee',
        userRole: 'Customer',
        starterDE: 'Guten Tag! Was darf es sein?',
        starterEN: 'Good day! What can I get you?',
        vocabulary: ['das Brot', 'das Brötchen', 'der Kuchen', 'die Brezel', 'bitte', 'danke'],
    },
    restaurant: {
        title: 'At the Restaurant',
        level: 'A2',
        context: 'You are at a German restaurant. The customer is ordering food and drinks.',
        aiRole: 'Waiter/Waitress',
        userRole: 'Customer',
        starterDE: 'Guten Abend! Haben Sie schon gewählt?',
        starterEN: 'Good evening! Have you decided?',
        vocabulary: ['die Speisekarte', 'bestellen', 'die Rechnung', 'das Getränk', 'das Hauptgericht'],
    },
    train: {
        title: 'At the Train Station',
        level: 'A2',
        context: 'You are at a German train station (Bahnhof) buying a ticket.',
        aiRole: 'Ticket agent',
        userRole: 'Traveler',
        starterDE: 'Guten Tag! Wohin möchten Sie fahren?',
        starterEN: 'Good day! Where would you like to travel?',
        vocabulary: ['der Zug', 'die Fahrkarte', 'der Bahnsteig', 'abfahren', 'ankommen', 'umsteigen'],
    },
    doctor: {
        title: 'At the Doctor',
        level: 'B1',
        context: 'You are at a doctor\'s office (Arztpraxis) describing your symptoms.',
        aiRole: 'Doctor',
        userRole: 'Patient',
        starterDE: 'Guten Tag! Was führt Sie heute zu mir?',
        starterEN: 'Good day! What brings you to me today?',
        vocabulary: ['die Schmerzen', 'das Fieber', 'der Husten', 'das Rezept', 'die Tabletten'],
    },
    apartment: {
        title: 'Apartment Viewing',
        level: 'B1',
        context: 'You are viewing an apartment (Wohnung) and asking questions to the landlord.',
        aiRole: 'Landlord',
        userRole: 'Prospective tenant',
        starterDE: 'Willkommen! Die Wohnung ist sehr hell. Möchten Sie sich umsehen?',
        starterEN: 'Welcome! The apartment is very bright. Would you like to look around?',
        vocabulary: ['die Miete', 'die Nebenkosten', 'der Mietvertrag', 'die Kaution', 'einziehen'],
    },
};

// ============================================
// AI FUNCTIONS
// ============================================

export async function getModel() {
    if (!genAI) {
        throw new Error('Gemini API key not configured');
    }
    // Use gemini-2.5-flash for text generation
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

// Analyze placement test responses
export async function analyzePlacement(responses: Record<string, string>): Promise<{
    level: string;
    confidence: number;
    reasons: string[];
}> {
    const model = await getModel();

    const prompt = `${PROMPTS.PLACEMENT_EVAL}

Analyze these spoken responses from a German placement test:

${Object.entries(responses).map(([id, text]) => `[${id}]: "${text}"`).join('\n')}

Return JSON only:
{"level": "A1", "confidence": 0.85, "reasons": ["reason 1", "reason 2"]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
        const clean = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return { level: 'A1', confidence: 0.5, reasons: ['Analysis failed'] };
    }
}

// Analyze speech for pronunciation/grammar
export async function analyzeSpeech(
    transcript: string,
    targetText: string,
    level: string
): Promise<{
    score: number;
    pronunciation: { score: number; issues: string[] };
    grammar: { score: number; corrections: string[] };
    suggestions: string[];
}> {
    const model = await getModel();

    const prompt = `${PROMPTS.PRONUNCIATION}

User Level: ${level}
Target text: "${targetText}"
User said: "${transcript}"

Analyze pronunciation and grammar. Return JSON only:
{
  "score": 0.85,
  "pronunciation": {"score": 0.9, "issues": ["issue 1"]},
  "grammar": {"score": 0.8, "corrections": ["correction 1"]},
  "suggestions": ["suggestion 1"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
        const clean = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return {
            score: 0.7,
            pronunciation: { score: 0.7, issues: [] },
            grammar: { score: 0.7, corrections: [] },
            suggestions: ['Keep practicing!'],
        };
    }
}

// Roleplay conversation
export async function roleplayResponse(
    scenarioId: string,
    userMessage: string,
    conversationHistory: { role: 'user' | 'ai'; message: string }[],
    level: string
): Promise<{
    response: string;
    translation: string;
    correction?: string;
}> {
    const scenario = SCENARIOS[scenarioId as keyof typeof SCENARIOS];
    if (!scenario) throw new Error('Unknown scenario');

    const model = await getModel();

    const historyText = conversationHistory
        .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.message}`)
        .join('\n');

    const prompt = `${PROMPTS.TUTOR_SYSTEM}

${PROMPTS.ROLEPLAY}

Scenario: ${scenario.title}
Context: ${scenario.context}
Your role: ${scenario.aiRole}
User's level: ${level}

Conversation so far:
${historyText}

User just said: "${userMessage}"

Respond as ${scenario.aiRole}. Keep it natural and encourage more speaking.
If user made a mistake, subtly model the correct form.

Return JSON only:
{
  "response": "Your German response",
  "translation": "English translation",
  "correction": "Only if user made a mistake, explain briefly. Otherwise null"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
        const clean = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return {
            response: 'Entschuldigung, können Sie das wiederholen?',
            translation: 'Excuse me, can you repeat that?',
        };
    }
}

// Grammar explanation
export async function explainGrammar(
    userSentence: string,
    error: string,
    level: string
): Promise<{
    rule: string;
    explanation: string;
    corrected: string;
    examples: string[];
}> {
    const model = await getModel();

    const prompt = `${PROMPTS.GRAMMAR_DOCTOR}

User's level: ${level}
User wrote/said: "${userSentence}"
Error type: ${error}

Explain the grammar rule simply. Return JSON only:
{
  "rule": "Short rule name",
  "explanation": "Brief explanation",
  "corrected": "Corrected sentence",
  "examples": ["Example 1", "Example 2"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
        const clean = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return {
            rule: 'Grammar',
            explanation: 'Let me help you with that.',
            corrected: userSentence,
            examples: [],
        };
    }
}

// Get vocabulary help
export async function getVocabularyHelp(word: string, context?: string): Promise<{
    word: string;
    article?: string;
    plural?: string;
    meaning: string;
    example: string;
    tip: string;
}> {
    const model = await getModel();

    const prompt = `${PROMPTS.VOCABULARY}

Word to explain: "${word}"
${context ? `Context: ${context}` : ''}

Return JSON only:
{
  "word": "das Wort",
  "article": "das",
  "plural": "die Wörter",
  "meaning": "English meaning",
  "example": "Example sentence in German",
  "tip": "Memory tip or related words"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
        const clean = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(clean);
    } catch {
        return {
            word,
            meaning: 'Unable to look up',
            example: '',
            tip: '',
        };
    }
}

// Free conversation
export async function chat(
    userMessage: string,
    history: { role: 'user' | 'model'; parts: string }[],
    level: string
): Promise<string> {
    const model = await getModel();

    const chat = model.startChat({
        history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.parts }],
        })),
        generationConfig: {
            maxOutputTokens: 200,
        },
    });

    const systemContext = `${PROMPTS.TUTOR_SYSTEM}
User's German level: ${level}
Respond naturally, mixing German and English as appropriate for their level.
Keep responses concise (1-3 sentences).`;

    const result = await chat.sendMessage(`${systemContext}\n\nUser: ${userMessage}`);
    return result.response.text();
}
