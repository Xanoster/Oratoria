'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import OutputCapture from './OutputCapture';
import GrammarDoctor from './GrammarDoctor';

interface SRSItem {
    id: string;
    sentenceId: string;
    sentence: {
        id: string;
        germanText: string;
        englishText: string;
        clozeTargets: string;
        cefrLevel: string;
    };
}

interface GrammarError {
    type: string;
    expected: string;
    actual: string;
    explanation: string;
}

interface LearningSessionProps {
    items: SRSItem[];
    onComplete: () => void;
    onItemComplete: (itemId: string, quality: number, outputType: string) => void;
}

export default function LearningSession({
    items,
    onComplete,
    onItemComplete
}: LearningSessionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [showGrammarDoctor, setShowGrammarDoctor] = useState(false);
    const [errors, setErrors] = useState<GrammarError[]>([]);
    const [retryValue, setRetryValue] = useState('');
    const [hasRetried, setHasRetried] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [outputType, setOutputType] = useState<'typed' | 'spoken'>('typed');

    const currentItem = items[currentIndex];
    const progress = ((currentIndex) / items.length) * 100;

    // Normalize text for comparison
    const normalizeText = (text: string): string => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[.,!?]/g, '')
            .replace(/\s+/g, ' ');
    };

    const checkAnswer = async (): Promise<{ isCorrect: boolean; errors: GrammarError[] }> => {
        const normalized = normalizeText(userInput);
        const expected = normalizeText(currentItem.sentence.germanText);

        // Simple exact match check first
        if (normalized === expected) {
            return { isCorrect: true, errors: [] };
        }

        // Generate error analysis
        const errors: GrammarError[] = [];

        // Split into words for comparison
        const userWords = normalized.split(' ');
        const expectedWords = expected.split(' ');

        // Check for word order issues (V2 rule)
        if (userWords.length >= 2 && expectedWords.length >= 2) {
            if (userWords[1] !== expectedWords[1]) {
                errors.push({
                    type: 'VERB_POSITION',
                    expected: expectedWords[1],
                    actual: userWords[1] || '',
                    explanation: 'In German main clauses, the verb must be in the second position (V2 rule).'
                });
            }
        }

        // Check for article errors
        const articles = ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer'];
        userWords.forEach((word, i) => {
            if (articles.includes(word) && expectedWords[i] && articles.includes(expectedWords[i]) && word !== expectedWords[i]) {
                errors.push({
                    type: 'ARTICLE',
                    expected: expectedWords[i],
                    actual: word,
                    explanation: 'Check the gender and case of the noun to determine the correct article.'
                });
            }
        });

        // Check for case errors (common endings)
        const caseEndings = ['en', 'em', 'er', 'es'];
        userWords.forEach((word, i) => {
            if (expectedWords[i] && word !== expectedWords[i]) {
                const wordEnding = word.slice(-2);
                const expectedEnding = expectedWords[i].slice(-2);
                if (caseEndings.includes(wordEnding) && caseEndings.includes(expectedEnding)) {
                    errors.push({
                        type: 'CASE',
                        expected: expectedWords[i],
                        actual: word,
                        explanation: 'The noun/adjective ending indicates the grammatical case (Nominative, Accusative, Dative, or Genitive).'
                    });
                }
            }
        });

        // If no specific errors found but still wrong, add general spelling error
        if (errors.length === 0 && normalized !== expected) {
            errors.push({
                type: 'SPELLING',
                expected: currentItem.sentence.germanText,
                actual: userInput,
                explanation: 'Check your spelling and word order carefully.'
            });
        }

        return { isCorrect: false, errors };
    };

    const handleSubmit = async () => {
        if (!userInput.trim()) return;

        setIsAnalyzing(true);

        try {
            const { isCorrect, errors } = await checkAnswer();

            if (isCorrect) {
                // Correct answer - log and move on
                await onItemComplete(currentItem.id, 1, outputType);
                moveToNext();
            } else {
                // Incorrect - show Grammar Doctor
                setErrors(errors);
                setShowGrammarDoctor(true);
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRetrySubmit = async () => {
        if (!retryValue.trim()) return;

        setHasRetried(true);

        // Check if retry is correct (partial credit)
        const normalized = normalizeText(retryValue);
        const expected = normalizeText(currentItem.sentence.germanText);
        const quality = normalized === expected ? 0.5 : 0; // Partial credit for correct retry

        await onItemComplete(currentItem.id, quality, outputType);

        // Move to next after a short delay
        setTimeout(() => {
            moveToNext();
        }, 1500);
    };

    const moveToNext = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            resetState();
        } else {
            onComplete();
        }
    };

    const resetState = () => {
        setUserInput('');
        setShowGrammarDoctor(false);
        setErrors([]);
        setRetryValue('');
        setHasRetried(false);
    };

    if (!currentItem) {
        return (
            <div className="text-center py-12">
                <p className="text-[#8b7355]">No items to review</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-[#8b7355] mb-2">
                    <span>Progress</span>
                    <span>{currentIndex + 1} / {items.length}</span>
                </div>
                <div className="h-2 bg-[#e2d5c7] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#c17767] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Task Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                {/* CEFR Level Badge */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-[#8b7355] bg-[#faf5f0] px-3 py-1 rounded-full">
                        🎯 Translate to German
                    </span>
                    <span className="text-xs text-[#8b7355]">
                        {currentItem.sentence.cefrLevel}
                    </span>
                </div>

                {/* English Prompt */}
                <div className="bg-[#faf5f0] rounded-xl p-4 mb-6">
                    <p className="text-xl font-medium text-[#2d1b0e]">
                        {currentItem.sentence.englishText}
                    </p>
                </div>

                {/* Output Capture (if not showing Grammar Doctor) */}
                {!showGrammarDoctor && (
                    <>
                        <OutputCapture
                            value={userInput}
                            onChange={setUserInput}
                            onSubmit={handleSubmit}
                            disabled={isAnalyzing}
                        />

                        <Button
                            onClick={handleSubmit}
                            disabled={!userInput.trim() || isAnalyzing}
                            className="w-full mt-4"
                            size="lg"
                            isLoading={isAnalyzing}
                        >
                            Check Answer
                        </Button>
                    </>
                )}

                {/* Grammar Doctor */}
                {showGrammarDoctor && (
                    <GrammarDoctor
                        userInput={userInput}
                        expectedOutput={currentItem.sentence.germanText}
                        errors={errors}
                        onRetry={() => setShowGrammarDoctor(false)}
                        retryValue={retryValue}
                        setRetryValue={setRetryValue}
                        onRetrySubmit={handleRetrySubmit}
                        hasRetried={hasRetried}
                    />
                )}
            </div>

            {/* Cannot Skip Notice */}
            <p className="text-center text-xs text-[#8b7355]">
                ⚠️ You must produce German output to continue
            </p>
        </div>
    );
}
