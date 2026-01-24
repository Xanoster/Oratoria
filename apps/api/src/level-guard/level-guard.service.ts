import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    CEFRLevel,
    CEFR_LEVELS,
    LEVEL_ORDER,
    getLevelIndex,
    isLevelHigher,
    getNextLevel,
    getVocabularyForLevel,
    detectWordLevel,
    detectGrammarLevel,
} from './cefr-definitions';

export interface LevelValidationRequest {
    userLevel: CEFRLevel;
    contentTokens: string[];
    allowPreview?: boolean;
}

export interface Violation {
    token: string;
    detectedLevel: CEFRLevel;
    userLevel: CEFRLevel;
    reason: string;
    isPreview?: boolean;
}

export interface LevelValidationResult {
    approvedContent: string[];
    violations: Violation[];
    hasViolations: boolean;
}

export interface ContentValidationRequest {
    userLevel: CEFRLevel;
    content: string;
    allowPreview?: boolean;
}

export interface SentenceValidationResult {
    sentence: string;
    isValid: boolean;
    violations: Violation[];
    grammarLevel: CEFRLevel;
    wordCount: number;
}

@Injectable()
export class LevelGuardService {
    private readonly logger = new Logger(LevelGuardService.name);
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey && apiKey !== 'replace_me') {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }
    }

    /**
     * Main validation method - validates content tokens against user level
     */
    validateContent(request: LevelValidationRequest): LevelValidationResult {
        const { userLevel, contentTokens, allowPreview = false } = request;
        const approved: string[] = [];
        const violations: Violation[] = [];
        const nextLevel = getNextLevel(userLevel);

        for (const token of contentTokens) {
            const validation = this.validateToken(token, userLevel, allowPreview, nextLevel);

            if (validation.isValid) {
                approved.push(token);
            } else {
                violations.push(validation.violation!);
            }
        }

        return {
            approvedContent: approved,
            violations,
            hasViolations: violations.length > 0,
        };
    }

    /**
     * Validate a single token against user level
     */
    private validateToken(
        token: string,
        userLevel: CEFRLevel,
        allowPreview: boolean,
        nextLevel: CEFRLevel | null,
    ): { isValid: boolean; violation?: Violation } {
        const detectedLevel = detectWordLevel(token);

        // Token is at or below user level - approved
        if (!isLevelHigher(detectedLevel, userLevel)) {
            return { isValid: true };
        }

        // Token is exactly one level higher and preview is allowed
        if (allowPreview && nextLevel && detectedLevel === nextLevel) {
            return {
                isValid: true,
                violation: {
                    token,
                    detectedLevel,
                    userLevel,
                    reason: `Token "${token}" is ${detectedLevel} level (user is ${userLevel}) - marked as preview`,
                    isPreview: true,
                },
            };
        }

        // Token is above user level - violation
        return {
            isValid: false,
            violation: {
                token,
                detectedLevel,
                userLevel,
                reason: `Token "${token}" requires ${detectedLevel} level but user is ${userLevel}`,
            },
        };
    }

    /**
     * Validate a full sentence including grammar and length
     */
    validateSentence(sentence: string, userLevel: CEFRLevel): SentenceValidationResult {
        const violations: Violation[] = [];
        const words = sentence.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        const levelDef = CEFR_LEVELS[userLevel];

        // Check sentence length
        if (levelDef.maxSentenceWords > 0 && wordCount > levelDef.maxSentenceWords) {
            violations.push({
                token: sentence,
                detectedLevel: this.detectLevelByWordCount(wordCount),
                userLevel,
                reason: `Sentence has ${wordCount} words, max for ${userLevel} is ${levelDef.maxSentenceWords}`,
            });
        }

        // Check grammar structures
        const grammarResult = detectGrammarLevel(sentence);
        if (isLevelHigher(grammarResult.level, userLevel)) {
            violations.push({
                token: sentence,
                detectedLevel: grammarResult.level,
                userLevel,
                reason: `Grammar structures [${grammarResult.structures.join(', ')}] require ${grammarResult.level} level`,
            });
        }

        // Check individual words
        for (const word of words) {
            const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
            if (cleanWord.length < 2) continue;

            const wordLevel = detectWordLevel(cleanWord);
            if (isLevelHigher(wordLevel, userLevel)) {
                violations.push({
                    token: cleanWord,
                    detectedLevel: wordLevel,
                    userLevel,
                    reason: `Word "${cleanWord}" is ${wordLevel} level vocabulary`,
                });
            }
        }

        return {
            sentence,
            isValid: violations.length === 0,
            violations,
            grammarLevel: grammarResult.level,
            wordCount,
        };
    }

    /**
     * Validate full content (multiple sentences)
     */
    validateFullContent(request: ContentValidationRequest): {
        isValid: boolean;
        sentences: SentenceValidationResult[];
        totalViolations: Violation[];
    } {
        const { content, userLevel } = request;
        const sentences = this.splitIntoSentences(content);
        const results: SentenceValidationResult[] = [];
        const totalViolations: Violation[] = [];

        for (const sentence of sentences) {
            const result = this.validateSentence(sentence, userLevel);
            results.push(result);
            totalViolations.push(...result.violations);
        }

        return {
            isValid: totalViolations.length === 0,
            sentences: results,
            totalViolations,
        };
    }

    /**
     * Rewrite content to match target CEFR level using AI
     */
    async rewriteForLevel(content: string, targetLevel: CEFRLevel): Promise<string> {
        if (!this.model) {
            this.logger.warn('AI model not configured, returning original content');
            return content;
        }

        const levelDef = CEFR_LEVELS[targetLevel];
        const prompt = `You are a German language expert. Rewrite the following German text to be appropriate for CEFR level ${targetLevel}.

Rules for ${targetLevel}:
- Maximum ${levelDef.maxWordLength > 0 ? levelDef.maxWordLength : 'no limit on'} characters per word
- Maximum ${levelDef.maxSentenceWords} words per sentence
- Use only grammar structures appropriate for ${targetLevel}
- ${levelDef.description}

Original text:
"${content}"

Rewrite this text to match ${targetLevel} level. Keep the meaning as close as possible but simplify vocabulary and grammar as needed.

Return ONLY the rewritten German text, no explanations.`;

        try {
            const result = await this.model.generateContent(prompt);
            const rewritten = result.response.text().trim();
            return rewritten;
        } catch (error) {
            this.logger.error('AI rewrite failed', error);
            return content;
        }
    }

    /**
     * Validate and filter AI-generated content
     */
    async validateAndFilterContent(
        content: string,
        userLevel: CEFRLevel,
        options: { rewriteOnViolation?: boolean; allowPreview?: boolean } = {},
    ): Promise<{
        content: string;
        wasModified: boolean;
        violations: Violation[];
    }> {
        const { rewriteOnViolation = true, allowPreview = false } = options;

        const validation = this.validateFullContent({
            content,
            userLevel,
            allowPreview,
        });

        if (validation.isValid) {
            return {
                content,
                wasModified: false,
                violations: [],
            };
        }

        // Filter out preview violations (they're allowed)
        const actualViolations = validation.totalViolations.filter(v => !v.isPreview);

        if (actualViolations.length === 0) {
            return {
                content,
                wasModified: false,
                violations: validation.totalViolations,
            };
        }

        if (rewriteOnViolation) {
            const rewritten = await this.rewriteForLevel(content, userLevel);
            return {
                content: rewritten,
                wasModified: true,
                violations: actualViolations,
            };
        }

        return {
            content,
            wasModified: false,
            violations: actualViolations,
        };
    }

    /**
     * Get level definition for a CEFR level
     */
    getLevelDefinition(level: CEFRLevel) {
        return CEFR_LEVELS[level];
    }

    /**
     * Get all available levels
     */
    getAllLevels(): CEFRLevel[] {
        return [...LEVEL_ORDER];
    }

    /**
     * Helper: Split content into sentences
     */
    private splitIntoSentences(content: string): string[] {
        return content
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    /**
     * Helper: Detect level by word count
     */
    private detectLevelByWordCount(wordCount: number): CEFRLevel {
        if (wordCount <= 5) return 'A0';
        if (wordCount <= 8) return 'A1';
        if (wordCount <= 12) return 'A2';
        if (wordCount <= 18) return 'B1';
        return 'B2';
    }
}
