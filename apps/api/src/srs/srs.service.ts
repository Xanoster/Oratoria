import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

// SRS Algorithm constants from spec
const SRS_CONFIG = {
    INITIAL_EASE_FACTOR: 2.5,
    MIN_EASE_FACTOR: 1.3,
    MAX_EASE_FACTOR: 3.0,
    INITIAL_INTERVAL_DAYS: 1,
    MAX_INTERVAL_DAYS: 365,
    MAX_REVIEWS_PER_DAY: 50,
    AGAIN_INTERVAL_HOURS: 6,
    AGGRESSIVE_REDUCTION_FACTOR: 0.3, // 70% reduction for failures
    FAILURE_THRESHOLD: 2, // Show explanation after this many failures
};


type Judgment = 'again' | 'hard' | 'good';

export interface ReviewItemResponse {
    id: string;
    type: string;
    content: any;
    dueAt: Date;
    failureCount: number;
    explanation: string | null;
    requiresSpoken: boolean;
}

@Injectable()
export class SrsService {
    private readonly logger = new Logger(SrsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get review queue prioritized by errors and failures
     */
    async getQueue(userId: string) {
        const now = new Date();

        const items = await this.prisma.srsItem.findMany({
            where: {
                userId,
                dueAt: { lte: now },
            },
            orderBy: [
                { failureCount: 'desc' }, // Prioritize items with more failures
                { priority: 'desc' },
                { dueAt: 'asc' },
            ],
            take: SRS_CONFIG.MAX_REVIEWS_PER_DAY,
        });

        const nextDue = await this.prisma.srsItem.findFirst({
            where: {
                userId,
                dueAt: { gt: now },
            },
            orderBy: { dueAt: 'asc' },
            select: { dueAt: true },
        });

        return {
            items: items.map(
                (item): ReviewItemResponse => ({
                    id: item.id,
                    type: item.itemType,
                    content: item.content,
                    dueAt: item.dueAt,
                    failureCount: item.failureCount,
                    explanation: item.explanation,
                    requiresSpoken: item.requiresSpoken,
                }),
            ),
            nextDueAt: nextDue?.dueAt || null,
        };
    }

    /**
     * Submit review response with automatic judgment based on score
     * Score 0-100: <60 = again, 60-79 = hard, 80+ = good
     */
    async submitResponse(
        userId: string,
        itemId: string,
        judgment: Judgment,
        score?: number,
    ) {
        const item = await this.prisma.srsItem.findFirst({
            where: { id: itemId, userId },
        });

        if (!item) {
            throw new Error('Item not found');
        }

        // Auto-determine judgment from score if provided
        let finalJudgment = judgment;
        if (score !== undefined) {
            if (score < 60) finalJudgment = 'again';
            else if (score < 80) finalJudgment = 'hard';
            else finalJudgment = 'good';
        }

        const isFailure = finalJudgment === 'again';
        const newFailureCount = isFailure ? item.failureCount + 1 : 0;

        // Calculate next review with aggressive reduction for failures
        const { newInterval, newEaseFactor, newDueAt } =
            this.calculateNextReview(
                item.intervalDays,
                item.easeFactor,
                finalJudgment,
                newFailureCount,
            );

        // Generate explanation if failure threshold reached
        let explanation = item.explanation;
        if (
            newFailureCount >= SRS_CONFIG.FAILURE_THRESHOLD &&
            !explanation
        ) {
            explanation = this.generateExplanation(item);
        }

        await this.prisma.srsItem.update({
            where: { id: itemId },
            data: {
                intervalDays: newInterval,
                easeFactor: newEaseFactor,
                dueAt: newDueAt,
                lastReviewed: new Date(),
                reviewCount: { increment: 1 },
                failureCount: newFailureCount,
                explanation,
            },
        });

        this.logger.log(
            `Item ${itemId}: ${finalJudgment} (score: ${score || 'N/A'}, failures: ${newFailureCount}, next: ${newDueAt.toISOString()})`,
        );

        return {
            nextDue: newDueAt,
            failureCount: newFailureCount,
            showExplanation: newFailureCount >= SRS_CONFIG.FAILURE_THRESHOLD,
            explanation,
        };
    }

    /**
     * Create error-driven items from evaluation errors
     */
    async createItemFromError(userId: string, data: {
        evaluationId: string;
        error: any;
        userLevel: string;
    }) {
        const now = new Date();

        const itemType = this.determineItemType(data.error);
        const content = this.buildItemContent(data.error, data.userLevel);

        return this.prisma.srsItem.create({
            data: {
                id: uuidv4(),
                userId,
                itemType,
                content,
                easeFactor: SRS_CONFIG.INITIAL_EASE_FACTOR,
                intervalDays: SRS_CONFIG.INITIAL_INTERVAL_DAYS,
                dueAt: new Date(
                    now.getTime() +
                    SRS_CONFIG.INITIAL_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
                ),
                priority: 10, // High priority for error items
                requiresSpoken:
                    itemType === 'pronunciation' || itemType === 'sentence',
                sourceEvaluationId: data.evaluationId,
            },
        });
    }

    async createItem(
        userId: string,
        data: {
            itemType: 'vocab' | 'grammar_pattern' | 'sentence' | 'pronunciation';
            content: any;
            priority?: number;
            requiresSpoken?: boolean;
        },
    ) {
        const now = new Date();

        return this.prisma.srsItem.create({
            data: {
                id: uuidv4(),
                userId,
                itemType: data.itemType,
                content: data.content,
                easeFactor: SRS_CONFIG.INITIAL_EASE_FACTOR,
                intervalDays: SRS_CONFIG.INITIAL_INTERVAL_DAYS,
                dueAt: new Date(
                    now.getTime() +
                    SRS_CONFIG.INITIAL_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
                ),
                priority: data.priority || 0,
                reviewCount: 0,
                requiresSpoken: data.requiresSpoken || false,
            },
        });
    }

    private calculateNextReview(
        currentInterval: number,
        currentEaseFactor: number,
        judgment: Judgment,
        failureCount: number,
    ): { newInterval: number; newEaseFactor: number; newDueAt: Date } {
        const now = new Date();
        let newInterval: number;
        let newEaseFactor: number;

        switch (judgment) {
            case 'again':
                // Aggressive reduction for repeated failures
                if (failureCount >= SRS_CONFIG.FAILURE_THRESHOLD) {
                    newEaseFactor = Math.max(
                        SRS_CONFIG.MIN_EASE_FACTOR,
                        currentEaseFactor - 0.3,
                    );
                    newInterval = Math.max(
                        0.5,
                        Math.floor(
                            currentInterval * SRS_CONFIG.AGGRESSIVE_REDUCTION_FACTOR,
                        ),
                    );
                } else {
                    newEaseFactor = Math.max(
                        SRS_CONFIG.MIN_EASE_FACTOR,
                        currentEaseFactor - 0.2,
                    );
                    newInterval = Math.max(0.5, currentInterval * 0.5);
                }
                // Due in 6 hours
                return {
                    newInterval,
                    newEaseFactor,
                    newDueAt: new Date(
                        now.getTime() +
                        SRS_CONFIG.AGAIN_INTERVAL_HOURS * 60 * 60 * 1000,
                    ),
                };

            case 'hard':
                newEaseFactor = currentEaseFactor - 0.1;
                newInterval = Math.ceil(currentInterval * 1.2);
                break;

            case 'good':
                newEaseFactor = Math.min(
                    SRS_CONFIG.MAX_EASE_FACTOR,
                    currentEaseFactor + 0.05,
                );
                newInterval = Math.ceil(currentInterval * currentEaseFactor);
                break;

            default:
                newInterval = currentInterval;
                newEaseFactor = currentEaseFactor;
        }

        // Cap interval at max
        newInterval = Math.min(newInterval, SRS_CONFIG.MAX_INTERVAL_DAYS);

        // Calculate due date
        const newDueAt = new Date(
            now.getTime() + newInterval * 24 * 60 * 60 * 1000,
        );

        return { newInterval, newEaseFactor, newDueAt };
    }

    private generateExplanation(item: any): string {
        const content = item.content;
        const type = item.itemType;

        switch (type) {
            case 'pronunciation':
                return `Focus on the sound: ${content.phoneme || ''}. Practice slowly: "${content.word}". Listen carefully to native pronunciation.`;
            case 'vocab':
                return `Remember: ${content.answer}. Try using it in a sentence: "${content.exampleSentence || ''}"`;
            case 'grammar_pattern':
                return `Grammar rule: ${content.rule || ''}. Pattern: ${content.pattern || ''}. Practice with similar sentences.`;
            case 'sentence':
                return `Translation tip: ${content.hint || 'Break the sentence into smaller parts. Translate each part, then combine.'}`;
            default:
                return 'Review the material carefully. Try to understand the pattern rather than memorizing.';
        }
    }

    private determineItemType(error: any): string {
        const errorType = error.type?.toLowerCase() || '';

        if (errorType.includes('pronunciation') || errorType.includes('phoneme')) {
            return 'pronunciation';
        }
        if (errorType.includes('grammar') || errorType.includes('conjugation')) {
            return 'grammar_pattern';
        }
        if (errorType.includes('vocab') || errorType.includes('word')) {
            return 'vocab';
        }
        return 'sentence';
    }

    private buildItemContent(error: any, userLevel: string): any {
        const type = this.determineItemType(error);

        switch (type) {
            case 'pronunciation':
                return {
                    question: `Pronounce: ${error.word || error.text}`,
                    answer: error.word || error.text,
                    phoneme: error.phoneme,
                    tip: error.explanation || 'Focus on correct pronunciation',
                };
            case 'grammar_pattern':
                return {
                    question: error.explanation || 'Fix the grammar error',
                    answer: error.correction,
                    pattern: error.pattern,
                    rule: error.explanation,
                };
            case 'vocab':
                return {
                    question: `What does "${error.word}" mean?`,
                    answer: error.translation || error.meaning,
                    context: error.context,
                };
            default:
                return {
                    question: 'Translate or recall this sentence',
                    answer: error.correction || error.text,
                    context: error.context,
                };
        }
    }
}
