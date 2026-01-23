import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface LessonContent {
    dialogue: Array<{ speaker: string; text: string; translation: string }>;
    pronunciationDrill: Array<{ word: string; phonetic: string; tip: string }>;
    grammarNote: { rule: string; examples: string[] };
    quiz: Array<{ type: 'cloze' | 'mcq'; question: string; answer: string; options?: string[] }>;
}

interface PlacementAnalysis {
    level: 'A0' | 'A1' | 'A2' | 'B1' | 'B2';
    confidence: number;
    reasons: string[];
}

interface RoleplayResponse {
    text: string;
    corrections: Array<{ error: string; correction: string; explanation: string }>;
}

@Injectable()
export class LlmService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }
    }

    async generateLesson(level: string, topic: string, userId?: string): Promise<LessonContent> {
        const prompt = `You are a German language teaching assistant. Create a lesson for CEFR level ${level} about "${topic}".

Return a JSON object with this exact structure:
{
  "dialogue": [
    {"speaker": "Person A", "text": "German text", "translation": "English translation"}
  ],
  "pronunciationDrill": [
    {"word": "German word", "phonetic": "IPA pronunciation", "tip": "Pronunciation tip under 18 words"}
  ],
  "grammarNote": {
    "rule": "Short grammar rule explanation",
    "examples": ["Example 1", "Example 2"]
  },
  "quiz": [
    {"type": "cloze", "question": "Der Mann ___ (gehen) nach Hause.", "answer": "geht"},
    {"type": "mcq", "question": "What does 'Brot' mean?", "answer": "bread", "options": ["bread", "water", "milk"]}
  ]
}

Keep vocabulary and grammar appropriate for ${level}. Dialogue should be 4-6 exchanges. Include 3 pronunciation drills and 2 quiz items.`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('LLM lesson generation failed:', error);
        }

        // Return fallback content
        return this.getFallbackLesson(level, topic);
    }

    async analyzePlacement(transcripts: string): Promise<PlacementAnalysis> {
        const prompt = `Analyze these German language samples and determine the speaker's CEFR level (A0, A1, A2, B1, or B2).

Samples:
${transcripts}

Return a JSON object:
{
  "level": "A1",
  "confidence": 0.82,
  "reasons": ["Has basic greeting vocabulary", "Simple sentence structure", "Some verb conjugation errors"]
}

Base your assessment on vocabulary range, grammar accuracy, and complexity of expression.`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('LLM placement analysis failed:', error);
        }

        return { level: 'A1', confidence: 0.5, reasons: ['Unable to analyze - defaulting to A1'] };
    }

    async generateRoleplayResponse(
        context: string,
        userLevel: string,
        userMessage: string,
        conversationHistory: string[],
    ): Promise<RoleplayResponse> {
        const prompt = `You are roleplaying as a German native speaker in this scenario: ${context}
User's CEFR level: ${userLevel}
Keep your vocabulary and grammar appropriate for their level.

Conversation so far:
${conversationHistory.join('\n')}

User just said: "${userMessage}"

Respond naturally in German. Also identify any errors in the user's message.

Return JSON:
{
  "text": "Your German response",
  "corrections": [
    {"error": "what they said wrong", "correction": "correct form", "explanation": "brief explanation"}
  ]
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('LLM roleplay failed:', error);
        }

        return {
            text: 'Entschuldigung, ich habe Sie nicht verstanden. Können Sie das wiederholen?',
            corrections: [],
        };
    }

    async analyzeGrammar(text: string): Promise<Array<{ ruleId: string; explanation: string; suggestion: string }>> {
        const prompt = `Analyze this German text for grammar errors:
"${text}"

Return a JSON array of issues found:
[
  {
    "ruleId": "verb_conjugation",
    "explanation": "The verb should be conjugated differently",
    "suggestion": "Use 'geht' instead of 'geh'"
  }
]

Return empty array if no errors.`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('LLM grammar analysis failed:', error);
        }

        return [];
    }

    private getFallbackLesson(level: string, topic: string): LessonContent {
        return {
            dialogue: [
                { speaker: 'Anna', text: 'Guten Tag!', translation: 'Good day!' },
                { speaker: 'Max', text: 'Hallo, wie geht es Ihnen?', translation: 'Hello, how are you?' },
                { speaker: 'Anna', text: 'Mir geht es gut, danke!', translation: "I'm fine, thank you!" },
                { speaker: 'Max', text: 'Das freut mich.', translation: "I'm glad to hear that." },
            ],
            pronunciationDrill: [
                { word: 'Guten', phonetic: '/ˈɡuːtn/', tip: 'The "u" is long, like "oo" in "mood"' },
                { word: 'Tag', phonetic: '/taːk/', tip: 'The "a" is long and the final "g" sounds like "k"' },
                { word: 'danke', phonetic: '/ˈdaŋkə/', tip: 'Stress on first syllable, final "e" is a schwa' },
            ],
            grammarNote: {
                rule: 'German formal "you" (Sie) is always capitalized and uses third person plural verb forms.',
                examples: ['Wie heißen Sie? (What is your name?)', 'Woher kommen Sie? (Where are you from?)'],
            },
            quiz: [
                { type: 'cloze', question: 'Guten ___!', answer: 'Tag' },
                { type: 'mcq', question: 'How do you say "thank you" in German?', answer: 'Danke', options: ['Bitte', 'Danke', 'Hallo', 'Tschüss'] },
            ],
        };
    }
}
