import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateEvaluationDto,
    EvaluationResponseDto,
    EvaluationScoresDto,
    EvaluationStatus,
    EvaluationMode,
    DetectedErrorDto,
} from './dto/evaluation.dto';

interface AiAnalysisResult {
    pronunciationScore: number;
    grammarScore: number;
    fluencyScore: number;
    errors: Array<{
        type: 'pronunciation' | 'grammar' | 'fluency';
        token: string;
        expected: string;
        explanation: string;
        position: number;
    }>;
    confidence: number;
}

@Injectable()
export class EvaluationService {
    private readonly logger = new Logger(EvaluationService.name);
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }
    }

    async evaluate(dto: CreateEvaluationDto): Promise<EvaluationResponseDto> {
        this.logger.log(`Evaluating transcript for user ${dto.userId} in ${dto.mode} mode`);

        // Get AI analysis
        const aiResult = await this.analyzeWithAI(dto);

        // Apply mode-specific adjustments
        const adjustedScores = this.applyModeAdjustments(aiResult, dto.mode);

        // Determine final status based on confidence
        const status = this.determineStatus(adjustedScores);

        // Persist to database
        const evaluation = await this.prisma.evaluation.create({
            data: {
                userId: dto.userId,
                recordingId: dto.recordingId || null,
                transcript: dto.transcript,
                expectedText: dto.expectedText || null,
                userLevel: dto.userLevel,
                mode: dto.mode,
                overallScore: adjustedScores.overallScore,
                pronunciationScore: adjustedScores.pronunciationScore,
                grammarScore: adjustedScores.grammarScore,
                fluencyScore: adjustedScores.fluencyScore,
                detectedErrors: adjustedScores.detectedErrors as any,
                confidence: adjustedScores.confidence,
                status: status,
            },
        });

        return this.toResponseDto(evaluation);
    }

    async getEvaluation(evaluationId: string): Promise<EvaluationResponseDto | null> {
        const evaluation = await this.prisma.evaluation.findUnique({
            where: { id: evaluationId },
        });

        if (!evaluation) {
            return null;
        }

        return this.toResponseDto(evaluation);
    }

    async getUserEvaluations(userId: string, mode?: string): Promise<EvaluationResponseDto[]> {
        const where: any = { userId };
        if (mode) {
            where.mode = mode;
        }

        const evaluations = await this.prisma.evaluation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        return evaluations.map(e => this.toResponseDto(e));
    }

    private async analyzeWithAI(dto: CreateEvaluationDto): Promise<AiAnalysisResult> {
        if (!this.model) {
            this.logger.warn('AI model not configured, returning default scores');
            return this.getDefaultScores();
        }

        const prompt = this.buildAnalysisPrompt(dto);

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return this.normalizeAiResponse(parsed);
            }
        } catch (error) {
            this.logger.error('AI analysis failed', error);
        }

        return this.getDefaultScores();
    }

    private buildAnalysisPrompt(dto: CreateEvaluationDto): string {
        const strictnessNote = dto.mode === EvaluationMode.PLACEMENT
            ? 'Be STRICT in scoring. This is a placement test - accuracy matters. Penalize errors heavily.'
            : 'Be ADAPTIVE in scoring. This is a practice lesson - encourage learning. Be lenient with minor errors.';

        const expectedTextSection = dto.expectedText
            ? `Expected text: "${dto.expectedText}"\n\nCompare the transcript against the expected text.`
            : 'No expected text provided. Evaluate based on grammatical correctness and natural German.';

        return `You are a German language evaluation expert. Analyze this speech transcript.

User's CEFR Level: ${dto.userLevel}
Mode: ${dto.mode}
${strictnessNote}

Transcript: "${dto.transcript}"

${expectedTextSection}

Evaluate and return a JSON object with this exact structure:
{
  "pronunciationScore": 0-100,
  "grammarScore": 0-100,
  "fluencyScore": 0-100,
  "errors": [
    {
      "type": "pronunciation|grammar|fluency",
      "token": "the problematic word/phrase",
      "expected": "correct form",
      "explanation": "brief explanation why this is wrong",
      "position": word_index_in_transcript
    }
  ],
  "confidence": 0.0-1.0
}

Scoring guidelines for ${dto.userLevel}:
- A0/A1: Focus on basic vocabulary and simple sentence structure
- A2: Expect correct article usage and basic verb conjugation
- B1: Expect correct case usage and subordinate clauses
- B2: Expect complex grammar and idiomatic expressions

Return ONLY the JSON object, no markdown or extra text.`;
    }

    private normalizeAiResponse(parsed: any): AiAnalysisResult {
        return {
            pronunciationScore: this.clamp(parsed.pronunciationScore || 70, 0, 100),
            grammarScore: this.clamp(parsed.grammarScore || 70, 0, 100),
            fluencyScore: this.clamp(parsed.fluencyScore || 70, 0, 100),
            errors: (parsed.errors || []).map((e: any) => ({
                type: e.type || 'grammar',
                token: e.token || '',
                expected: e.expected || '',
                explanation: e.explanation || '',
                position: e.position || 0,
            })),
            confidence: this.clamp(parsed.confidence || 0.7, 0, 1),
        };
    }

    private applyModeAdjustments(result: AiAnalysisResult, mode: string): EvaluationScoresDto {
        let { pronunciationScore, grammarScore, fluencyScore, confidence, errors } = result;

        if (mode === EvaluationMode.LESSON) {
            // Adaptive mode: boost scores slightly to encourage learning
            pronunciationScore = Math.min(100, pronunciationScore * 1.1);
            grammarScore = Math.min(100, grammarScore * 1.1);
            fluencyScore = Math.min(100, fluencyScore * 1.1);

            // Filter out minor errors in lesson mode
            errors = errors.filter(e => {
                const isCritical = e.type === 'grammar' || e.explanation.toLowerCase().includes('critical');
                return isCritical;
            });
        }

        // Calculate overall score (weighted average)
        const overallScore = Math.round(
            pronunciationScore * 0.35 +
            grammarScore * 0.40 +
            fluencyScore * 0.25
        );

        return {
            overallScore,
            pronunciationScore: Math.round(pronunciationScore),
            grammarScore: Math.round(grammarScore),
            fluencyScore: Math.round(fluencyScore),
            confidence,
            detectedErrors: errors,
            status: EvaluationStatus.COMPLETED,
        };
    }

    private determineStatus(scores: EvaluationScoresDto): string {
        if (scores.confidence < 0.5) {
            return EvaluationStatus.NEEDS_REVIEW;
        }
        return EvaluationStatus.COMPLETED;
    }

    private getDefaultScores(): AiAnalysisResult {
        return {
            pronunciationScore: 70,
            grammarScore: 70,
            fluencyScore: 70,
            errors: [],
            confidence: 0.5,
        };
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    private toResponseDto(evaluation: any): EvaluationResponseDto {
        return {
            id: evaluation.id,
            userId: evaluation.userId,
            transcript: evaluation.transcript,
            expectedText: evaluation.expectedText,
            userLevel: evaluation.userLevel,
            mode: evaluation.mode,
            overallScore: evaluation.overallScore,
            pronunciationScore: evaluation.pronunciationScore,
            grammarScore: evaluation.grammarScore,
            fluencyScore: evaluation.fluencyScore,
            detectedErrors: evaluation.detectedErrors as DetectedErrorDto[],
            confidence: evaluation.confidence,
            status: evaluation.status,
            createdAt: evaluation.createdAt,
        };
    }
}
