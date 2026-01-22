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

    const checkAnswer = async (): Promise<{ isCorrect: boolean; errors: GrammarError[]; quality: number }> => {
        // First try Gemini API for intelligent analysis
        try {
            const response = await fetch('/api/learning/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userInput,
                    expectedSentence: currentItem.sentence.germanText,
                    cefrLevel: currentItem.sentence.cefrLevel
                })
            });

            if (response.ok) {
                const result = await response.json();
                return {
                    isCorrect: result.isCorrect,
                    errors: result.errors || [],
                    quality: result.quality || (result.isCorrect ? 1 : 0)
                };
            }
        } catch (error) {
            console.error('Gemini analysis failed, falling back to local:', error);
        }

        // Fallback to local comparison
        const normalized = normalizeText(userInput);
        const expected = normalizeText(currentItem.sentence.germanText);

        if (normalized === expected) {
            return { isCorrect: true, errors: [], quality: 1 };
        }

        // Generate basic error analysis
        const errors: GrammarError[] = [];
        const userWords = normalized.split(' ');
        const expectedWords = expected.split(' ');

        // Check for article errors
        const articles = ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer'];
        userWords.forEach((word, i) => {
            if (articles.includes(word) && expectedWords[i] && articles.includes(expectedWords[i]) && word !== expectedWords[i]) {
                errors.push({
                    type: 'ARTICLE',
                    expected: expectedWords[i],
                    actual: word,
                    explanation: 'Check the gender and case of the noun for the correct article.'
                });
            }
        });

        if (errors.length === 0) {
            errors.push({
                type: 'SPELLING',
                expected: currentItem.sentence.germanText,
                actual: userInput,
                explanation: 'Check your spelling and word order carefully.'
            });
        }

        return { isCorrect: false, errors, quality: 0 };
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
