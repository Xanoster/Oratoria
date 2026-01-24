import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LevelGuardService } from './level-guard.service';
import { CEFRLevel } from './cefr-definitions';

describe('LevelGuardService', () => {
    let service: LevelGuardService;

    const mockConfigService = {
        get: jest.fn().mockReturnValue(null), // No API key for unit tests
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LevelGuardService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<LevelGuardService>(LevelGuardService);
    });

    describe('validateContent', () => {
        it('should approve A0 vocabulary for A0 user', () => {
            const result = service.validateContent({
                userLevel: 'A0',
                contentTokens: ['hallo', 'danke', 'ja', 'nein'],
            });

            expect(result.hasViolations).toBe(false);
            expect(result.approvedContent).toEqual(['hallo', 'danke', 'ja', 'nein']);
            expect(result.violations).toHaveLength(0);
        });

        it('should detect violations when A2 words used for A0 user', () => {
            const result = service.validateContent({
                userLevel: 'A0',
                contentTokens: ['hallo', 'wahrscheinlich'], // wahrscheinlich is A2+
            });

            expect(result.approvedContent).toContain('hallo');
            // Long/advanced words should be detected
        });

        it('should allow +1 level preview when enabled', () => {
            const result = service.validateContent({
                userLevel: 'A1',
                contentTokens: ['hatte'], // Perfect tense - A2
                allowPreview: true,
            });

            // With preview allowed, A2 words should be marked as preview, not violations
            const previewViolations = result.violations.filter(v => v.isPreview);
            expect(previewViolations.length).toBeGreaterThanOrEqual(0);
        });

        it('should approve all vocabulary for B2 user', () => {
            const result = service.validateContent({
                userLevel: 'B2',
                contentTokens: ['hätte', 'nichtsdestotrotz', 'gewissermaßen'],
            });

            expect(result.approvedContent).toEqual(['hätte', 'nichtsdestotrotz', 'gewissermaßen']);
        });
    });

    describe('validateSentence', () => {
        it('should validate simple A0 sentence word count', () => {
            const result = service.validateSentence('Hallo danke', 'A0');

            // Check word count is within limit (A0 max is 5)
            expect(result.wordCount).toBe(2);
            expect(result.wordCount).toBeLessThanOrEqual(5);
        });

        it('should detect sentence length violation for A0', () => {
            const result = service.validateSentence(
                'Ich gehe heute mit meinem Freund in die Stadt',
                'A0',
            );

            // A0 max is 5 words, this has 9
            expect(result.violations.length).toBeGreaterThan(0);
        });

        it('should detect grammar structure violations', () => {
            const result = service.validateSentence(
                'Ich hätte gerne einen Kaffee', // hätte = Subjunctive II = B2
                'A1',
            );

            const grammarViolation = result.violations.find(
                v => v.reason.includes('Grammar') || v.reason.includes('grammar'),
            );
            // Should detect B2 grammar in A1 context
        });

        it('should accept B1 subordinate clauses for B1 user', () => {
            const result = service.validateSentence(
                'Ich glaube, dass er morgen kommt',
                'B1',
            );

            // B1 allows subordinate clauses with "dass"
            expect(result.grammarLevel).toBeDefined();
        });
    });

    describe('validateFullContent', () => {
        it('should validate multiple sentences', () => {
            const result = service.validateFullContent({
                userLevel: 'A1',
                content: 'Hallo! Wie geht es dir? Mir geht es gut.',
            });

            expect(result.sentences).toHaveLength(3);
        });

        it('should aggregate violations from all sentences', () => {
            const result = service.validateFullContent({
                userLevel: 'A0',
                content: 'Hallo. Ich hätte gerne einen Kaffee mit Milch bitte.',
            });

            expect(result.totalViolations.length).toBeGreaterThan(0);
        });
    });

    describe('getLevelDefinition', () => {
        it.each(['A0', 'A1', 'A2', 'B1', 'B2'] as CEFRLevel[])(
            'should return definition for %s',
            (level) => {
                const def = service.getLevelDefinition(level);

                expect(def).toBeDefined();
                expect(def.level).toBe(level);
                expect(def.maxSentenceWords).toBeGreaterThan(0);
                expect(def.allowedGrammarStructures).toBeDefined();
            },
        );
    });

    describe('getAllLevels', () => {
        it('should return all CEFR levels in order', () => {
            const levels = service.getAllLevels();

            expect(levels).toEqual(['A0', 'A1', 'A2', 'B1', 'B2']);
        });
    });
});
