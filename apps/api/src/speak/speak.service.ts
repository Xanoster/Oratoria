import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../ai-adapter/llm.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SpeakService {
    constructor(
        private prisma: PrismaService,
        private llmService: LlmService,
    ) { }

    async createRecording(userId: string, data: {
        transcript: string;
        lessonId?: string;
        promptId?: string;
    }) {
        const recording = await this.prisma.recording.create({
            data: {
                id: uuidv4(),
                userId,
                lessonId: data.lessonId,
                promptId: data.promptId,
                transcript: data.transcript,
                status: 'received',
            },
        });

        // Trigger analysis
        await this.analyzeRecording(recording.id, data.transcript);

        return { recordingId: recording.id, status: 'received' };
    }

    async getRecordingStatus(recordingId: string) {
        const recording = await this.prisma.recording.findUnique({
            where: { id: recordingId },
            include: { analysis: true },
        });

        if (!recording) {
            return null;
        }

        return {
            status: recording.status,
            analysisId: recording.analysis?.id,
        };
    }

    private async analyzeRecording(recordingId: string, transcript: string) {
        try {
            // Get grammar analysis from LLM
            const grammarIssues = await this.llmService.analyzeGrammar(transcript);

            // Create analysis record
            const analysis = await this.prisma.analysis.create({
                data: {
                    id: uuidv4(),
                    recordingId,
                    pronunciationScore: 0.75, // Would come from pronunciation scoring service
                    phonemeScores: {},
                    grammarIssues: grammarIssues,
                    llmConfidence: 0.8,
                },
            });

            // Update recording status
            await this.prisma.recording.update({
                where: { id: recordingId },
                data: { status: 'done' },
            });

            return analysis;
        } catch (error) {
            await this.prisma.recording.update({
                where: { id: recordingId },
                data: { status: 'failed' },
            });
            throw error;
        }
    }
}
