// ORATORIA Type Definitions
// These types mirror the Prisma schema but are used in application code

// =============================================================================
// ERROR TYPE TAXONOMY (Fixed per constitution)
// =============================================================================
export enum ErrorType {
  CASE = 'CASE',
  GENDER = 'GENDER',
  VERB_POSITION = 'VERB_POSITION',
  TENSE = 'TENSE',
  PREPOSITION = 'PREPOSITION',
  ARTICLE = 'ARTICLE',
  AGREEMENT = 'AGREEMENT',
  WORD_ORDER = 'WORD_ORDER',
}

// =============================================================================
// CEFR LEVELS
// =============================================================================
export enum CEFRLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

// =============================================================================
// OUTPUT TYPES
// =============================================================================
export enum OutputType {
  SPOKEN = 'spoken',
  TYPED = 'typed',
}

// =============================================================================
// OUTCOME CLASSIFICATION
// =============================================================================
export enum Outcome {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAIL = 'fail',
}

// =============================================================================
// CLOZE TARGET TYPES
// =============================================================================
export enum ClozeTargetType {
  ARTICLE = 'ARTICLE',           // der / die / das
  VERB_POSITION = 'VERB_POSITION', // V2 rule, etc.
  CASE_ENDING = 'CASE_ENDING',   // declension endings
}

export interface ClozeTarget {
  type: ClozeTargetType;
  startIdx: number;
  endIdx: number;
  correctAnswer: string;
}

// =============================================================================
// GRAMMAR ERROR (from Grammar Doctor)
// =============================================================================
export interface GrammarError {
  type: ErrorType;
  position: number;          // Word index in sentence
  expected: string;          // Correct form
  actual: string;            // What user said
  explanation: string;       // 1-2 sentence rule explanation
}

// =============================================================================
// SRS TYPES
// =============================================================================
export interface SRSStateData {
  easeFactor: number;        // Minimum 1.3, default 2.5
  interval: number;          // Days
  repetitions: number;       // Successful reps in a row
  stability: number;         // FSRS memory stability
  difficulty: number;        // Item difficulty 0-1
  nextReview: Date;
  lastReview: Date | null;
}

export interface ReviewResult {
  quality: 0 | 0.5 | 1;      // fail | partial | correct
  outputType: OutputType;
}

// =============================================================================
// UNLOCK CRITERIA (ability-based, never lesson count)
// =============================================================================
export interface UnlockCriteria {
  speakingDurationMin: number;  // Minimum speaking seconds
  errorRecoveryRate: number;    // 0-1, % of errors corrected
  srsRetention: number;         // 0-1, % of reviews successful
}

// =============================================================================
// NARRATIVE NODE STRUCTURE
// =============================================================================
export interface NarrativeNodeData {
  setting: string;
  goal: string;
  obstacle: string;
  linguisticObjective: string;
  unlockCriteria: UnlockCriteria;
}

// =============================================================================
// SESSION STATE (enforces learning loop completion)
// =============================================================================
export interface SessionState {
  sentenceId: string;
  
  // Learning loop requirements (ALL must be true to complete)
  hasRecallAttempt: boolean;
  hasOutput: boolean;
  hasFeedback: boolean;
  hasSRSUpdate: boolean;
  
  // Session is complete ONLY when all conditions are met
  isComplete: boolean;
}

// =============================================================================
// PRONUNCIATION FEEDBACK
// =============================================================================
export interface PronunciationFeedback {
  expectedText: string;
  transcribedText: string;
  mismatchedWords: {
    word: string;
    position: number;
    phoneticHint: string;      // Simplified, no heavy IPA
    correctiveAction: string;  // One concrete action
  }[];
  overallConfidence: number;
}

// =============================================================================
// LESSON COMPLETION CHECK
// Session may be marked COMPLETE only if:
// - A recall attempt exists
// - Output exists (speech or typed)
// - Feedback has been shown
// - SRS state has been updated and persisted
// =============================================================================
export function isSessionComplete(state: SessionState): boolean {
  return (
    state.hasRecallAttempt &&
    state.hasOutput &&
    state.hasFeedback &&
    state.hasSRSUpdate
  );
}

// =============================================================================
// METRICS (Only these per constitution)
// =============================================================================
export interface UserMetrics {
  speechSecondsPerDay: number;
  srsRetentionRate: number;
  errorRecoveryRate: number;
  roleplayTurnCount: number;
  outputFrequency: number;
}
