import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../ai-adapter/llm.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { EvaluationMode } from '../evaluation/dto/evaluation.dto';
import { LevelGuardService } from '../level-guard/level-guard.service';
import { SCENARIOS } from './scenarios';

// Types
export interface StartSessionInput {
    userId: string;
    scenarioId: string;
    userLevel: string;
}

export interface SubmitTurnInput {
    sessionId: string;
    userMessage: string;
}

export interface SessionResponse {
    id: string;
    scenarioId: string;
    scenario: {
        title: string;
        context: string;
        userRole: string;
        aiRole: string;
    };
    userLevel: string;
    status: string;
    hintsUsed: number;
    totalErrors: number;
    turns: TurnResponse[];
}

export interface TurnResponse {
    id: string;
    turnNumber: number;
    userMessage: string | null;
    aiResponse: string;
    aiTranslation: string | null;
    corrections: Correction[];
    hintRequested: boolean;
    hintGiven: string | null;
}

export interface Correction {
    error: string;
    correction: string;
    explanation: string;
}

export interface ErrorTrackerEntry {
    count: number;
    examples: string[];
}

export interface ErrorTracker {
    [errorType: string]: ErrorTrackerEntry;
}

export interface HintResponse {
    hint: string;
    hintsRemaining: number;
    alreadyUsedThisTurn: boolean;
}

export interface CoachingData {
    totalErrors: number;
    errorsByType: ErrorTracker;
    practicePhrase: string;
    recommendations: string[];
}

@Injectable()
export class RoleplayService {
    private readonly logger = new Logger(RoleplayService.name);

    constructor(
        private prisma: PrismaService,
        private llmService: LlmService,
        private evaluationService: EvaluationService,
        private levelGuard: LevelGuardService,
    ) { }

    /**
     * Start a new roleplay session
     */
    async startSession(input: StartSessionInput): Promise<SessionResponse> {
        const { userId, scenarioId, userLevel } = input;

        const scenario = SCENARIOS[scenarioId as keyof typeof SCENARIOS];
        if (!scenario) {
            throw new Error(`Unknown scenario: ${scenarioId}`);
        }

        // Create session
        const session = await this.prisma.roleplaySession.create({
            data: {
                userId,
                scenarioId,
                userLevel,
                status: 'active',
                errorTracker: {},
            },
        });

        // Create initial AI greeting turn
        const aiGreeting = scenario.starterDE;
        const aiTranslation = scenario.starterEN;

        await this.prisma.roleplayTurn.create({
            data: {
                sessionId: session.id,
                turnNumber: 0,
                userMessage: null,
                aiResponse: aiGreeting,
                aiTranslation,
                corrections: [],
                errors: [],
            },
        });

        this.logger.log(`Started roleplay session ${session.id} for user ${userId}`);

        return this.getSession(session.id);
    }

    /**
     * Submit a user turn and get AI response
     */
    async submitTurn(input: SubmitTurnInput): Promise<TurnResponse> {
        const { sessionId, userMessage } = input;

        const session = await this.prisma.roleplaySession.findUnique({
            where: { id: sessionId },
            include: { turns: { orderBy: { turnNumber: 'asc' } } },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        if (session.status !== 'active') {
            throw new Error(`Session is ${session.status}, cannot submit turn`);
        }

        const scenario = SCENARIOS[session.scenarioId as keyof typeof SCENARIOS];
        if (!scenario) {
            throw new Error(`Unknown scenario: ${session.scenarioId}`);
        }

        const nextTurnNumber = session.turns.length;

        // Build conversation history for LLM
        const conversationHistory = session.turns.map(t =>
            t.userMessage
                ? `User: ${t.userMessage}\nAI: ${t.aiResponse}`
                : `AI: ${t.aiResponse}`,
        );

        // Get error tracker for adaptive response
        const errorTracker = (session.errorTracker as any) as ErrorTracker;

        // Generate AI response with error adaptation
        const llmResponse = await this.generateAdaptiveResponse(
            scenario,
            session.userLevel,
            userMessage,
            conversationHistory,
            errorTracker,
        );

        // Create evaluation for the user's message
        let evaluationId: string | null = null;
        try {
            const evaluation = await this.evaluationService.evaluate({
                userId: session.userId,
                transcript: userMessage,
                userLevel: session.userLevel as any,
                mode: EvaluationMode.ROLEPLAY,
            });
            evaluationId = evaluation.id;
        } catch (error) {
            this.logger.error('Failed to create evaluation:', error);
        }

        // Update error tracker with new errors
        const updatedErrorTracker = this.updateErrorTracker(
            errorTracker,
            llmResponse.corrections,
        );

        // Create the turn
        const turn = await this.prisma.roleplayTurn.create({
            data: {
                sessionId,
                turnNumber: nextTurnNumber,
                userMessage,
                aiResponse: llmResponse.text,
                aiTranslation: llmResponse.translation,
                corrections: llmResponse.corrections as any,
                errors: llmResponse.corrections as any,
                evaluationId,
            },
        });

        // Update session with error counts
        await this.prisma.roleplaySession.update({
            where: { id: sessionId },
            data: {
                totalErrors: session.totalErrors + llmResponse.corrections.length,
                errorTracker: updatedErrorTracker as any,
            },
        });

        this.logger.log(`Turn ${nextTurnNumber} submitted for session ${sessionId}`);

        return {
            id: turn.id,
            turnNumber: turn.turnNumber,
            userMessage: turn.userMessage,
            aiResponse: turn.aiResponse,
            aiTranslation: turn.aiTranslation,
            corrections: llmResponse.corrections,
            hintRequested: false,
            hintGiven: null,
        };
    }

    /**
     * Get a hint for the current turn (max 1 per turn)
     */
    async getHint(sessionId: string): Promise<HintResponse> {
        const session = await this.prisma.roleplaySession.findUnique({
            where: { id: sessionId },
            include: { turns: { orderBy: { turnNumber: 'desc' }, take: 1 } },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const lastTurn = session.turns[0];
        if (!lastTurn) {
            throw new Error('No turns in session yet');
        }

        // Check if hint already used this turn
        if (lastTurn.hintRequested) {
            return {
                hint: lastTurn.hintGiven || 'No hint available',
                hintsRemaining: 0,
                alreadyUsedThisTurn: true,
            };
        }

        const scenario = SCENARIOS[session.scenarioId as keyof typeof SCENARIOS];
        if (!scenario) {
            throw new Error(`Unknown scenario: ${session.scenarioId}`);
        }

        // Generate hint based on context
        const hint = await this.generateHint(
            scenario,
            session.userLevel,
            lastTurn.aiResponse,
        );

        // Update turn to mark hint as used
        await this.prisma.roleplayTurn.update({
            where: { id: lastTurn.id },
            data: {
                hintRequested: true,
                hintGiven: hint,
            },
        });

        // Increment hints used in session
        await this.prisma.roleplaySession.update({
            where: { id: sessionId },
            data: { hintsUsed: session.hintsUsed + 1 },
        });

        return {
            hint,
            hintsRemaining: 0,
            alreadyUsedThisTurn: false,
        };
    }

    /**
     * Pause session and enter coaching mode
     */
    async pauseSession(sessionId: string): Promise<CoachingData> {
        const session = await this.prisma.roleplaySession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        await this.prisma.roleplaySession.update({
            where: { id: sessionId },
            data: { status: 'paused' },
        });

        const errorTracker = (session.errorTracker as any) as ErrorTracker;

        // Generate coaching data
        const recommendations = this.generateRecommendations(errorTracker);
        const practicePhrase = await this.generatePracticePhrase(
            session.userLevel,
            errorTracker,
        );

        return {
            totalErrors: session.totalErrors,
            errorsByType: errorTracker,
            practicePhrase,
            recommendations,
        };
    }

    /**
     * Resume session from coaching mode
     */
    async resumeSession(sessionId: string): Promise<SessionResponse> {
        const session = await this.prisma.roleplaySession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        if (session.status !== 'paused') {
            throw new Error(`Session is not paused`);
        }

        await this.prisma.roleplaySession.update({
            where: { id: sessionId },
            data: { status: 'active' },
        });

        return this.getSession(sessionId);
    }

    /**
     * Get full session with all turns
     */
    async getSession(sessionId: string): Promise<SessionResponse> {
        const session = await this.prisma.roleplaySession.findUnique({
            where: { id: sessionId },
            include: { turns: { orderBy: { turnNumber: 'asc' } } },
        });

        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const scenario = SCENARIOS[session.scenarioId as keyof typeof SCENARIOS];

        return {
            id: session.id,
            scenarioId: session.scenarioId,
            scenario: scenario
                ? {
                    title: scenario.title,
                    context: scenario.context,
                    userRole: scenario.userRole,
                    aiRole: scenario.aiRole,
                }
                : { title: 'Unknown', context: '', userRole: '', aiRole: '' },
            userLevel: session.userLevel,
            status: session.status,
            hintsUsed: session.hintsUsed,
            totalErrors: session.totalErrors,
            turns: session.turns.map(t => ({
                id: t.id,
                turnNumber: t.turnNumber,
                userMessage: t.userMessage,
                aiResponse: t.aiResponse,
                aiTranslation: t.aiTranslation,
                corrections: (t.corrections as any) as Correction[],
                hintRequested: t.hintRequested,
                hintGiven: t.hintGiven,
            })),
        };
    }

    /**
     * Get user's active sessions
     */
    async getUserSessions(userId: string): Promise<SessionResponse[]> {
        const sessions = await this.prisma.roleplaySession.findMany({
            where: { userId },
            include: { turns: { orderBy: { turnNumber: 'asc' } } },
            orderBy: { updatedAt: 'desc' },
        });

        return Promise.all(sessions.map(s => this.getSession(s.id)));
    }

    // Private helper methods

    private async generateAdaptiveResponse(
        scenario: (typeof SCENARIOS)[keyof typeof SCENARIOS],
        userLevel: string,
        userMessage: string,
        conversationHistory: string[],
        errorTracker: ErrorTracker,
    ): Promise<{ text: string; translation: string; corrections: Correction[] }> {
        // Build error adaptation prompt
        let errorAdaptation = '';
        const repeatedErrors = Object.entries(errorTracker).filter(
            ([, data]) => data.count >= 3,
        );

        if (repeatedErrors.length > 0) {
            errorAdaptation = '\n\nIMPORTANT - User repeatedly struggles with:\n';
            for (const [errorType, data] of repeatedErrors) {
                errorAdaptation += `- ${errorType} (${data.count} times). Model correct usage clearly.\n`;
            }
        }

        // Use LLM service for roleplay
        const response = await this.llmService.generateRoleplayResponse(
            `${scenario.context}\nYour role: ${scenario.aiRole}\nUser role: ${scenario.userRole}${errorAdaptation}`,
            userLevel,
            userMessage,
            conversationHistory,
        );

        return {
            text: response.text,
            translation: response.translation || '',
            corrections: response.corrections || [],
        };
    }

    private async generateHint(
        scenario: (typeof SCENARIOS)[keyof typeof SCENARIOS],
        userLevel: string,
        aiMessage: string,
    ): Promise<string> {
        // Generate a simple, level-appropriate hint
        const hints: Record<string, string[]> = {
            A0: [
                'Try: "Ja" or "Nein"',
                'Say: "Ich..." (I...)',
                'Numbers: eins, zwei, drei...',
            ],
            A1: [
                'Start with: "Ich möchte..." (I would like...)',
                'Use: "Bitte" or "Danke"',
                'Ask: "Wo ist...?" (Where is...?)',
            ],
            A2: [
                'Try: "Können Sie mir helfen?" (Can you help me?)',
                'Respond: "Das klingt gut" (That sounds good)',
                'Ask: "Wie viel kostet...?" (How much does... cost?)',
            ],
            B1: [
                'Express opinion: "Ich denke, dass..."',
                'Ask for clarification: "Könnten Sie das erklären?"',
                'Suggest: "Vielleicht könnten wir..."',
            ],
            B2: [
                'Use subjunctive: "Ich hätte gedacht..."',
                'Express nuance: "Es könnte sein, dass..."',
                'Discuss alternatives: "Andererseits..."',
            ],
        };

        const levelHints = hints[userLevel] || hints['A1'];
        return levelHints[Math.floor(Math.random() * levelHints.length)];
    }

    private updateErrorTracker(
        tracker: ErrorTracker,
        corrections: Correction[],
    ): ErrorTracker {
        const updated = { ...tracker };

        for (const correction of corrections) {
            // Categorize error
            const errorType = this.categorizeError(correction);

            if (!updated[errorType]) {
                updated[errorType] = { count: 0, examples: [] };
            }

            updated[errorType].count += 1;
            if (updated[errorType].examples.length < 5) {
                updated[errorType].examples.push(correction.error);
            }
        }

        return updated;
    }

    private categorizeError(correction: Correction): string {
        const explanation = correction.explanation.toLowerCase();

        if (
            explanation.includes('artikel') ||
            explanation.includes('article') ||
            explanation.includes('der/die/das')
        ) {
            return 'article-gender';
        }
        if (
            explanation.includes('verb') ||
            explanation.includes('konjugation') ||
            explanation.includes('conjugat')
        ) {
            return 'verb-conjugation';
        }
        if (
            explanation.includes('wortstellung') ||
            explanation.includes('word order')
        ) {
            return 'word-order';
        }
        if (explanation.includes('kasus') || explanation.includes('case')) {
            return 'case';
        }
        if (
            explanation.includes('aussprache') ||
            explanation.includes('pronunciat')
        ) {
            return 'pronunciation';
        }
        if (
            explanation.includes('vokabel') ||
            explanation.includes('vocabul') ||
            explanation.includes('word choice')
        ) {
            return 'vocabulary';
        }

        return 'other';
    }

    private generateRecommendations(errorTracker: ErrorTracker): string[] {
        const recommendations: string[] = [];

        for (const [errorType, data] of Object.entries(errorTracker)) {
            if (data.count >= 3) {
                switch (errorType) {
                    case 'article-gender':
                        recommendations.push(
                            'Focus on German noun genders. Try learning nouns with their articles: "der Tisch", "die Lampe", "das Buch"',
                        );
                        break;
                    case 'verb-conjugation':
                        recommendations.push(
                            'Practice verb conjugation patterns. Start with regular verbs: ich gehe, du gehst, er geht...',
                        );
                        break;
                    case 'word-order':
                        recommendations.push(
                            'Remember: verb second position in main clauses, verb final in subordinate clauses.',
                        );
                        break;
                    case 'case':
                        recommendations.push(
                            'Review German cases: Nominativ, Akkusativ, Dativ, Genitiv. Start with Akkusativ for direct objects.',
                        );
                        break;
                    default:
                        recommendations.push(
                            `You have made ${data.count} ${errorType} errors. Consider reviewing this area.`,
                        );
                }
            }
        }

        if (recommendations.length === 0) {
            recommendations.push('Great progress! Keep practicing to build fluency.');
        }

        return recommendations;
    }

    private async generatePracticePhrase(
        userLevel: string,
        errorTracker: ErrorTracker,
    ): Promise<string> {
        // Find most frequent error type
        let maxCount = 0;
        let focusArea = '';

        for (const [errorType, data] of Object.entries(errorTracker)) {
            if (data.count > maxCount) {
                maxCount = data.count;
                focusArea = errorType;
            }
        }

        // Generate practice phrase based on error type
        const phrases: Record<string, Record<string, string>> = {
            'article-gender': {
                A1: 'Der Mann trinkt den Kaffee. (The man drinks the coffee.)',
                A2: 'Die Frau liest das Buch. (The woman reads the book.)',
                B1: 'Der Student gibt dem Professor das Buch. (The student gives the book to the professor.)',
            },
            'verb-conjugation': {
                A1: 'Ich gehe, du gehst, er geht. (I go, you go, he goes.)',
                A2: 'Ich habe gegessen, ich bin gegangen. (I have eaten, I have gone.)',
                B1: 'Wenn ich Zeit hätte, würde ich kommen. (If I had time, I would come.)',
            },
            'word-order': {
                A1: 'Heute gehe ich ins Kino. (Today I go to the cinema.)',
                A2: 'Ich weiß, dass er morgen kommt. (I know that he comes tomorrow.)',
                B1: 'Obwohl es regnet, gehe ich spazieren. (Although it rains, I go for a walk.)',
            },
        };

        const focusPhrases = phrases[focusArea] || phrases['article-gender'];
        return focusPhrases[userLevel] || focusPhrases['A1'];
    }
}
