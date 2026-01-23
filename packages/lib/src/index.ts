// Shared types for Oratoria

// User types
export interface User {
    id: string;
    email: string;
    name?: string;
    prefs: UserPrefs;
    createdAt: Date;
    lastLogin?: Date;
}

export interface UserPrefs {
    correctionDepth: 'minimal' | 'standard' | 'full';
    correctionTiming: 'immediate' | 'summary';
    timeCommitment: number;
    currentLevel?: string;
}

// Auth types
export interface AuthResponse {
    userId: string;
    email: string;
}

export interface MagicLinkResponse {
    message: string;
}

// Lesson types
export interface Lesson {
    id: string;
    level: string;
    title: string;
    content: LessonContent;
    createdBy?: string;
    createdAt: Date;
}

export interface LessonContent {
    dialogue: DialogueLine[];
    pronunciationDrill: PronunciationDrill[];
    grammarNote: GrammarNote;
    quiz: QuizItem[];
}

export interface DialogueLine {
    speaker: string;
    text: string;
    translation: string;
}

export interface PronunciationDrill {
    word: string;
    phonetic: string;
    tip: string;
}

export interface GrammarNote {
    rule: string;
    examples: string[];
}

export interface QuizItem {
    type: 'cloze' | 'mcq' | 'short';
    question: string;
    answer: string;
    options?: string[];
}

// SRS types
export interface SrsItem {
    id: string;
    userId: string;
    itemType: 'vocab' | 'grammar_pattern' | 'sentence';
    content: SrsItemContent;
    dueAt: Date;
    easeFactor: number;
    intervalDays: number;
    reviewCount: number;
}

export interface SrsItemContent {
    question: string;
    answer: string;
    context?: string;
}

export type Judgment = 'again' | 'hard' | 'good';

// Analysis types
export interface Analysis {
    id: string;
    recordingId: string;
    pronunciationScore: number;
    phonemeScores: PhonemeScore[];
    grammarIssues: GrammarIssue[];
    llmConfidence: number;
}

export interface PhonemeScore {
    phoneme: string;
    score: number;
    word?: string;
}

export interface GrammarIssue {
    ruleId: string;
    explanation: string;
    suggestion: string;
}

// Placement types
export interface PlacementResult {
    level: 'A0' | 'A1' | 'A2' | 'B1' | 'B2';
    confidence: number;
    reasons: string[];
}

// Progress types
export interface Progress {
    level: string;
    speaking: {
        averagePronunciationScore: number | null;
        sessionsCompleted: number;
    };
    grammar: {
        itemsLearned: number;
    };
    vocabulary: {
        itemsLearned: number;
    };
}

// API Error
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string>;
}
