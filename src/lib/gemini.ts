import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// =============================================================================
// RUNTIME SYSTEM PROMPT (Grammar Doctor, Roleplay, Evaluation)
// =============================================================================
const RUNTIME_SYSTEM_PROMPT = `You are an expert German linguist and strict language tutor.

ROLE:
- Enforce correct German production.
- Explain grammar only when the user makes a mistake.
- Never encourage guessing or vague answers.
- Never simplify rules inaccurately.

CONSTRAINTS:
- Output must be CEFR-aligned to the level provided.
- Never switch to English unless explicitly asked.
- Never invent grammar rules.
- Never praise the user.
- Never provide long explanations.

GRAMMAR DOCTOR MODE:
When the user makes an error:
1. Identify the error type:
   CASE | GENDER | VERB_POSITION | TENSE | PREPOSITION | ARTICLE | AGREEMENT | WORD_ORDER
2. Provide the corrected sentence.
3. Provide exactly ONE concise rule explanation (max 25 words).
4. Require the user to retry.

ROLEPLAY MODE:
- Maintain persona strictly.
- Enforce scenario objective.
- Block progress if the user avoids the required grammar.
- Adapt difficulty only within CEFR bounds.

EVALUATION MODE:
- Judge meaning + structure, not string equality.
- Penalize article, case, and verb position errors heavily.
- Minor vocabulary errors are secondary.

You are not friendly.
You are precise.
You exist to make the user competent.`;

// =============================================================================
// GRAMMAR ANALYSIS
// =============================================================================

export interface GrammarError {
    type: 'CASE' | 'GENDER' | 'VERB_POSITION' | 'TENSE' | 'PREPOSITION' | 'ARTICLE' | 'AGREEMENT' | 'WORD_ORDER';
    expected: string;
    actual: string;
    explanation: string;
}

export interface GrammarAnalysisResult {
    isCorrect: boolean;
    correctedSentence: string;
    errors: GrammarError[];
    quality: number; // 0 = fail, 0.5 = partial, 1 = correct
}

export async function analyzeGrammar(
    userInput: string,
    expectedSentence: string,
    cefrLevel: string
): Promise<GrammarAnalysisResult> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: RUNTIME_SYSTEM_PROMPT
        });

        const prompt = `CEFR Level: ${cefrLevel}

Expected German: ${expectedSentence}
User produced: ${userInput}

Analyze the user's German production.

Return a JSON object with this exact structure:
{
    "isCorrect": boolean,
    "correctedSentence": "the correct German sentence",
    "quality": number (0 for wrong, 0.5 for minor errors, 1 for correct),
    "errors": [
        {
            "type": "CASE|GENDER|VERB_POSITION|TENSE|PREPOSITION|ARTICLE|AGREEMENT|WORD_ORDER",
            "expected": "correct word/phrase",
            "actual": "user's word/phrase",
            "explanation": "max 25 word explanation of the rule"
        }
    ]
}

Return ONLY valid JSON. No markdown, no explanation.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                isCorrect: parsed.isCorrect || false,
                correctedSentence: parsed.correctedSentence || expectedSentence,
                errors: parsed.errors || [],
                quality: parsed.quality || 0
            };
        }

        // Fallback to simple comparison
        const normalized = userInput.toLowerCase().trim().replace(/[.,!?]/g, '');
        const expectedNormalized = expectedSentence.toLowerCase().trim().replace(/[.,!?]/g, '');
        const isCorrect = normalized === expectedNormalized;

        return {
            isCorrect,
            correctedSentence: expectedSentence,
            errors: isCorrect ? [] : [{
                type: 'WORD_ORDER',
                expected: expectedSentence,
                actual: userInput,
                explanation: 'Check your spelling and word order carefully.'
            }],
            quality: isCorrect ? 1 : 0
        };

    } catch (error) {
        console.error('Gemini grammar analysis error:', error);

        // Fallback to simple comparison
        const normalized = userInput.toLowerCase().trim().replace(/[.,!?]/g, '');
        const expectedNormalized = expectedSentence.toLowerCase().trim().replace(/[.,!?]/g, '');
        const isCorrect = normalized === expectedNormalized;

        return {
            isCorrect,
            correctedSentence: expectedSentence,
            errors: isCorrect ? [] : [{
                type: 'WORD_ORDER',
                expected: expectedSentence,
                actual: userInput,
                explanation: 'Check your spelling and word order carefully.'
            }],
            quality: isCorrect ? 1 : 0
        };
    }
}

// =============================================================================
// ROLEPLAY RESPONSE
// =============================================================================

export interface RoleplayContext {
    persona: string;
    personaPrompt: string;
    setting: string;
    objective: string;
    cefrLevel: string;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function generateRoleplayResponse(
    userMessage: string,
    context: RoleplayContext
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: `${RUNTIME_SYSTEM_PROMPT}

CURRENT ROLEPLAY:
Persona: ${context.persona}
${context.personaPrompt}

Setting: ${context.setting}
Objective for user: ${context.objective}
CEFR Level: ${context.cefrLevel}

Stay in character. Respond naturally in German at the specified CEFR level.
If the user makes a grammar error, subtly correct them in your response.
Do not break character.`
        });

        // Build conversation
        const messages = context.conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const chat = model.startChat({ history: messages });
        const result = await chat.sendMessage(userMessage);

        return result.response.text();

    } catch (error) {
        console.error('Gemini roleplay error:', error);
        return 'Entschuldigung, ich verstehe Sie leider nicht. Können Sie das bitte wiederholen?';
    }
}

// =============================================================================
// OUTPUT EVALUATION
// =============================================================================

export interface EvaluationResult {
    quality: number; // 0-1
    meaningCorrect: boolean;
    structureCorrect: boolean;
    errors: GrammarError[];
    feedback: string;
}

export async function evaluateOutput(
    userOutput: string,
    targetMeaning: string,
    cefrLevel: string
): Promise<EvaluationResult> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: RUNTIME_SYSTEM_PROMPT
        });

        const prompt = `CEFR Level: ${cefrLevel}

Target meaning (English): ${targetMeaning}
User's German output: ${userOutput}

Evaluate the user's German production.
Judge meaning + structure, not string equality.
Penalize article, case, and verb position errors heavily.
Minor vocabulary errors are secondary.

Return a JSON object:
{
    "quality": number (0 to 1),
    "meaningCorrect": boolean,
    "structureCorrect": boolean,
    "errors": [
        {
            "type": "CASE|GENDER|VERB_POSITION|TENSE|PREPOSITION|ARTICLE|AGREEMENT|WORD_ORDER",
            "expected": "correct",
            "actual": "user's",
            "explanation": "max 25 words"
        }
    ],
    "feedback": "one sentence feedback if errors exist"
}

Return ONLY valid JSON.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return {
            quality: 0.5,
            meaningCorrect: true,
            structureCorrect: false,
            errors: [],
            feedback: 'Unable to fully evaluate. Please try again.'
        };

    } catch (error) {
        console.error('Gemini evaluation error:', error);
        return {
            quality: 0.5,
            meaningCorrect: true,
            structureCorrect: false,
            errors: [],
            feedback: 'Evaluation unavailable.'
        };
    }
}
