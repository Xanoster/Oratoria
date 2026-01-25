'use client';

import { useState, useCallback } from 'react';
import { X, Volume2, Mic, RefreshCw, Check, ChevronDown } from 'lucide-react';

// ==========================================
// Types
// ==========================================

export interface PhonemeError {
    word: string;
    phoneme: string;
    expected: string;
    actual: string;
    tip: string;
}

export interface EvaluationResult {
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
    evaluationResult: EvaluationResult;
    phonemeErrors: PhonemeError[];
    expectedText: string;
    userTranscript: string;
    onRetry: () => void;
    onContinue: () => void;
    onSpeak?: (text: string) => void;
}

// ==========================================
// Listen-Record-Compare Step Component
// ==========================================

interface PracticeStepProps {
    error: PhonemeError;
    onSpeak: (text: string) => void;
    onComplete: () => void;
}

function PracticeStep({ error, onSpeak, onComplete }: PracticeStepProps) {
    const [step, setStep] = useState<'listen' | 'record' | 'compare'>('listen');
    const [hasListened, setHasListened] = useState(false);
    const [hasRecorded, setHasRecorded] = useState(false);

    const handleListen = () => {
        onSpeak(error.word);
        setHasListened(true);
    };

    const handleRecord = () => {
        // Trigger recording - in real implementation, would call RecordControl
        setHasRecorded(true);
        setStep('compare');
    };

    const handleNext = () => {
        onComplete();
    };

    return (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            {/* Word with Highlight */}
            <div className="mb-4">
                <span className="text-lg font-medium text-amber-400">{error.word}</span>
                <span className="ml-2 text-sm text-gray-400">{error.phoneme}</span>
            </div>

            {/* Phoneme Tip */}
            <p className="text-sm text-gray-500 mb-4">{error.tip}</p>

            {/* Listen → Record → Compare Loop */}
            <div className="flex gap-2">
                {/* Listen Button */}
                <button
                    onClick={handleListen}
                    className={`
                        flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all
                        ${step === 'listen'
                            ? 'bg-emerald-500 text-gray-900'
                            : hasListened
                                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                : 'bg-gray-100 text-gray-500'
                        }
                    `}
                >
                    {hasListened ? <Check size={16} /> : <Volume2 size={16} />}
                    Listen
                </button>

                {/* Record Button */}
                <button
                    onClick={() => {
                        setStep('record');
                        handleRecord();
                    }}
                    disabled={!hasListened}
                    className={`
                        flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all
                        ${!hasListened
                            ? 'bg-gray-100 text-slate-600 cursor-not-allowed'
                            : step === 'record'
                                ? 'bg-red-600 text-gray-900 animate-pulse'
                                : hasRecorded
                                    ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                    : 'bg-gray-100 text-gray-500 hover:bg-[#2D3B4F]'
                        }
                    `}
                >
                    {hasRecorded ? <Check size={16} /> : <Mic size={16} />}
                    Record
                </button>

                {/* Compare/Done */}
                <button
                    onClick={handleNext}
                    disabled={!hasRecorded}
                    className={`
                        flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all
                        ${!hasRecorded
                            ? 'bg-gray-100 text-slate-600 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-gray-900'
                        }
                    `}
                >
                    <Check size={16} />
                    Done
                </button>
            </div>
        </div>
    );
}

// ==========================================
// Main Modal Component
// ==========================================

export default function PronunciationFeedbackModal({
    isOpen,
    onClose,
    evaluationResult,
    phonemeErrors,
    expectedText,
    userTranscript,
    onRetry,
    onContinue,
    onSpeak,
}: PronunciationFeedbackModalProps) {
    const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
    const [showScores, setShowScores] = useState(false);
    const [completedErrors, setCompletedErrors] = useState<number[]>([]);

    if (!isOpen) return null;

    // Focus on 2-3 errors max
    const errorsToShow = phonemeErrors.slice(0, 3);
    const needsRetry = evaluationResult.confidence < 0.6;
    const allPracticed = completedErrors.length >= errorsToShow.length;

    // Highlight mispronounced words in the transcript
    const highlightedText = expectedText.split(' ').map((word, i) => {
        const isError = errorsToShow.some(e =>
            e.word.toLowerCase() === word.toLowerCase().replace(/[.,!?]/g, '')
        );
        return (
            <span
                key={i}
                className={isError ? 'text-amber-400 font-medium' : 'text-gray-600'}
            >
                {word}{' '}
            </span>
        );
    });

    const handleErrorComplete = () => {
        setCompletedErrors(prev => [...prev, currentErrorIndex]);
        if (currentErrorIndex < errorsToShow.length - 1) {
            setCurrentErrorIndex(prev => prev + 1);
        }
    };

    const handleSpeak = (text: string) => {
        if (onSpeak) {
            onSpeak(text);
        } else {
            // Fallback to browser TTS
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'de-DE';
            speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {needsRetry ? 'Try Again' : errorsToShow.length > 0 ? 'Practice These' : 'Continue'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Low Confidence - Retry Prompt */}
                    {needsRetry && (
                        <div className="mb-6 p-4 rounded-lg bg-amber-950/30 border border-amber-800/40">
                            <p className="text-sm text-amber-200">
                                Could not clearly understand the recording. Try speaking closer to the microphone.
                            </p>
                        </div>
                    )}

                    {/* Highlighted Expected Text */}
                    {!needsRetry && errorsToShow.length > 0 && (
                        <div className="mb-6">
                            <p className="text-sm text-gray-400 mb-2">Your phrase:</p>
                            <p className="text-base">{highlightedText}</p>
                        </div>
                    )}

                    {/* Practice Errors (2-3 max) */}
                    {!needsRetry && errorsToShow.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-gray-500">
                                    Word {currentErrorIndex + 1} of {errorsToShow.length}
                                </p>
                                <div className="flex gap-1">
                                    {errorsToShow.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-2 rounded-full ${completedErrors.includes(i)
                                                    ? 'bg-green-500'
                                                    : i === currentErrorIndex
                                                        ? 'bg-blue-500'
                                                        : 'bg-slate-600'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <PracticeStep
                                error={errorsToShow[currentErrorIndex]}
                                onSpeak={handleSpeak}
                                onComplete={handleErrorComplete}
                            />
                        </div>
                    )}

                    {/* No Errors - All Good */}
                    {!needsRetry && errorsToShow.length === 0 && (
                        <div className="mb-6 text-center py-4">
                            <div className="w-12 h-12 rounded-full bg-green-600/20 border border-green-600/30 flex items-center justify-center mx-auto mb-3">
                                <Check size={24} className="text-green-400" />
                            </div>
                            <p className="text-gray-600">Pronunciation is clear.</p>
                        </div>
                    )}

                    {/* Scores - Hidden by Default */}
                    <button
                        onClick={() => setShowScores(!showScores)}
                        className="w-full flex items-center justify-between py-2 text-sm text-gray-400 hover:text-gray-500 transition-colors"
                    >
                        <span>View detailed scores</span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform ${showScores ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {showScores && (
                        <div className="mt-2 p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="grid grid-cols-3 gap-4 text-center text-sm">
                                <div>
                                    <p className="text-gray-400">Pronunciation</p>
                                    <p className="text-gray-900 font-medium">{Math.round(evaluationResult.pronunciationScore)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Grammar</p>
                                    <p className="text-gray-900 font-medium">{Math.round(evaluationResult.grammarScore)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">Fluency</p>
                                    <p className="text-gray-900 font-medium">{Math.round(evaluationResult.fluencyScore)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200">
                    {needsRetry ? (
                        <div className="flex gap-3">
                            <button
                                onClick={onRetry}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-gray-900 font-medium transition-colors"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>
                            <button
                                onClick={onContinue}
                                className="flex-1 py-3 rounded-lg bg-gray-100 hover:bg-[#2D3B4F] text-gray-600 font-medium transition-colors"
                            >
                                Skip
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onContinue}
                            disabled={errorsToShow.length > 0 && !allPracticed}
                            className={`
                                w-full py-3 rounded-lg font-medium transition-colors
                                ${errorsToShow.length > 0 && !allPracticed
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-gray-900'
                                }
                            `}
                        >
                            Continue
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
