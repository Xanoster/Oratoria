/**
 * CEFR Level Definitions for German Language
 * 
 * This file contains vocabulary complexity rules, grammar structures,
 * and sentence limits for each CEFR level (A0-B2).
 */

export type CEFRLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2';

export interface LevelDefinition {
    level: CEFRLevel;
    maxWordLength: number;
    maxSentenceWords: number;
    allowedGrammarStructures: string[];
    description: string;
}

/**
 * CEFR Level Definitions with complexity rules
 */
export const CEFR_LEVELS: Record<CEFRLevel, LevelDefinition> = {
    A0: {
        level: 'A0',
        maxWordLength: 8,
        maxSentenceWords: 5,
        allowedGrammarStructures: [
            'simple_present_sein',
            'simple_present_haben',
            'basic_nouns',
            'basic_adjectives',
        ],
        description: 'Absolute beginner - basic greetings and simple phrases',
    },
    A1: {
        level: 'A1',
        maxWordLength: 10,
        maxSentenceWords: 8,
        allowedGrammarStructures: [
            'simple_present_sein',
            'simple_present_haben',
            'present_tense_regular',
            'definite_articles',
            'indefinite_articles',
            'basic_negation',
            'basic_questions',
        ],
        description: 'Elementary - can understand and use familiar everyday expressions',
    },
    A2: {
        level: 'A2',
        maxWordLength: 12,
        maxSentenceWords: 12,
        allowedGrammarStructures: [
            'simple_present_sein',
            'simple_present_haben',
            'present_tense_regular',
            'present_tense_irregular',
            'perfect_tense',
            'modal_verbs',
            'dative_case',
            'accusative_case',
            'separable_verbs',
            'coordinating_conjunctions',
        ],
        description: 'Pre-intermediate - can communicate in simple routine tasks',
    },
    B1: {
        level: 'B1',
        maxWordLength: 15,
        maxSentenceWords: 18,
        allowedGrammarStructures: [
            'simple_present_sein',
            'simple_present_haben',
            'present_tense_regular',
            'present_tense_irregular',
            'perfect_tense',
            'preterite_tense',
            'modal_verbs',
            'dative_case',
            'accusative_case',
            'genitive_case',
            'separable_verbs',
            'coordinating_conjunctions',
            'subordinating_conjunctions',
            'relative_clauses',
            'passive_voice',
            'reflexive_verbs',
        ],
        description: 'Intermediate - can deal with most situations while traveling',
    },
    B2: {
        level: 'B2',
        maxWordLength: 0, // No limit
        maxSentenceWords: 25,
        allowedGrammarStructures: [
            'all', // All structures allowed
        ],
        description: 'Upper-intermediate - can interact with fluency and spontaneity',
    },
};

/**
 * Level hierarchy for comparison
 */
export const LEVEL_ORDER: CEFRLevel[] = ['A0', 'A1', 'A2', 'B1', 'B2'];

/**
 * Get numeric index of a level for comparison
 */
export function getLevelIndex(level: CEFRLevel): number {
    return LEVEL_ORDER.indexOf(level);
}

/**
 * Check if level1 is higher than level2
 */
export function isLevelHigher(level1: CEFRLevel, level2: CEFRLevel): boolean {
    return getLevelIndex(level1) > getLevelIndex(level2);
}

/**
 * Get the next level (for +1 preview)
 */
export function getNextLevel(level: CEFRLevel): CEFRLevel | null {
    const index = getLevelIndex(level);
    if (index < LEVEL_ORDER.length - 1) {
        return LEVEL_ORDER[index + 1];
    }
    return null;
}

/**
 * Core vocabulary per CEFR level
 * Words in each level are appropriate for that level and below
 */
export const CORE_VOCABULARY: Record<CEFRLevel, string[]> = {
    A0: [
        // Greetings
        'hallo', 'tschüss', 'guten', 'tag', 'morgen', 'abend', 'nacht',
        'danke', 'bitte', 'ja', 'nein',
        // Pronouns
        'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr',
        // Numbers 1-10
        'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
        // Basic verbs
        'bin', 'bist', 'ist', 'sind', 'seid', 'habe', 'hast', 'hat', 'haben', 'habt',
        // Colors
        'rot', 'blau', 'grün', 'gelb', 'schwarz', 'weiß',
        // Family
        'mama', 'papa', 'kind', 'name',
        // Common words
        'und', 'oder', 'auch', 'nicht', 'gut', 'schlecht',
    ],
    A1: [
        // Add to A0 vocabulary
        'gehe', 'gehst', 'geht', 'gehen', 'komme', 'kommst', 'kommt', 'kommen',
        'mache', 'machst', 'macht', 'machen', 'sage', 'sagst', 'sagt', 'sagen',
        'wohne', 'wohnst', 'wohnt', 'wohnen', 'arbeite', 'arbeitest', 'arbeitet',
        // Time
        'heute', 'morgen', 'gestern', 'jetzt', 'immer', 'manchmal', 'nie',
        'uhr', 'zeit', 'tag', 'woche', 'monat', 'jahr',
        // Places
        'haus', 'schule', 'arbeit', 'stadt', 'straße', 'laden', 'geschäft',
        // Food
        'essen', 'trinken', 'wasser', 'brot', 'kaffee', 'tee', 'milch',
        // Articles
        'der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'einer',
        // Questions
        'was', 'wer', 'wo', 'wann', 'wie', 'warum', 'welche', 'welcher',
        // Prepositions
        'in', 'auf', 'an', 'bei', 'mit', 'zu', 'von', 'für',
    ],
    A2: [
        // Past tense helpers
        'hatte', 'hattest', 'hatten', 'hattet', 'war', 'warst', 'waren', 'wart',
        'gewesen', 'gehabt', 'gemacht', 'gegangen', 'gekommen', 'gesagt', 'gesehen',
        // Modal verbs
        'kann', 'kannst', 'können', 'könnt', 'muss', 'musst', 'müssen', 'müsst',
        'will', 'willst', 'wollen', 'wollt', 'soll', 'sollst', 'sollen', 'sollt',
        'darf', 'darfst', 'dürfen', 'dürft', 'möchte', 'möchtest', 'möchten',
        // Travel & directions
        'flughafen', 'bahnhof', 'haltestelle', 'links', 'rechts', 'geradeaus',
        'fahren', 'fliegen', 'reisen', 'ankommen', 'abfahren',
        // Extended vocabulary
        'vielleicht', 'wahrscheinlich', 'eigentlich', 'natürlich', 'leider',
        'trotzdem', 'deshalb', 'außerdem', 'sondern', 'obwohl',
    ],
    B1: [
        // Subordinate clause markers
        'dass', 'weil', 'wenn', 'ob', 'obwohl', 'während', 'nachdem', 'bevor',
        'damit', 'sodass', 'falls', 'sobald', 'seit', 'bis',
        // Abstract concepts
        'meinung', 'ansicht', 'erfahrung', 'möglichkeit', 'gelegenheit',
        'bedeutung', 'unterschied', 'zusammenhang', 'entwicklung', 'veränderung',
        // Opinions
        'glaube', 'denke', 'meine', 'finde', 'halte', 'stimme',
        'zustimmen', 'ablehnen', 'bezweifeln', 'vermuten',
        // Passive voice
        'wurde', 'wurden', 'worden', 'geworden',
        // Reflexive
        'mich', 'dich', 'sich', 'uns', 'euch',
        'freue', 'interessiere', 'erinnere', 'befinde',
    ],
    B2: [
        // Subjunctive II
        'wäre', 'wärst', 'wären', 'wärt', 'hätte', 'hättest', 'hätten', 'hättet',
        'würde', 'würdest', 'würden', 'würdet', 'könnte', 'müsste', 'sollte',
        // Academic/formal
        'hinsichtlich', 'bezüglich', 'angesichts', 'infolge', 'aufgrund',
        'dementsprechend', 'demzufolge', 'infolgedessen', 'nichtsdestotrotz',
        // Complex structures
        'derjenige', 'diejenige', 'dasjenige', 'derselbe', 'dieselbe', 'dasselbe',
        // Idioms markers (these appear in idiomatic expressions)
        'gewissermaßen', 'sozusagen', 'gleichsam', 'insofern', 'insoweit',
    ],
};

/**
 * Grammar patterns with their required CEFR level
 */
export const GRAMMAR_PATTERNS: Array<{ pattern: RegExp; level: CEFRLevel; name: string }> = [
    // Subjunctive II - B2
    { pattern: /\b(wäre|hätte|würde|könnte|müsste|sollte)\b/i, level: 'B2', name: 'subjunctive_ii' },

    // Passive voice - B1
    { pattern: /\b(wurde|wurden|worden|geworden)\b/i, level: 'B1', name: 'passive_voice' },

    // Subordinate clauses - B1
    { pattern: /\b(dass|weil|obwohl|während|nachdem|bevor|damit|sobald)\b/i, level: 'B1', name: 'subordinating_conjunctions' },

    // Relative clauses - B1
    { pattern: /\b(welcher|welche|welches|welchen|welchem)\b.*\bist\b/i, level: 'B1', name: 'relative_clauses' },

    // Modal verbs - A2
    { pattern: /\b(kann|muss|will|soll|darf|möchte)\b/i, level: 'A2', name: 'modal_verbs' },

    // Perfect tense - A2
    { pattern: /\b(habe|hast|hat|haben|habt)\b.*\b(ge\w+t|ge\w+en)\b/i, level: 'A2', name: 'perfect_tense' },

    // Preterite - B1
    { pattern: /\b(machte|ging|kam|sah|gab|nahm|fand|stand|sprach|traf)\b/i, level: 'B1', name: 'preterite_tense' },
];

/**
 * Get all vocabulary up to and including a given level
 */
export function getVocabularyForLevel(level: CEFRLevel): Set<string> {
    const vocab = new Set<string>();
    const levelIndex = getLevelIndex(level);

    for (let i = 0; i <= levelIndex; i++) {
        const currentLevel = LEVEL_ORDER[i];
        CORE_VOCABULARY[currentLevel].forEach(word => vocab.add(word.toLowerCase()));
    }

    return vocab;
}

/**
 * Detect the minimum CEFR level required for a word
 */
export function detectWordLevel(word: string): CEFRLevel {
    const normalizedWord = word.toLowerCase();

    for (const level of LEVEL_ORDER) {
        if (CORE_VOCABULARY[level].includes(normalizedWord)) {
            return level;
        }
    }

    // Check by word length as fallback
    const wordLength = word.length;
    if (wordLength <= 8) return 'A1';
    if (wordLength <= 12) return 'A2';
    if (wordLength <= 15) return 'B1';
    return 'B2';
}

/**
 * Detect grammar structures in a sentence and return required level
 */
export function detectGrammarLevel(sentence: string): { level: CEFRLevel; structures: string[] } {
    const detectedStructures: string[] = [];
    let highestLevel: CEFRLevel = 'A0';

    for (const { pattern, level, name } of GRAMMAR_PATTERNS) {
        if (pattern.test(sentence)) {
            detectedStructures.push(name);
            if (isLevelHigher(level, highestLevel)) {
                highestLevel = level;
            }
        }
    }

    return { level: highestLevel, structures: detectedStructures };
}
