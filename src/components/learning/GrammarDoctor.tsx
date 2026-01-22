'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

interface GrammarError {
    type: string;
    position?: number;
    expected: string;
    actual: string;
    explanation: string;
}

interface GrammarDoctorProps {
    userInput: string;
    expectedOutput: string;
    errors: GrammarError[];
    onRetry: () => void;
    retryValue: string;
    setRetryValue: (value: string) => void;
    onRetrySubmit: () => void;
    hasRetried: boolean;
}

export default function GrammarDoctor({
    userInput,
    expectedOutput,
    errors,
    onRetry,
    retryValue,
    setRetryValue,
    onRetrySubmit,
    hasRetried
}: GrammarDoctorProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (retryValue.trim()) {
                onRetrySubmit();
            }
        }
    };

    return (
        <div className="bg-[#fff8f5] border border-[#f5d0c5] rounded-2xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#c17767] rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🩺</span>
                </div>
                <div>
                    <h3 className="font-serif font-bold text-[#2d1b0e]">
                        Grammar Doctor
                    </h3>
                    <p className="text-sm text-[#8b7355]">
                        Let's fix this together
                    </p>
                </div>
            </div>

            {/* Your Answer vs Correct Answer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-[#f5d0c5]">
                    <span className="text-xs font-medium text-[#c17767] uppercase tracking-wide">
                        Your answer
                    </span>
                    <p className="mt-2 text-[#2d1b0e]">{userInput}</p>
                </div>
                <div className="bg-[#f0f7e6] rounded-xl p-4 border border-[#d4e5c4]">
                    <span className="text-xs font-medium text-[#6b8e23] uppercase tracking-wide">
                        Correct answer
                    </span>
                    <p className="mt-2 text-[#2d1b0e] font-medium">{expectedOutput}</p>
                </div>
            </div>

            {/* Error Explanations */}
            {errors.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-[#5c4a3a]">
                        What to fix:
                    </h4>
                    {errors.map((error, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 bg-white rounded-lg p-3 border-l-4 border-[#c17767]"
                        >
                            <span className="text-lg">
                                {error.type === 'ARTICLE' && '📝'}
                                {error.type === 'CASE' && '📐'}
                                {error.type === 'VERB_POSITION' && '🔄'}
                                {error.type === 'TENSE' && '⏰'}
                                {error.type === 'WORD_ORDER' && '📋'}
                                {error.type === 'SPELLING' && '✏️'}
                                {!['ARTICLE', 'CASE', 'VERB_POSITION', 'TENSE', 'WORD_ORDER', 'SPELLING'].includes(error.type) && '❓'}
                            </span>
                            <div>
                                <p className="text-sm font-medium text-[#2d1b0e]">
                                    {error.type.replace('_', ' ')}
                                </p>
                                <p className="text-sm text-[#5c4a3a]">
                                    {error.explanation}
                                </p>
                                {error.expected !== error.actual && (
                                    <p className="text-xs text-[#8b7355] mt-1">
                                        <span className="line-through text-[#c17767]">{error.actual}</span>
                                        {' → '}
                                        <span className="text-[#6b8e23] font-medium">{error.expected}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Retry Section */}
            {!hasRetried ? (
                <div className="space-y-3 pt-4 border-t border-[#f5d0c5]">
                    <p className="text-sm text-[#5c4a3a]">
                        <strong>Try again:</strong> Type the correct sentence below
                    </p>
                    <textarea
                        value={retryValue}
                        onChange={(e) => setRetryValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type the correct German sentence..."
                        className="w-full p-3 border border-[#e2d5c7] rounded-xl resize-none text-lg focus:ring-2 focus:ring-[#c17767] focus:border-transparent"
                        rows={2}
                        autoFocus
                    />
                    <Button
                        onClick={onRetrySubmit}
                        disabled={!retryValue.trim()}
                        className="w-full"
                    >
                        Submit Retry
                    </Button>
                </div>
            ) : (
                <div className="pt-4 border-t border-[#f5d0c5]">
                    <div className="flex items-center gap-2 text-[#6b8e23]">
                        <span className="text-xl">✓</span>
                        <p className="font-medium">Retry completed - moving on!</p>
                    </div>
                </div>
            )}
        </div>
    );
}
