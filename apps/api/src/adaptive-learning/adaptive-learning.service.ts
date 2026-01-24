import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CEFRLevel } from '../level-guard/cefr-definitions';

// ==========================================
// Input Interfaces
// ==========================================

export interface EvaluationSummary {
    id: string;
    overallScore: number;
    pronunciationScore: number;
    grammarScore: number;
    fluencyScore: number;
    detectedErrors: DetectedError[];
    createdAt: Date;
}

export interface DetectedError {
    type: 'pronunciation' | 'grammar' | 'fluency';
    token: string;
    explanation: string;
}

export interface LearningContext {
    userId: string;
    userLevel: CEFRLevel;
    recentEvaluations: EvaluationSummary[];
    errorFrequency: Map<string, number>;
    skippedContentCount: number;
    skippedSpeakingCount: number;
    timeAvailableToday: number; // minutes
}

// ==========================================
// Output Interfaces
// ==========================================

export type PrimaryFocus = 'pronunciation' | 'grammar' | 'vocabulary' | 'speaking' | 'repair' | 'review';

export interface LessonSpec {
    type: 'repair' | 'drill' | 'standard' | 'micro';
    focus: PrimaryFocus;
    targetErrors?: string[];
    difficulty: CEFRLevel;
}

export interface SessionPlan {
    primaryFocus: PrimaryFocus;
    lessonId?: string;
    generatedLessonSpec?: LessonSpec;
    estimatedTime: number; // minutes
    explanationText: string; // User-facing
}

// ==========================================
// Decision Thresholds (Internal - not exposed)
// ==========================================

const THRESHOLDS = {
    REPEATED_ERROR_COUNT: 3,
    WEAK_PRONUNCIATION_SCORE: 60,
    WEAK_GRAMMAR_SCORE: 60,
    SKIP_SPEAKING_THRESHOLD: 2,
    RECENT_DAYS: 7,
};

const TIME_SLOTS = {
    MICRO: 5,
    QUICK: 15,
    STANDARD: 30,
    FULL: 45,
};

@Injectable()
export class AdaptiveLearningService {
    private readonly logger = new Logger(AdaptiveLearningService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Main decision method - determines what user should do next
     */
    async decideNextSession(context: LearningContext): Promise<SessionPlan> {
        this.logger.log(`Deciding next session for user ${context.userId}`);

        // Analyze performance patterns
        const analysis = this.analyzePerformance(context);

        // Determine primary focus based on analysis
        const focus = this.determineFocus(analysis, context);

        // Adapt session length to available time
        const sessionType = this.determineSessionType(context.timeAvailableToday);

        // Generate lesson spec and explanation
        const plan = this.generateSessionPlan(focus, sessionType, analysis, context);

        this.logger.log(`Session plan: ${plan.primaryFocus}, ${plan.estimatedTime}min`);
        return plan;
    }

    /**
     * Get learning context for a user from database
     */
    async getLearningContext(userId: string, timeAvailable: number): Promise<LearningContext> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - THRESHOLDS.RECENT_DAYS);

        // Fetch recent evaluations
        const evaluations = await this.prisma.evaluation.findMany({
            where: {
                userId,
                createdAt: { gte: sevenDaysAgo },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        // Fetch user for level
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { prefs: true },
        });

        const userLevel = (user?.prefs as any)?.level || 'A1';

        // Calculate error frequency
        const errorFrequency = this.calculateErrorFrequency(evaluations);

        // Get skipped content count (simplified - would track in real implementation)
        const skippedContentCount = 0;
        const skippedSpeakingCount = 0;

        return {
            userId,
            userLevel,
            recentEvaluations: evaluations.map(e => ({
                id: e.id,
                overallScore: e.overallScore,
                pronunciationScore: e.pronunciationScore,
                grammarScore: e.grammarScore,
                fluencyScore: e.fluencyScore,
                detectedErrors: (e.detectedErrors as unknown as DetectedError[]) || [],
                createdAt: e.createdAt,
            })),
            errorFrequency,
            skippedContentCount,
            skippedSpeakingCount,
            timeAvailableToday: timeAvailable,
        };
    }

    // ==========================================
    // Private Analysis Methods
    // ==========================================

    private analyzePerformance(context: LearningContext): PerformanceAnalysis {
        const { recentEvaluations, errorFrequency } = context;

        if (recentEvaluations.length === 0) {
            return {
                avgPronunciation: 100,
                avgGrammar: 100,
                avgFluency: 100,
                repeatedErrors: [],
                hasWeakPronunciation: false,
                hasWeakGrammar: false,
                hasRepeatedErrors: false,
            };
        }

        // Calculate averages
        const avgPronunciation = this.average(recentEvaluations.map(e => e.pronunciationScore));
        const avgGrammar = this.average(recentEvaluations.map(e => e.grammarScore));
        const avgFluency = this.average(recentEvaluations.map(e => e.fluencyScore));

        // Find repeated errors
        const repeatedErrors: string[] = [];
        errorFrequency.forEach((count, errorType) => {
            if (count >= THRESHOLDS.REPEATED_ERROR_COUNT) {
                repeatedErrors.push(errorType);
            }
        });

        return {
            avgPronunciation,
            avgGrammar,
            avgFluency,
            repeatedErrors,
            hasWeakPronunciation: avgPronunciation <= THRESHOLDS.WEAK_PRONUNCIATION_SCORE,
            hasWeakGrammar: avgGrammar <= THRESHOLDS.WEAK_GRAMMAR_SCORE,
            hasRepeatedErrors: repeatedErrors.length > 0,
        };
    }

    private determineFocus(
        analysis: PerformanceAnalysis,
        context: LearningContext,
    ): PrimaryFocus {
        // Priority 1: Repeated high-severity errors → Repair lesson
        if (analysis.hasRepeatedErrors) {
            return 'repair';
        }

        // Priority 2: Weak pronunciation → Speaking drills
        if (analysis.hasWeakPronunciation) {
            return 'pronunciation';
        }

        // Priority 3: Weak grammar → Grammar repair
        if (analysis.hasWeakGrammar) {
            return 'grammar';
        }

        // Priority 4: User skips speaking → Shortened speaking tasks
        if (context.skippedSpeakingCount >= THRESHOLDS.SKIP_SPEAKING_THRESHOLD) {
            return 'speaking';
        }

        // Priority 5: Low time → Quick review
        if (context.timeAvailableToday <= TIME_SLOTS.MICRO) {
            return 'review';
        }

        // Default: Vocabulary expansion
        return 'vocabulary';
    }

    private determineSessionType(timeAvailable: number): SessionType {
        if (timeAvailable <= TIME_SLOTS.MICRO) {
            return 'micro';
        }
        if (timeAvailable <= TIME_SLOTS.QUICK) {
            return 'quick';
        }
        if (timeAvailable <= TIME_SLOTS.STANDARD) {
            return 'standard';
        }
        return 'full';
    }

    private generateSessionPlan(
        focus: PrimaryFocus,
        sessionType: SessionType,
        analysis: PerformanceAnalysis,
        context: LearningContext,
    ): SessionPlan {
        const estimatedTime = this.getEstimatedTime(sessionType);
        const explanation = this.generateExplanation(focus, analysis, context);

        const lessonSpec: LessonSpec = {
            type: this.mapFocusToLessonType(focus, sessionType),
            focus,
            targetErrors: analysis.repeatedErrors.length > 0 ? analysis.repeatedErrors : undefined,
            difficulty: context.userLevel,
        };

        return {
            primaryFocus: focus,
            generatedLessonSpec: lessonSpec,
            estimatedTime,
            explanationText: explanation,
        };
    }

    private generateExplanation(
        focus: PrimaryFocus,
        analysis: PerformanceAnalysis,
        context: LearningContext,
    ): string {
        // User-facing explanations - hide raw logic
        switch (focus) {
            case 'repair':
                return "Let's focus on fixing a recurring pattern we've noticed in your practice.";

            case 'pronunciation':
                return "Today we're focusing on pronunciation to make your German sound more natural.";

            case 'grammar':
                return "Grammar practice today to strengthen your sentence structure.";

            case 'speaking':
                return context.skippedSpeakingCount >= 2
                    ? "A quick speaking exercise - just 2 minutes today!"
                    : "Time to practice speaking out loud!";

            case 'review':
                return "Quick review of words you're learning - perfect for the time you have.";

            case 'vocabulary':
            default:
                return "Continuing your learning journey with new vocabulary and phrases.";
        }
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    private calculateErrorFrequency(evaluations: any[]): Map<string, number> {
        const frequency = new Map<string, number>();

        for (const evaluation of evaluations) {
            const errors = (evaluation.detectedErrors as DetectedError[]) || [];
            for (const error of errors) {
                const key = `${error.type}:${error.token}`;
                frequency.set(key, (frequency.get(key) || 0) + 1);
            }
        }

        return frequency;
    }

    private average(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    private getEstimatedTime(sessionType: SessionType): number {
        switch (sessionType) {
            case 'micro': return 3;
            case 'quick': return 10;
            case 'standard': return 20;
            case 'full': return 35;
        }
    }

    private mapFocusToLessonType(focus: PrimaryFocus, sessionType: SessionType): LessonSpec['type'] {
        if (focus === 'repair') return 'repair';
        if (sessionType === 'micro') return 'micro';
        if (focus === 'pronunciation' || focus === 'grammar') return 'drill';
        return 'standard';
    }
}

// ==========================================
// Internal Types (not exported)
// ==========================================

interface PerformanceAnalysis {
    avgPronunciation: number;
    avgGrammar: number;
    avgFluency: number;
    repeatedErrors: string[];
    hasWeakPronunciation: boolean;
    hasWeakGrammar: boolean;
    hasRepeatedErrors: boolean;
}

type SessionType = 'micro' | 'quick' | 'standard' | 'full';
