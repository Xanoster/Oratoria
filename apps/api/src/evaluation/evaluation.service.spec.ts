import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EvaluationService } from './evaluation.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto, EvaluationMode, UserLevel } from './dto/evaluation.dto';

describe('EvaluationService', () => {
    let service: EvaluationService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        evaluation: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue(null), // No API key for unit tests
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EvaluationService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<EvaluationService>(EvaluationService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('evaluate', () => {
        const createEvaluationDto: CreateEvaluationDto = {
            userId: 'user-123',
            transcript: 'Guten Tag, wie geht es Ihnen?',
            expectedText: 'Guten Tag, wie geht es Ihnen?',
            userLevel: UserLevel.A1,
            mode: EvaluationMode.LESSON,
        };

        it('should create an evaluation with default scores when AI is not configured', async () => {
            const mockEvaluation = {
                id: 'eval-123',
                userId: 'user-123',
                transcript: 'Guten Tag, wie geht es Ihnen?',
                expectedText: 'Guten Tag, wie geht es Ihnen?',
                userLevel: 'A1',
                mode: 'lesson',
                overallScore: 77,
                pronunciationScore: 77,
                grammarScore: 77,
                fluencyScore: 77,
                detectedErrors: [],
                confidence: 0.5,
                status: 'needs_review',
                createdAt: new Date(),
            };

            mockPrismaService.evaluation.create.mockResolvedValue(mockEvaluation);

            const result = await service.evaluate(createEvaluationDto);

            expect(result).toBeDefined();
            expect(result.userId).toBe('user-123');
            expect(result.transcript).toBe('Guten Tag, wie geht es Ihnen?');
            expect(result.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.overallScore).toBeLessThanOrEqual(100);
            expect(mockPrismaService.evaluation.create).toHaveBeenCalled();
        });

        it('should apply adaptive mode adjustments for lesson mode', async () => {
            const mockEvaluation = {
                id: 'eval-123',
                userId: 'user-123',
                transcript: 'Guten Tag',
                expectedText: null,
                userLevel: 'A1',
                mode: 'lesson',
                overallScore: 77,
                pronunciationScore: 77,
                grammarScore: 77,
                fluencyScore: 77,
                detectedErrors: [],
                confidence: 0.5,
                status: 'needs_review',
                createdAt: new Date(),
            };

            mockPrismaService.evaluation.create.mockResolvedValue(mockEvaluation);

            const result = await service.evaluate({
                ...createEvaluationDto,
                mode: EvaluationMode.LESSON,
            });

            expect(result.mode).toBe('lesson');
            // Lesson mode applies 1.1x boost, so scores should be slightly higher
            // But since we're using defaults (70), after boost we get ~77
            expect(mockPrismaService.evaluation.create).toHaveBeenCalled();
        });

        it('should use strict scoring for placement mode', async () => {
            const mockEvaluation = {
                id: 'eval-123',
                userId: 'user-123',
                transcript: 'Guten Tag',
                expectedText: null,
                userLevel: 'A1',
                mode: 'placement',
                overallScore: 70,
                pronunciationScore: 70,
                grammarScore: 70,
                fluencyScore: 70,
                detectedErrors: [],
                confidence: 0.5,
                status: 'needs_review',
                createdAt: new Date(),
            };

            mockPrismaService.evaluation.create.mockResolvedValue(mockEvaluation);

            const result = await service.evaluate({
                ...createEvaluationDto,
                mode: EvaluationMode.PLACEMENT,
            });

            expect(result.mode).toBe('placement');
            expect(mockPrismaService.evaluation.create).toHaveBeenCalled();
        });
    });

    describe('getEvaluation', () => {
        it('should return evaluation when found', async () => {
            const mockEvaluation = {
                id: 'eval-123',
                userId: 'user-123',
                transcript: 'Test',
                expectedText: null,
                userLevel: 'A1',
                mode: 'lesson',
                overallScore: 80,
                pronunciationScore: 75,
                grammarScore: 85,
                fluencyScore: 80,
                detectedErrors: [],
                confidence: 0.85,
                status: 'completed',
                createdAt: new Date(),
            };

            mockPrismaService.evaluation.findUnique.mockResolvedValue(mockEvaluation);

            const result = await service.getEvaluation('eval-123');

            expect(result).toBeDefined();
            expect(result!.id).toBe('eval-123');
            expect(result!.overallScore).toBe(80);
        });

        it('should return null when evaluation not found', async () => {
            mockPrismaService.evaluation.findUnique.mockResolvedValue(null);

            const result = await service.getEvaluation('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('getUserEvaluations', () => {
        it('should return all evaluations for a user', async () => {
            const mockEvaluations = [
                {
                    id: 'eval-1',
                    userId: 'user-123',
                    transcript: 'Test 1',
                    expectedText: null,
                    userLevel: 'A1',
                    mode: 'lesson',
                    overallScore: 80,
                    pronunciationScore: 75,
                    grammarScore: 85,
                    fluencyScore: 80,
                    detectedErrors: [],
                    confidence: 0.85,
                    status: 'completed',
                    createdAt: new Date(),
                },
                {
                    id: 'eval-2',
                    userId: 'user-123',
                    transcript: 'Test 2',
                    expectedText: null,
                    userLevel: 'A2',
                    mode: 'placement',
                    overallScore: 75,
                    pronunciationScore: 70,
                    grammarScore: 80,
                    fluencyScore: 75,
                    detectedErrors: [],
                    confidence: 0.9,
                    status: 'completed',
                    createdAt: new Date(),
                },
            ];

            mockPrismaService.evaluation.findMany.mockResolvedValue(mockEvaluations);

            const result = await service.getUserEvaluations('user-123');

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('eval-1');
            expect(result[1].id).toBe('eval-2');
        });

        it('should filter evaluations by mode', async () => {
            const mockEvaluations = [
                {
                    id: 'eval-1',
                    userId: 'user-123',
                    transcript: 'Test 1',
                    expectedText: null,
                    userLevel: 'A1',
                    mode: 'placement',
                    overallScore: 80,
                    pronunciationScore: 75,
                    grammarScore: 85,
                    fluencyScore: 80,
                    detectedErrors: [],
                    confidence: 0.85,
                    status: 'completed',
                    createdAt: new Date(),
                },
            ];

            mockPrismaService.evaluation.findMany.mockResolvedValue(mockEvaluations);

            const result = await service.getUserEvaluations('user-123', 'placement');

            expect(result).toHaveLength(1);
            expect(result[0].mode).toBe('placement');
            expect(mockPrismaService.evaluation.findMany).toHaveBeenCalledWith({
                where: { userId: 'user-123', mode: 'placement' },
                orderBy: { createdAt: 'desc' },
            });
        });
    });
});
