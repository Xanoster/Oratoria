import { Injectable } from '@nestjs/common';
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
};

type Judgment = 'again' | 'hard' | 'good';

@Injectable()
export class SrsService {
    constructor(private prisma: PrismaService) { }

    async getQueue(userId: string) {
        const now = new Date();

        const items = await this.prisma.srsItem.findMany({
            where: {
                userId,
                dueAt: { lte: now },
            },
            orderBy: [
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
            items: items.map(item => ({
                id: item.id,
                type: item.itemType,
                content: item.content,
                dueAt: item.dueAt,
            })),
            nextDueAt: nextDue?.dueAt || null,
        };
    }

    async submitResponse(userId: string, itemId: string, judgment: Judgment) {
        const item = await this.prisma.srsItem.findFirst({
            where: { id: itemId, userId },
        });

        if (!item) {
            throw new Error('Item not found');
        }

        const { newInterval, newEaseFactor, newDueAt } = this.calculateNextReview(
            item.intervalDays,
            item.easeFactor,
            judgment,
        );

        await this.prisma.srsItem.update({
            where: { id: itemId },
            data: {
                intervalDays: newInterval,
                easeFactor: newEaseFactor,
                dueAt: newDueAt,
                lastReviewed: new Date(),
                reviewCount: { increment: 1 },
            },
        });

        return { nextDue: newDueAt };
    }

    async createItem(userId: string, data: {
        itemType: 'vocab' | 'grammar_pattern' | 'sentence';
        content: any;
        priority?: number;
    }) {
        const now = new Date();

        return this.prisma.srsItem.create({
            data: {
                id: uuidv4(),
                userId,
                itemType: data.itemType,
                content: data.content,
                easeFactor: SRS_CONFIG.INITIAL_EASE_FACTOR,
                intervalDays: SRS_CONFIG.INITIAL_INTERVAL_DAYS,
                dueAt: new Date(now.getTime() + SRS_CONFIG.INITIAL_INTERVAL_DAYS * 24 * 60 * 60 * 1000),
                priority: data.priority || 0,
                reviewCount: 0,
            },
        });
    }

    private calculateNextReview(
        currentInterval: number,
        currentEaseFactor: number,
        judgment: Judgment,
    ): { newInterval: number; newEaseFactor: number; newDueAt: Date } {
        const now = new Date();
        let newInterval: number;
        let newEaseFactor: number;

        switch (judgment) {
            case 'again':
                // Again: interval = 0.5 * previous, ease -= 0.2, due in 6 hours
                newEaseFactor = Math.max(SRS_CONFIG.MIN_EASE_FACTOR, currentEaseFactor - 0.2);
                newInterval = Math.max(0.5, currentInterval * 0.5);
                // Due in 6 hours
                return {
                    newInterval,
                    newEaseFactor,
                    newDueAt: new Date(now.getTime() + SRS_CONFIG.AGAIN_INTERVAL_HOURS * 60 * 60 * 1000),
                };

            case 'hard':
                // Hard: interval = 1.2 * previous, ease -= 0.1
                newEaseFactor = currentEaseFactor - 0.1;
                newInterval = Math.ceil(currentInterval * 1.2);
                break;

            case 'good':
                // Good: interval = previous * easeFactor, ease += 0.05
                newEaseFactor = Math.min(SRS_CONFIG.MAX_EASE_FACTOR, currentEaseFactor + 0.05);
                newInterval = Math.ceil(currentInterval * currentEaseFactor);
                break;

            default:
                newInterval = currentInterval;
                newEaseFactor = currentEaseFactor;
        }

        // Cap interval at max
        newInterval = Math.min(newInterval, SRS_CONFIG.MAX_INTERVAL_DAYS);

        // Calculate due date
        const newDueAt = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

        return { newInterval, newEaseFactor, newDueAt };
    }
}
