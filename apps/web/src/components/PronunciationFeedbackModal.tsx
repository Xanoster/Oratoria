'use client';

import { useState } from 'react';
import { X, AlertTriangle, Volume2, RefreshCw } from 'lucide-react';

interface EvaluationResult {
    overallScore: number;
    pronunciationScore: number;
    grammarScore: number;
    fluencyScore: number;
    confidence: number;
    detectedErrors: Array<{
        type: 'pronunciation' | 'grammar' | 'fluency';
        token: string;
        expected: string;
        explanation: string;
    }>;
}

interface PronunciationFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    evaluation: EvaluationResult;
    expectedText: string;
    userTranscript: string;
    onRetry: () => void;
    onContinue: () => void;
    onPracticeError?: (errorToken: string) => void;
}

export default function PronunciationFeedbackModal({
    isOpen,
    onClose,
    evaluation,
    expectedText,
    userTranscript,
    onRetry,
    onContinue,
    onPracticeError,
}: PronunciationFeedbackModalProps) {
    const [showErrors, setShowErrors] = useState(false);

    if (!isOpen) return null;

    const needsRetry = evaluation.confidence < 0.6;
    const hasRepeatedErrors = evaluation.detectedErrors.length > 0;
    const pronunciationErrors = evaluation.detectedErrors.filter(e => e.type === 'pronunciation');

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0F1729] border border-[#1E293B] rounded-2xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">
                        {needsRetry ? 'Try Again' : 'Feedback'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Score Display */}
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`
                            w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold
                            ${evaluation.pronunciationScore >= 70
                                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                : evaluation.pronunciationScore >= 50
                                    ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                                    : 'bg-red-600/20 text-red-400 border border-red-600/30'
                            }
                        `}>
                            {Math.round(evaluation.pronunciationScore)}
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Pronunciation Score</p>
                            <p className="text-white">
                                {evaluation.pronunciationScore >= 70
                                    ? 'Clear pronunciation'
                                    : evaluation.pronunciationScore >= 50
                                        ? 'Needs practice'
                                        : 'Difficult to understand'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Low Confidence Warning */}
                    {needsRetry && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 mb-4">
                            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-200">
                                Could not clearly hear your response. Please try speaking louder or closer to the microphone.
                            </p>
                        </div>
                    )}

                    {/* Transcript Comparison */}
                    <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                            <span className="text-slate-500 w-16">Expected:</span>
                            <span className="text-slate-300">{expectedText}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-slate-500 w-16">You said:</span>
                            <span className="text-white">{userTranscript || '(no speech detected)'}</span>
                        </div>
                    </div>
                </div>

                {/* Error Details (collapsible) */}
                {hasRepeatedErrors && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowErrors(!showErrors)}
                            className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                        >
                            {showErrors ? 'Hide' : 'Show'} details ({evaluation.detectedErrors.length} issues)
                        </button>

                        {showErrors && (
                            <div className="mt-3 space-y-2">
                                {evaluation.detectedErrors.slice(0, 3).map((error, i) => (
                                    <div
                                        key={i}
                                        className="p-3 rounded-lg bg-[#0A0F1C] border border-[#1E293B]"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-medium">{error.token}</span>
                                            <span className={`
                                                text-xs px-2 py-0.5 rounded-full
                                                ${error.type === 'pronunciation'
                                                    ? 'bg-purple-600/20 text-purple-400'
                                                    : 'bg-blue-600/20 text-blue-400'
                                                }
                                            `}>
                                                {error.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400">{error.explanation}</p>
                                        {error.type === 'pronunciation' && onPracticeError && (
                                            <button
                                                onClick={() => onPracticeError(error.token)}
                                                className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                                            >
                                                <Volume2 size={12} />
                                                Practice this word
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Repair Drill Suggestion */}
                {pronunciationErrors.length >= 2 && (
                    <div className="mb-6 p-3 rounded-lg bg-purple-950/30 border border-purple-800/40">
                        <p className="text-sm text-purple-200">
                            Multiple pronunciation issues detected. Consider a focused drill.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {needsRetry ? (
                        <>
                            <button
                                onClick={onRetry}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors"
                            >
                                <RefreshCw size={16} />
                                Retry
                            </button>
                            <button
                                onClick={onContinue}
                                className="flex-1 py-3 rounded-lg bg-[#1E293B] hover:bg-[#2D3B4F] text-slate-300 font-medium transition-colors"
                            >
                                Skip
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onContinue}
                            className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                        >
                            Continue
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
