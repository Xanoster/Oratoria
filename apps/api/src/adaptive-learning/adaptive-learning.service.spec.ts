import { Test, TestingModule } from '@nestjs/testing';
import { AdaptiveLearningService, LearningContext, EvaluationSummary } from './adaptive-learning.service';
import { PrismaService } from '../prisma/prisma.service';
import { CEFRLevel } from '../level-guard/cefr-definitions';

describe('AdaptiveLearningService', () => {
    let service: AdaptiveLearningService;

    const mockPrismaService = {
        evaluation: {
            findMany: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdaptiveLearningService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<AdaptiveLearningService>(AdaptiveLearningService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const createMockEvaluation = (overrides: Partial<EvaluationSummary> = {}): EvaluationSummary => ({
        id: 'eval-1',
        overallScore: 75,
        pronunciationScore: 70,
        grammarScore: 80,
        fluencyScore: 75,
        detectedErrors: [],
        createdAt: new Date(),
        ...overrides,
    });

    const createMockContext = (overrides: Partial<LearningContext> = {}): LearningContext => ({
        userId: 'user-123',
        userLevel: 'A1' as CEFRLevel,
        recentEvaluations: [],
        errorFrequency: new Map(),
        skippedContentCount: 0,
        skippedSpeakingCount: 0,
        timeAvailableToday: 15,
        ...overrides,
    });

    describe('decideNextSession', () => {
        it('should return vocabulary focus for user with no evaluations', async () => {
            const context = createMockContext();

            const result = await service.decideNextSession(context);

            expect(result.primaryFocus).toBe('vocabulary');
            expect(result.explanationText).toContain('learning journey');
        });

        it('should return repair focus when repeated errors exist', async () => {
            const errorFrequency = new Map([
                ['grammar:der', 3],
                ['grammar:die', 3],
            ]);
            const context = createMockContext({
                errorFrequency,
                recentEvaluations: [
                    createMockEvaluation({
                        detectedErrors: [
                            { type: 'grammar', token: 'der', explanation: 'Wrong article' },
                        ],
                    }),
                ],
            });

            const result = await service.decideNextSession(context);

            expect(result.primaryFocus).toBe('repair');
            expect(result.explanationText).toContain('recurring');
        });

        it('should return pronunciation focus when pronunciation score is weak', async () => {
            const context = createMockContext({
                recentEvaluations: [
                    createMockEvaluation({ pronunciationScore: 50 }),
                    createMockEvaluation({ pronunciationScore: 55 }),
                ],
            });

            const result = await service.decideNextSession(context);

            expect(result.primaryFocus).toBe('pronunciation');
            expect(result.explanationText).toContain('pronunciation');
        });

        it('should return grammar focus when grammar score is weak', async () => {
            const context = createMockContext({
                recentEvaluations: [
                    createMockEvaluation({ grammarScore: 50, pronunciationScore: 80 }),
                    createMockEvaluation({ grammarScore: 55, pronunciationScore: 85 }),
                ],
            });

            const result = await service.decideNextSession(context);

            expect(result.primaryFocus).toBe('grammar');
            expect(result.explanationText).toContain('Grammar');
        });

        it('should return speaking focus when user skips speaking', async () => {
            const context = createMockContext({
                skippedSpeakingCount: 3,
                recentEvaluations: [createMockEvaluation()],
            });

            const result = await service.decideNextSession(context);

            expect(result.primaryFocus).toBe('speaking');
            expect(result.explanationText).toContain('speaking');
        });

        it('should return review for micro time slots', async () => {
            const context = createMockContext({
                timeAvailableToday: 3,
            });

            const result = await service.decideNextSession(context);

            expect(result.primaryFocus).toBe('review');
            expect(result.estimatedTime).toBe(3);
        });
    });

    describe('time-based session sizing', () => {
        it('should return micro session for ≤5 minutes', async () => {
            const context = createMockContext({ timeAvailableToday: 5 });

            const result = await service.decideNextSession(context);

            expect(result.estimatedTime).toBeLessThanOrEqual(5);
        });

        it('should return quick session for 5-15 minutes', async () => {
            const context = createMockContext({ timeAvailableToday: 12 });

            const result = await service.decideNextSession(context);

            expect(result.estimatedTime).toBeLessThanOrEqual(15);
        });

        it('should return standard session for 15-30 minutes', async () => {
            const context = createMockContext({ timeAvailableToday: 25 });

            const result = await service.decideNextSession(context);

            expect(result.estimatedTime).toBeLessThanOrEqual(25);
        });

        it('should return full session for ≥30 minutes', async () => {
            const context = createMockContext({ timeAvailableToday: 45 });

            const result = await service.decideNextSession(context);

            expect(result.estimatedTime).toBeLessThanOrEqual(45);
        });
    });

    describe('explanation text', () => {
        it('should not expose raw logic in explanation', async () => {
            const context = createMockContext({
                recentEvaluations: [createMockEvaluation({ pronunciationScore: 45 })],
            });

            const result = await service.decideNextSession(context);

            // Should not contain technical terms
            expect(result.explanationText).not.toContain('score');
            expect(result.explanationText).not.toContain('threshold');
            expect(result.explanationText).not.toContain('%');
        });

        it('should provide user-friendly explanation', async () => {
            const context = createMockContext();

            const result = await service.decideNextSession(context);

            expect(result.explanationText.length).toBeGreaterThan(10);
            expect(result.explanationText).not.toBe('');
        });
    });
});
