import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                prefs: true,
                createdAt: true,
                lastLogin: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async updateProfile(userId: string, data: { name?: string; prefs?: any }) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                prefs: data.prefs,
            },
            select: {
                id: true,
                email: true,
                name: true,
                prefs: true,
            },
        });

        return user;
    }

    async getProgress(userId: string) {
        // Get user's current level and progress metrics
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { prefs: true },
        });

        // Get SRS stats
        const srsStats = await this.prisma.srsItem.groupBy({
            by: ['itemType'],
            where: { userId },
            _count: true,
        });

        // Get recent analyses for speaking metrics
        const recentAnalyses = await this.prisma.analysis.findMany({
            where: {
                recording: { userId },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                pronunciationScore: true,
                grammarIssues: true,
                createdAt: true,
            },
        });

        const avgPronunciation = recentAnalyses.length > 0
            ? recentAnalyses.reduce((sum, a) => sum + (a.pronunciationScore || 0), 0) / recentAnalyses.length
            : null;

        return {
            level: (user?.prefs as any)?.currentLevel || 'A1',
            speaking: {
                averagePronunciationScore: avgPronunciation,
                sessionsCompleted: recentAnalyses.length,
            },
            grammar: {
                itemsLearned: srsStats.find(s => s.itemType === 'grammar_pattern')?._count || 0,
            },
            vocabulary: {
                itemsLearned: srsStats.find(s => s.itemType === 'vocab')?._count || 0,
            },
        };
    }

    async deleteVoiceData(userId: string, confirmation: string) {
        if (confirmation !== 'DELETE MY VOICE DATA') {
            throw new BadRequestException('Invalid confirmation text');
        }

        // Delete all recordings and analyses
        await this.prisma.analysis.deleteMany({
            where: { recording: { userId } },
        });

        await this.prisma.recording.deleteMany({
            where: { userId },
        });

        // Delete embeddings
        await this.prisma.embedding.deleteMany({
            where: { userId },
        });

        return { success: true, message: 'All voice data deleted' };
    }
}
