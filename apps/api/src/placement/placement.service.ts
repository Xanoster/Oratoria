import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../ai-adapter/llm.service';
import { v4 as uuidv4 } from 'uuid';

const PLACEMENT_PROMPTS = [
    {
        id: 'p1',
        text: 'Bitte stellen Sie sich vor. Wie heißen Sie und woher kommen Sie?',
        expectedLevel: 'A1',
    },
    {
        id: 'p2',
        text: 'Was machen Sie beruflich? Erzählen Sie mir von Ihrem Arbeitstag.',
        expectedLevel: 'A2',
    },
    {
        id: 'p3',
        text: 'Was sind Ihre Hobbys? Warum interessieren Sie sich dafür?',
        expectedLevel: 'A2',
    },
    {
        id: 'p4',
        text: 'Beschreiben Sie Ihre Stadt. Was gefällt Ihnen dort und was nicht?',
        expectedLevel: 'B1',
    },
    {
        id: 'p5',
        text: 'Was denken Sie über das Thema Umweltschutz? Wie kann man die Umwelt schützen?',
        expectedLevel: 'B1',
    },
];

@Injectable()
export class PlacementService {
    constructor(
        private prisma: PrismaService,
        private llmService: LlmService,
    ) { }

    async startPlacement(userId: string) {
        const sessionId = uuidv4();

        // Create placement session
        await this.prisma.analyticsEvent.create({
            data: {
                id: uuidv4(),
                userId,
                eventType: 'placement_started',
                payload: { sessionId },
            },
        });

        return {
            placementSessionId: sessionId,
            prompts: PLACEMENT_PROMPTS.map(p => ({
                id: p.id,
                promptText: p.text,
                promptAudioUrl: null, // Would be generated TTS
            })),
            estimatedTimeSeconds: 300,
        };
    }

    async submitAudio(sessionId: string, promptId: string, transcript: string) {
        const analysisId = uuidv4();

        // Store the transcript for analysis
        await this.prisma.analyticsEvent.create({
            data: {
                id: uuidv4(),
                eventType: 'placement_response',
                payload: { sessionId, promptId, transcript, analysisId },
            },
        });

        return {
            status: 'queued',
            analysisId,
        };
    }

    async getResult(sessionId: string) {
        // Get all responses for this session
        const responses = await this.prisma.analyticsEvent.findMany({
            where: {
                eventType: 'placement_response',
                payload: {
                    path: ['sessionId'],
                    equals: sessionId,
                },
            },
        });

        if (responses.length === 0) {
            return null;
        }

        // Use LLM to analyze responses and determine level
        const transcripts = responses.map((r: any) => r.payload.transcript).join('\n');

        const analysis = await this.llmService.analyzePlacement(transcripts);

        return {
            level: analysis.level,
            confidence: analysis.confidence,
            reasons: analysis.reasons,
        };
    }
}
