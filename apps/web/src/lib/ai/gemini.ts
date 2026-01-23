import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getGeminiModel() {
    return genAI.getGenerativeModel({ model: 'gemini-pro' });
}

export async function analyzePlacement(responses: Record<string, string>) {
    const model = await getGeminiModel();

    const prompt = `
    You are a professional German language evaluator (CEFR standards).
    Analyze the following user responses from a placement test:

    ${Object.entries(responses).map(([id, text]) => `Prompt ${id}: "${text}"`).join('\n')}

    Determine the user's German proficiency level (A0, A1, A2, B1, B2).
    Provide a confidence score (0.0 to 1.0) and a brief list of reasons (grammar, vocabulary, complexity).
    
    Return JSON format only:
    {
      "level": "A1",
      "confidence": 0.9,
      "reasons": ["Reason 1", "Reason 2"]
    }
  `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    try {
        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json\n|\n```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error('Failed to parse Gemini response:', text);
        return {
            level: 'A1',
            confidence: 0.5,
            reasons: ['Analysis failed, defaulting to A1']
        };
    }
}

export async function analyzeSpeech(transcript: string, context: string, targetLevel: string) {
    const model = await getGeminiModel();

    const prompt = `
    You are a German language tutor.
    Context/Scenario: ${context}
    Target Level: ${targetLevel}
    User said: "${transcript}"

    Evalute the response.
    1. Is it appropriate for the context? (accepted: boolean)
    2. Give a pronunciation/grammar score (0.0 - 1.0).
    3. Provide 1-2 specific suggestions for improvement.

    Return JSON format only:
    {
      "accepted": true,
      "pronunciationScore": 0.85,
      "suggestions": ["Suggestion 1"]
    }
  `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    try {
        const cleanText = text.replace(/```json\n|\n```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        return {
            accepted: false,
            pronunciationScore: 0.0,
            suggestions: ['Could not analyze response']
        };
    }
}
