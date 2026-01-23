import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LessonService {
    constructor(private prisma: PrismaService) { }

    async findAll(level?: string) {
        const where = level ? { level } : {};

        return this.prisma.lesson.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                level: true,
                createdAt: true,
            },
        });
    }

    async findOne(id: string) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id },
        });

        if (!lesson) {
            throw new NotFoundException('Lesson not found');
        }

        return lesson;
    }

    async create(data: { title: string; level: string; content: any; createdBy?: string }) {
        return this.prisma.lesson.create({
            data: {
                id: uuidv4(),
                title: data.title,
                level: data.level,
                content: data.content,
                createdBy: data.createdBy,
            },
        });
    }

    async getNextLesson(userId: string) {
        // Get user's current level
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { prefs: true },
        });

        const currentLevel = (user?.prefs as any)?.currentLevel || 'A1';

        // Get a lesson at their level that they haven't completed
        const completedLessons = await this.prisma.analyticsEvent.findMany({
            where: {
                userId,
                eventType: 'lesson_completed',
            },
            select: { payload: true },
        });

        const completedIds = completedLessons.map((e: any) => e.payload?.lessonId).filter(Boolean);

        const nextLesson = await this.prisma.lesson.findFirst({
            where: {
                level: currentLevel,
                id: { notIn: completedIds },
            },
            orderBy: { createdAt: 'asc' },
        });

        return nextLesson;
    }

    async getLessonContent(lessonId: string) {
        const lesson = await this.findOne(lessonId);
        return lesson.content;
    }
}
