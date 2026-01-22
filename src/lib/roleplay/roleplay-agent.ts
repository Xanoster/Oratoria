import { GoogleGenerativeAI } from '@google/generative-ai';

interface RoleplayTurn {
    role: 'user' | 'model';
    text: string;
}

interface RoleplayContext {
    persona: string;
    personaPrompt: string;
    setting: string;
    radius: CEFRLevel;
}
import { CEFRLevel } from '@/types';

// Fallback script for "The Bakery" if no API key
const BAKERY_SCRIPT = [
    {
        trigger: 'start',
        response: 'Guten Morgen! Was darf es sein?',
        translation: 'Good morning! What would you like?'
    },
    {
        trigger: 'bread', // keywords
        response: 'Gerne via. Wir haben normale Brötchen und Vollkornbrötchen. Welche möchten Sie?',
        translation: 'Gladly. We have normal rolls and whole grain rolls. Which would you like?'
    },
    {
        trigger: 'coffee',
        response: 'Kommt sofort. Möchten Sie Milch und Zücker?',
        translation: 'Coming right up. Would you like milk and sugar?'
    },
    {
        trigger: 'default', // generic fallback
        response: 'Entschuldigung, ich habe Sie nicht verstanden. Möchten Sie Brötchen?',
        translation: 'Sorry, I didnt understand. Would you like rolls?'
    }
];

export class RoleplayAgent {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    constructor() {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        }
    }

    async generateResponse(
        history: RoleplayTurn[],
        lastUserMessage: string,
        context: RoleplayContext
    ): Promise<{ german: string; english: string }> {
        // 1. Try Gemini
        if (this.model) {
            try {
                const systemPrompt = `
                ACT AS: ${context.persona}
                SETTING: ${context.setting}
                LEVEL: ${context.radius}
                INSTRUCTIONS:
                ${context.personaPrompt}
                
                OUTPUT FORMAT:
                JSON with fields: "german" (your response), "english" (translation).
                `;

                const chat = this.model.startChat({
                    history: [
                        { role: 'user', parts: [{ text: systemPrompt }] },
                        { role: 'model', parts: [{ text: 'Verstanden. Ich bin bereit.' }] },
                        ...history.map(h => ({
                            role: h.role,
                            parts: [{ text: h.text }]
                        }))
                    ]
                });

                const result = await chat.sendMessage(lastUserMessage);
                const responseText = result.response.text();

                // Parse JSON response
                // Gemini might include markdown blocks ```json ... ```
                const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanJson);

            } catch (error) {
                console.error('Gemini API error, falling back to script:', error);
            }
        }

        // 2. Fallback to Script (Simple Keyword Match for MVP)
        return this.getScriptedResponse(lastUserMessage);
    }

    private getScriptedResponse(userMessage: string): { german: string; english: string } {
        const lower = userMessage.toLowerCase();

        // Very basic scripted logic for "Bakery"
        // In a real app, this would be structured per scenario ID

        if (lower.includes('brötchen') || lower.includes('brot') || lower.includes('rolls')) {
            return {
                german: BAKERY_SCRIPT[1].response,
                english: BAKERY_SCRIPT[1].translation
            };
        }

        if (lower.includes('kaffee') || lower.includes('coffee')) {
            return {
                german: BAKERY_SCRIPT[2].response,
                english: BAKERY_SCRIPT[2].translation
            };
        }

        return {
            german: BAKERY_SCRIPT[3].response,
            english: BAKERY_SCRIPT[3].translation
        };
    }

    // Initial greeting
    getGreeting(): { german: string; english: string } {
        return {
            german: BAKERY_SCRIPT[0].response,
            english: BAKERY_SCRIPT[0].translation
        };
    }
}
