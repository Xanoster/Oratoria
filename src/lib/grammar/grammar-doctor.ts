/**
 * ORATORIA Grammar Doctor
 * 
 * PURPOSE: Explain WHY, not just correct.
 * 
 * Uses a fixed error taxonomy:
 * - Case, Gender, Verb position, Tense, Preposition, Article, Agreement, Word order
 * 
 * For each error:
 * - Error type
 * - Corrected sentence
 * - 1-2 sentence rule-based explanation
 * - Classification: success / partial / fail
 * 
 * If multiple correct forms exist:
 * - Present the most neutral spoken form
 * - Note that alternatives are valid
 * 
 * If rule certainty is low:
 * - Say "Rule not found; requires human review"
 */

import { ErrorType, GrammarError, Outcome } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface GrammarAnalysis {
    originalText: string;
    correctedText: string;
    errors: GrammarError[];
    outcome: Outcome;
    alternativeForms?: string[];
    requiresHumanReview: boolean;
}

export interface AnalysisInput {
    expectedText: string;    // What the user was supposed to say
    actualText: string;      // What the user actually said
}

// =============================================================================
// GRAMMAR RULES DATABASE
// Rules are structured explanations for each error type
// =============================================================================

const GRAMMAR_RULES: Record<ErrorType, {
    name: string;
    description: string;
    ruleTemplate: (expected: string, actual: string) => string;
}> = {
    [ErrorType.CASE]: {
        name: 'Case Error',
        description: 'German uses four cases: Nominativ, Akkusativ, Dativ, Genitiv',
        ruleTemplate: (expected, actual) =>
            `"${actual}" should be "${expected}". The verb or preposition here requires a different case.`,
    },
    [ErrorType.GENDER]: {
        name: 'Gender Error',
        description: 'German nouns have grammatical gender: masculine (der), feminine (die), neuter (das)',
        ruleTemplate: (expected, actual) =>
            `"${actual}" should be "${expected}". This noun has a different grammatical gender.`,
    },
    [ErrorType.VERB_POSITION]: {
        name: 'Verb Position Error',
        description: 'In German main clauses, the conjugated verb must be in position 2 (V2 rule)',
        ruleTemplate: (expected, actual) =>
            `The verb should be in position 2. In German declarative sentences, the conjugated verb comes second.`,
    },
    [ErrorType.TENSE]: {
        name: 'Tense Error',
        description: 'Incorrect verb tense was used',
        ruleTemplate: (expected, actual) =>
            `"${actual}" uses the wrong tense. Use "${expected}" for this context.`,
    },
    [ErrorType.PREPOSITION]: {
        name: 'Preposition Error',
        description: 'Wrong preposition or preposition case was used',
        ruleTemplate: (expected, actual) =>
            `"${actual}" should be "${expected}". This preposition requires a specific case.`,
    },
    [ErrorType.ARTICLE]: {
        name: 'Article Error',
        description: 'Articles must match noun gender and case',
        ruleTemplate: (expected, actual) =>
            `"${actual}" should be "${expected}". Articles must agree with the noun in gender and case.`,
    },
    [ErrorType.AGREEMENT]: {
        name: 'Agreement Error',
        description: 'Adjectives and articles must agree with the noun',
        ruleTemplate: (expected, actual) =>
            `"${actual}" should be "${expected}". Modifiers must match the noun in gender, number, and case.`,
    },
    [ErrorType.WORD_ORDER]: {
        name: 'Word Order Error',
        description: 'German has specific word order rules',
        ruleTemplate: (expected, actual) =>
            `The word order is incorrect. German follows specific rules for element placement in sentences.`,
    },
};

// =============================================================================
// ARTICLE CORRECTIONS
// =============================================================================

const ARTICLE_FORMS: Record<string, { nominative: string; accusative: string; dative: string; genitive: string }> = {
    der: { nominative: 'der', accusative: 'den', dative: 'dem', genitive: 'des' },
    die: { nominative: 'die', accusative: 'die', dative: 'der', genitive: 'der' },
    das: { nominative: 'das', accusative: 'das', dative: 'dem', genitive: 'des' },
    ein: { nominative: 'ein', accusative: 'einen', dative: 'einem', genitive: 'eines' },
    eine: { nominative: 'eine', accusative: 'eine', dative: 'einer', genitive: 'einer' },
};

// =============================================================================
// CORE ANALYSIS FUNCTION
// =============================================================================

/**
 * Analyze the difference between expected and actual text
 * and identify grammar errors with explanations.
 */
export function analyzeGrammar(input: AnalysisInput): GrammarAnalysis {
    const { expectedText, actualText } = input;
    const errors: GrammarError[] = [];

    const expectedWords = tokenize(expectedText);
    const actualWords = tokenize(actualText);

    let requiresHumanReview = false;

    // Compare word by word
    const maxLen = Math.max(expectedWords.length, actualWords.length);

    for (let i = 0; i < maxLen; i++) {
        const expected = expectedWords[i] || '';
        const actual = actualWords[i] || '';

        if (expected.toLowerCase() !== actual.toLowerCase()) {
            const error = classifyError(expected, actual, i, expectedWords, actualWords);

            if (error) {
                errors.push(error);
            } else if (expected !== actual) {
                // Could not classify - mark for human review
                requiresHumanReview = true;
            }
        }
    }

    // Check for word order issues if word counts differ
    if (expectedWords.length !== actualWords.length) {
        const wordOrderError: GrammarError = {
            type: ErrorType.WORD_ORDER,
            position: 0,
            expected: expectedText,
            actual: actualText,
            explanation: GRAMMAR_RULES[ErrorType.WORD_ORDER].ruleTemplate(expectedText, actualText),
        };
        errors.push(wordOrderError);
    }

    // Determine outcome
    const outcome = determineOutcome(errors, expectedWords.length);

    return {
        originalText: actualText,
        correctedText: expectedText,
        errors,
        outcome,
        requiresHumanReview,
    };
}

/**
 * Simple analysis when we only have the user's output (no expected)
 * Used for free-form roleplay responses
 */
export function analyzeFreeform(text: string): GrammarAnalysis {
    const errors: GrammarError[] = [];
    const words = tokenize(text);

    // Check verb position (V2 rule) in declarative sentences
    const verbError = checkVerbPosition(words);
    if (verbError) errors.push(verbError);

    // Check article-noun agreement
    const articleErrors = checkArticleAgreement(words);
    errors.push(...articleErrors);

    return {
        originalText: text,
        correctedText: text, // Can't auto-correct without expected
        errors,
        outcome: errors.length === 0 ? Outcome.SUCCESS :
            errors.length <= 2 ? Outcome.PARTIAL : Outcome.FAIL,
        requiresHumanReview: true, // Always needs review for freeform
    };
}

// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================

function classifyError(
    expected: string,
    actual: string,
    position: number,
    expectedWords: string[],
    actualWords: string[]
): GrammarError | null {
    const expLower = expected.toLowerCase();
    const actLower = actual.toLowerCase();

    // Check for article errors
    const allArticles = ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines'];
    if (allArticles.includes(expLower) || allArticles.includes(actLower)) {
        return {
            type: ErrorType.ARTICLE,
            position,
            expected,
            actual,
            explanation: GRAMMAR_RULES[ErrorType.ARTICLE].ruleTemplate(expected, actual),
        };
    }

    // Check for case endings (common adjective endings)
    const caseEndings = ['en', 'em', 'er', 'es', 'e'];
    for (const ending of caseEndings) {
        if (expLower.endsWith(ending) && actLower.endsWith(ending.substring(0, 1))) {
            return {
                type: ErrorType.CASE,
                position,
                expected,
                actual,
                explanation: GRAMMAR_RULES[ErrorType.CASE].ruleTemplate(expected, actual),
            };
        }
    }

    // Check for verb forms (common conjugation differences)
    if (isVerb(expLower) || isVerb(actLower)) {
        // Check if it's a position issue or conjugation issue
        if (position === 1 && expectedWords.length > 2) {
            // V2 rule check - verb should be in position 2
        }
        return {
            type: ErrorType.TENSE,
            position,
            expected,
            actual,
            explanation: GRAMMAR_RULES[ErrorType.TENSE].ruleTemplate(expected, actual),
        };
    }

    // Check for preposition errors
    const prepositions = ['in', 'an', 'auf', 'für', 'mit', 'bei', 'nach', 'zu', 'von', 'aus', 'über', 'unter', 'vor', 'hinter', 'neben', 'zwischen'];
    if (prepositions.includes(expLower) || prepositions.includes(actLower)) {
        return {
            type: ErrorType.PREPOSITION,
            position,
            expected,
            actual,
            explanation: GRAMMAR_RULES[ErrorType.PREPOSITION].ruleTemplate(expected, actual),
        };
    }

    // Generic word mismatch - could be gender or agreement
    if (expected.length > 2 && actual.length > 2) {
        // Check if stems are similar (possible agreement error)
        if (haveSimilarStems(expLower, actLower)) {
            return {
                type: ErrorType.AGREEMENT,
                position,
                expected,
                actual,
                explanation: GRAMMAR_RULES[ErrorType.AGREEMENT].ruleTemplate(expected, actual),
            };
        }
    }

    return null;
}

// =============================================================================
// SPECIFIC GRAMMAR CHECKS
// =============================================================================

function checkVerbPosition(words: string[]): GrammarError | null {
    if (words.length < 3) return null;

    // In a German declarative sentence, the verb should be in position 2 (index 1)
    // This is a heuristic check
    let verbPosition = -1;

    for (let i = 0; i < words.length; i++) {
        if (isVerb(words[i].toLowerCase())) {
            verbPosition = i;
            break;
        }
    }

    if (verbPosition !== -1 && verbPosition !== 1) {
        return {
            type: ErrorType.VERB_POSITION,
            position: verbPosition,
            expected: 'Verb in position 2',
            actual: `Verb in position ${verbPosition + 1}`,
            explanation: GRAMMAR_RULES[ErrorType.VERB_POSITION].ruleTemplate('', ''),
        };
    }

    return null;
}

function checkArticleAgreement(words: string[]): GrammarError[] {
    const errors: GrammarError[] = [];

    // Simple check: article followed by adjective + noun
    // This is a heuristic and may need refinement

    for (let i = 0; i < words.length - 1; i++) {
        const word = words[i].toLowerCase();
        const articles = Object.keys(ARTICLE_FORMS);

        if (articles.includes(word)) {
            // Check if following word might have wrong ending
            const nextWord = words[i + 1];
            if (nextWord && isLikelyAdjective(nextWord)) {
                // TODO: Enhanced agreement checking with noun gender lookup
                // For now, just flag potential issues
            }
        }
    }

    return errors;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function tokenize(text: string): string[] {
    return text
        .replace(/[.,!?;:]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);
}

function determineOutcome(errors: GrammarError[], totalWords: number): Outcome {
    if (errors.length === 0) return Outcome.SUCCESS;

    const errorRate = errors.length / totalWords;

    if (errorRate <= 0.2) return Outcome.PARTIAL;  // <= 20% errors
    return Outcome.FAIL;
}

const COMMON_VERBS = new Set([
    'bin', 'bist', 'ist', 'sind', 'seid',
    'habe', 'hast', 'hat', 'haben', 'habt',
    'werde', 'wirst', 'wird', 'werden', 'werdet',
    'kann', 'kannst', 'können', 'könnt',
    'muss', 'musst', 'müssen', 'müsst',
    'will', 'willst', 'wollen', 'wollt',
    'gehe', 'gehst', 'geht', 'gehen',
    'komme', 'kommst', 'kommt', 'kommen',
    'mache', 'machst', 'macht', 'machen',
    'sage', 'sagst', 'sagt', 'sagen',
    'spreche', 'sprichst', 'spricht', 'sprechen',
    'lerne', 'lernst', 'lernt', 'lernen',
    'verstehe', 'verstehst', 'versteht', 'verstehen',
    'möchte', 'möchtest', 'möchten', 'möchtet',
]);

function isVerb(word: string): boolean {
    const clean = word.replace(/[.,!?;:]/g, '').toLowerCase();
    if (COMMON_VERBS.has(clean)) return true;

    // Heuristic: verbs often end in -en, -st, -t
    if (clean.endsWith('en') || clean.endsWith('st') || clean.endsWith('et')) {
        return true;
    }

    return false;
}

function isLikelyAdjective(word: string): boolean {
    const lower = word.toLowerCase();
    const endings = ['e', 'en', 'em', 'er', 'es'];

    return word.length > 4 && endings.some(e => lower.endsWith(e));
}

function haveSimilarStems(word1: string, word2: string): boolean {
    // Check if two words share a common stem (first 3+ characters)
    const minLen = Math.min(word1.length, word2.length);
    if (minLen < 4) return false;

    const stemLen = Math.floor(minLen * 0.6);
    return word1.substring(0, stemLen) === word2.substring(0, stemLen);
}

// =============================================================================
// FORMAT OUTPUT FOR UI
// =============================================================================

export function formatErrorForDisplay(error: GrammarError): string {
    const rule = GRAMMAR_RULES[error.type];
    return `**${rule.name}**: ${error.explanation}`;
}

export function formatAnalysisForDisplay(analysis: GrammarAnalysis): {
    summary: string;
    details: string[];
    outcome: Outcome;
} {
    if (analysis.errors.length === 0) {
        return {
            summary: 'Perfekt! No errors detected.',
            details: [],
            outcome: Outcome.SUCCESS,
        };
    }

    const details = analysis.errors.map(formatErrorForDisplay);

    let summary: string;
    if (analysis.outcome === Outcome.PARTIAL) {
        summary = `Almost there! ${analysis.errors.length} small ${analysis.errors.length === 1 ? 'issue' : 'issues'} to fix.`;
    } else {
        summary = `${analysis.errors.length} errors found. Let's review the rules.`;
    }

    if (analysis.requiresHumanReview) {
        summary += ' (Some corrections may need human review)';
    }

    return {
        summary,
        details,
        outcome: analysis.outcome,
    };
}
