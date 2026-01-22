/**
 * ORATORIA SRS Engine
 * 
 * SM-2 variant algorithm for sentence-based spaced repetition.
 * 
 * SCORING PRINCIPLES (from constitution):
 * - Recall scores: 0 (fail), 0.5 (partial), 1 (correct)
 * - Spoken output weighted 1.2x higher than typed
 * - Partial credit reduces stability
 * - Fail resets per algorithm rules
 * - SRSState must be persisted but recomputable from ReviewHistory
 * 
 * THRESHOLDS: Initial values are heuristic and marked for calibration.
 */

import { OutputType, Outcome, ClozeTarget, ClozeTargetType } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface SRSState {
    easeFactor: number;
    interval: number;
    repetitions: number;
    stability: number;
    difficulty: number;
    nextReview: Date;
    lastReview: Date | null;
}

export interface ReviewInput {
    quality: 0 | 0.5 | 1;
    outputType: OutputType;
}

// =============================================================================
// CONSTANTS (HEURISTIC - CALIBRATE LATER)
// =============================================================================

/** Minimum ease factor to prevent interval collapse */
const MIN_EASE_FACTOR = 1.3;

/** Default ease factor for new items */
const DEFAULT_EASE_FACTOR = 2.5;

/** Spoken output weight multiplier */
const SPOKEN_WEIGHT = 1.2;

/** Ease factor adjustment on partial recall */
const PARTIAL_EASE_PENALTY = 0.15;

/** Ease factor boost on correct recall */
const CORRECT_EASE_BONUS = 0.1;

/** Interval multiplier for partial success */
const PARTIAL_INTERVAL_MULTIPLIER = 1.2;

// =============================================================================
// CORE SRS FUNCTIONS
// =============================================================================

/**
 * Create initial SRS state for a new sentence
 */
export function createInitialSRSState(): SRSState {
    return {
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 1,
        repetitions: 0,
        stability: 1.0,
        difficulty: 0.3,
        nextReview: new Date(),
        lastReview: null,
    };
}

/**
 * Calculate the next SRS state after a review
 * 
 * @param currentState - Current SRS state
 * @param input - Review quality and output type
 * @returns Updated SRS state
 */
export function calculateNextReview(
    currentState: SRSState,
    input: ReviewInput
): SRSState {
    const { quality, outputType } = input;
    const now = new Date();

    // Apply spoken output weight bonus
    const effectiveQuality = outputType === OutputType.SPOKEN
        ? Math.min(1, quality * SPOKEN_WEIGHT)
        : quality;

    // FAIL: Reset to beginning
    if (quality < 0.5) {
        return {
            ...currentState,
            repetitions: 0,
            interval: 1,
            stability: Math.max(0.1, currentState.stability * 0.5), // Halve stability
            nextReview: addDays(now, 1),
            lastReview: now,
        };
    }

    // PARTIAL: Reduce stability, modest interval increase
    if (quality === 0.5) {
        const newEaseFactor = Math.max(
            MIN_EASE_FACTOR,
            currentState.easeFactor - PARTIAL_EASE_PENALTY
        );
        const newInterval = Math.ceil(currentState.interval * PARTIAL_INTERVAL_MULTIPLIER);
        const newStability = Math.max(0.5, currentState.stability * 0.8);

        return {
            ...currentState,
            easeFactor: newEaseFactor,
            interval: newInterval,
            repetitions: currentState.repetitions, // Don't increment on partial
            stability: newStability,
            nextReview: addDays(now, newInterval),
            lastReview: now,
        };
    }

    // CORRECT (quality === 1): Standard SM-2 progression with spoken bonus
    let newInterval: number;

    if (currentState.repetitions === 0) {
        newInterval = 1;
    } else if (currentState.repetitions === 1) {
        newInterval = 6;
    } else {
        // Apply spoken weight to interval calculation
        const intervalMultiplier = outputType === OutputType.SPOKEN
            ? currentState.easeFactor * SPOKEN_WEIGHT
            : currentState.easeFactor;
        newInterval = Math.ceil(currentState.interval * intervalMultiplier);
    }

    const newEaseFactor = Math.min(
        3.0, // Cap ease factor
        currentState.easeFactor + CORRECT_EASE_BONUS * effectiveQuality
    );

    const newStability = Math.min(
        10.0, // Cap stability
        currentState.stability * 1.2
    );

    return {
        ...currentState,
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: currentState.repetitions + 1,
        stability: newStability,
        difficulty: Math.max(0.1, currentState.difficulty * 0.95), // Slightly decrease difficulty
        nextReview: addDays(now, newInterval),
        lastReview: now,
    };
}

/**
 * Check if a sentence is due for review
 */
export function isReviewDue(state: SRSState, now: Date = new Date()): boolean {
    return state.nextReview <= now;
}

/**
 * Get sentences due for review, sorted by urgency
 */
export function sortByReviewUrgency(
    states: Array<{ id: string; srsState: SRSState }>
): Array<{ id: string; srsState: SRSState }> {
    const now = new Date();

    return [...states]
        .filter(s => isReviewDue(s.srsState, now))
        .sort((a, b) => {
            // Sort by how overdue the item is (most overdue first)
            const overdueA = now.getTime() - a.srsState.nextReview.getTime();
            const overdueB = now.getTime() - b.srsState.nextReview.getTime();
            return overdueB - overdueA;
        });
}

/**
 * Convert quality score (0, 0.5, 1) to outcome
 */
export function qualityToOutcome(quality: 0 | 0.5 | 1): Outcome {
    if (quality === 0) return Outcome.FAIL;
    if (quality === 0.5) return Outcome.PARTIAL;
    return Outcome.SUCCESS;
}

/**
 * Convert outcome to quality score
 */
export function outcomeToQuality(outcome: Outcome): 0 | 0.5 | 1 {
    switch (outcome) {
        case Outcome.FAIL: return 0;
        case Outcome.PARTIAL: return 0.5;
        case Outcome.SUCCESS: return 1;
    }
}

// =============================================================================
// CLOZE TARGET GENERATION
// =============================================================================

/**
 * Generate cloze targets for a German sentence
 * 
 * Targets (from constitution):
 * - Articles (der / die / das)
 * - Verb position
 * - Case endings
 */
export function generateClozeTargets(germanText: string): ClozeTarget[] {
    const targets: ClozeTarget[] = [];
    const words = germanText.split(/\s+/);

    let charIndex = 0;

    words.forEach((word, wordIndex) => {
        const lowerWord = word.toLowerCase().replace(/[.,!?;:]/g, '');

        // Articles
        if (['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines'].includes(lowerWord)) {
            targets.push({
                type: ClozeTargetType.ARTICLE,
                startIdx: charIndex,
                endIdx: charIndex + word.length,
                correctAnswer: word,
            });
        }

        // Case endings (adjective endings, noun endings)
        if (wordIndex > 0 && isLikelyAdjective(lowerWord)) {
            const ending = extractEnding(lowerWord);
            if (ending) {
                targets.push({
                    type: ClozeTargetType.CASE_ENDING,
                    startIdx: charIndex + word.length - ending.length,
                    endIdx: charIndex + word.length,
                    correctAnswer: ending,
                });
            }
        }

        charIndex += word.length + 1; // +1 for space
    });

    // Verb position detection (V2 rule - verb should be in position 2)
    const verbPosition = findMainVerbPosition(words);
    if (verbPosition !== -1 && words.length > 2) {
        let targetCharIndex = 0;
        for (let i = 0; i < verbPosition; i++) {
            targetCharIndex += words[i].length + 1;
        }
        targets.push({
            type: ClozeTargetType.VERB_POSITION,
            startIdx: targetCharIndex,
            endIdx: targetCharIndex + words[verbPosition].length,
            correctAnswer: words[verbPosition],
        });
    }

    return targets;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Common adjective endings in German
 */
const ADJECTIVE_ENDINGS = ['e', 'en', 'em', 'er', 'es'];

function isLikelyAdjective(word: string): boolean {
    // Very basic heuristic - words ending with common adjective endings
    // that are longer than 4 characters
    if (word.length < 4) return false;
    return ADJECTIVE_ENDINGS.some(ending => word.endsWith(ending));
}

function extractEnding(word: string): string | null {
    // Extract the grammatical ending
    for (const ending of ['en', 'em', 'er', 'es', 'e']) {
        if (word.endsWith(ending) && word.length > ending.length + 2) {
            return ending;
        }
    }
    return null;
}

/**
 * Common German verbs for position detection
 */
const COMMON_VERBS = [
    'bin', 'bist', 'ist', 'sind', 'seid',
    'habe', 'hast', 'hat', 'haben', 'habt',
    'werde', 'wirst', 'wird', 'werden', 'werdet',
    'kann', 'kannst', 'können', 'könnt',
    'muss', 'musst', 'müssen', 'müsst',
    'will', 'willst', 'wollen', 'wollt',
    'soll', 'sollst', 'sollen', 'sollt',
    'darf', 'darfst', 'dürfen', 'dürft',
    'mag', 'magst', 'mögen', 'mögt',
    'gehe', 'gehst', 'geht', 'gehen',
    'komme', 'kommst', 'kommt', 'kommen',
    'mache', 'machst', 'macht', 'machen',
    'sage', 'sagst', 'sagt', 'sagen',
    'gebe', 'gibst', 'gibt', 'geben',
    'nehme', 'nimmst', 'nimmt', 'nehmen',
    'sehe', 'siehst', 'sieht', 'sehen',
    'weiß', 'weißt', 'wissen', 'wisst',
    'lese', 'liest', 'lesen', 'lest',
    'esse', 'isst', 'essen', 'esst',
    'trinke', 'trinkst', 'trinkt', 'trinken',
    'schlafe', 'schläfst', 'schläft', 'schlafen',
    'fahre', 'fährst', 'fährt', 'fahren',
    'laufe', 'läufst', 'läuft', 'laufen',
    'finde', 'findest', 'findet', 'finden',
    'brauche', 'brauchst', 'braucht', 'brauchen',
    'kaufe', 'kaufst', 'kauft', 'kaufen',
    'arbeite', 'arbeitest', 'arbeitet', 'arbeiten',
    'wohne', 'wohnst', 'wohnt', 'wohnen',
    'spreche', 'sprichst', 'spricht', 'sprechen',
    'verstehe', 'verstehst', 'versteht', 'verstehen',
    'lerne', 'lernst', 'lernt', 'lernen',
    'höre', 'hörst', 'hört', 'hören',
    'spiele', 'spielst', 'spielt', 'spielen',
    'liebe', 'liebst', 'liebt', 'lieben',
    'möchte', 'möchtest', 'möchten', 'möchtet',
];

function findMainVerbPosition(words: string[]): number {
    for (let i = 0; i < words.length; i++) {
        const cleanWord = words[i].toLowerCase().replace(/[.,!?;:]/g, '');
        if (COMMON_VERBS.includes(cleanWord)) {
            return i;
        }
        // Also check for verbs ending in common patterns
        if (cleanWord.endsWith('en') || cleanWord.endsWith('st') || cleanWord.endsWith('t')) {
            // Basic verb detection heuristic
            if (i === 1 || (i === words.length - 1 && words.length > 2)) {
                return i;
            }
        }
    }
    return -1;
}

// =============================================================================
// RECOMPUTATION (for data integrity verification)
// =============================================================================

export interface ReviewHistoryEntry {
    quality: 0 | 0.5 | 1;
    outputType: OutputType;
    reviewedAt: Date;
}

/**
 * Recompute SRS state from review history
 * Used for data integrity verification
 */
export function recomputeStateFromHistory(
    history: ReviewHistoryEntry[]
): SRSState {
    let state = createInitialSRSState();

    // Sort by date
    const sorted = [...history].sort(
        (a, b) => a.reviewedAt.getTime() - b.reviewedAt.getTime()
    );

    for (const entry of sorted) {
        state = calculateNextReview(state, {
            quality: entry.quality,
            outputType: entry.outputType,
        });
    }

    return state;
}
