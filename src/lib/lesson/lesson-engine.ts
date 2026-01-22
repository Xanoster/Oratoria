/**
 * ORATORIA Lesson Engine
 * 
 * CORE LEARNING LOOP (ENFORCED):
 * INPUT → RECALL → OUTPUT → FEEDBACK → SRS UPDATE
 * 
 * SESSION COMPLETION CONDITIONS (ALL MUST BE TRUE):
 * - A recall attempt exists
 * - Output exists (speech or typed)
 * - Feedback has been shown
 * - SRS state has been updated and persisted
 * 
 * If any condition fails, the session remains incomplete.
 * "Next" is disabled until valid output exists.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SessionState, OutputType, Outcome, PronunciationFeedback, GrammarError } from '@/types';
import {
    startSpeechRecognition,
    isSpeechRecognitionSupported,
    SpeechRecognitionResult,
    speakText,
    generatePronunciationFeedback
} from '@/lib/speech/speech';
import { analyzeGrammar, formatAnalysisForDisplay, GrammarAnalysis } from '@/lib/grammar/grammar-doctor';
import { calculateNextReview, SRSState, createInitialSRSState } from '@/lib/srs/srs';

// =============================================================================
// TYPES
// =============================================================================

export interface LessonSentence {
    id: string;
    germanText: string;
    englishText: string;
    audioUrl?: string;
}

export interface LessonState {
    currentIndex: number;
    sentences: LessonSentence[];
    sessionStates: Map<string, SessionState>;
    isComplete: boolean;
}

export interface FeedbackData {
    grammarAnalysis: GrammarAnalysis;
    pronunciationFeedback: PronunciationFeedback;
    outcome: Outcome;
    formattedFeedback: {
        summary: string;
        details: string[];
    };
}

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

export function useLessonEngine(sentences: LessonSentence[]) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sessionStates, setSessionStates] = useState<Map<string, SessionState>>(new Map());
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [confidence, setConfidence] = useState(0);
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [srsUpdated, setSrsUpdated] = useState(false);
    const [typedInput, setTypedInput] = useState('');
    const [inputMode, setInputMode] = useState<'speech' | 'typed'>('speech');
    // FIXED: Start as false to match SSR, then check on client
    const [speechSupported, setSpeechSupported] = useState(false);

    // Server state tracking
    const [currentAttempt, setCurrentAttempt] = useState<{ id: string, analysis: GrammarAnalysis } | null>(null);

    const startTimeRef = useRef<number>(0);
    const stopRecognitionRef = useRef<(() => void) | null>(null);

    // Check speech support on client only (after hydration)
    useEffect(() => {
        setSpeechSupported(isSpeechRecognitionSupported());
    }, []);

    const currentSentence = sentences[currentIndex] || null;

    // Initialize session state for current sentence
    useEffect(() => {
        if (currentSentence && !sessionStates.has(currentSentence.id)) {
            setSessionStates(prev => {
                const next = new Map(prev);
                next.set(currentSentence.id, {
                    sentenceId: currentSentence.id,
                    hasRecallAttempt: false,
                    hasOutput: false,
                    hasFeedback: false,
                    hasSRSUpdate: false,
                    isComplete: false,
                });
                return next;
            });
        }
    }, [currentSentence, sessionStates]);

    const currentSessionState = currentSentence
        ? sessionStates.get(currentSentence.id)
        : null;

    /**
     * Check if session is complete (ALL conditions must be true)
     */
    const isSessionComplete = useCallback((state: SessionState | null): boolean => {
        if (!state) return false;
        return (
            state.hasRecallAttempt &&
            state.hasOutput &&
            state.hasFeedback &&
            state.hasSRSUpdate
        );
    }, []);

    /**
     * Update session state
     */
    const updateSessionState = useCallback((
        sentenceId: string,
        updates: Partial<SessionState>
    ) => {
        setSessionStates(prev => {
            const next = new Map(prev);
            const current = next.get(sentenceId);
            if (current) {
                const updated = { ...current, ...updates };
                updated.isComplete = (
                    updated.hasRecallAttempt &&
                    updated.hasOutput &&
                    updated.hasFeedback &&
                    updated.hasSRSUpdate
                );
                next.set(sentenceId, updated);
            }
            return next;
        });
    }, []);

    /**
     * Play sentence audio (TTS)
     */
    const playAudio = useCallback(async () => {
        if (!currentSentence) return;

        try {
            // If we have a custom audio URL, use it (future enhancement)
            // For now, use TTS
            await speakText(currentSentence.germanText);
        } catch (err) {
            setError('Failed to play audio');
        }
    }, [currentSentence]);

    /**
     * Start speech recording
     */
    const startRecording = useCallback(() => {
        if (!currentSentence) return;
        if (!isSpeechRecognitionSupported()) {
            setError('Speech recognition not supported. Use typed input instead.');
            setInputMode('typed');
            return;
        }

        setIsRecording(true);
        setTranscript('');
        setConfidence(0);
        setError(null);
        startTimeRef.current = Date.now();

        // Mark recall attempt
        updateSessionState(currentSentence.id, { hasRecallAttempt: true });

        stopRecognitionRef.current = startSpeechRecognition({
            onResult: (result: SpeechRecognitionResult) => {
                setTranscript(result.transcript);
                setConfidence(result.confidence);

                // Only mark as output when we have final, non-empty result
                if (result.isFinal && result.transcript.trim().length > 0) {
                    updateSessionState(currentSentence.id, { hasOutput: true });
                    setIsRecording(false);
                }
            },
            onError: (errorMsg: string) => {
                setError(errorMsg);
                setIsRecording(false);
            },
            onEnd: async (finalTranscript?: string) => {
                setIsRecording(false);
                // FIXED: Use the final transcript passed from speech engine
                const text = finalTranscript?.trim();

                if (text && text.length > 0 && currentSentence) {
                    setTranscript(text);

                    try {
                        // Call server to persist output
                        const response = await fetch('/api/speaking-attempt', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                sentenceId: currentSentence.id,
                                transcript: text,
                                durationMs: Date.now() - (startTimeRef.current || Date.now())
                            })
                        });

                        const data = await response.json();

                        if (data.success) {
                            setCurrentAttempt({
                                id: data.attemptId,
                                analysis: data.analysis
                            });
                            updateSessionState(currentSentence.id, { hasOutput: true });
                        }
                    } catch (err) {
                        console.error('Failed to save attempt', err);
                        // Fallback: still show output on client, but won't be valid on server
                        updateSessionState(currentSentence.id, { hasOutput: true });
                    }
                }
            },
            onStart: () => {
                setIsRecording(true);
            },
        });
    }, [currentSentence, updateSessionState]);

    /**
     * Stop speech recording
     */
    const stopRecording = useCallback(() => {
        if (stopRecognitionRef.current) {
            stopRecognitionRef.current();
            stopRecognitionRef.current = null;
        }
        setIsRecording(false);
    }, []);

    /**
     * Handle typed input submission
     */
    const submitTypedInput = useCallback(async () => {
        if (!currentSentence || !typedInput.trim()) return;

        setTranscript(typedInput);
        setConfidence(1.0); // Full confidence for typed

        try {
            const response = await fetch('/api/speaking-attempt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sentenceId: currentSentence.id,
                    transcript: typedInput,
                    durationMs: 0 // Typed has no duration
                })
            });

            const data = await response.json();

            if (data.success) {
                setCurrentAttempt({
                    id: data.attemptId,
                    analysis: data.analysis
                });
                updateSessionState(currentSentence.id, {
                    hasRecallAttempt: true,
                    hasOutput: true
                });
            }
        } catch (err) {
            console.error('Failed to save typed attempt', err);
        }

        setInputMode('typed');
    }, [currentSentence, typedInput, updateSessionState]);

    /**
     * Generate feedback for the output
     */
    const generateFeedback = useCallback(() => {
        if (!currentSentence || !transcript) return;

        // Use server analysis if available, otherwise fallback to local
        let grammarAnalysis: GrammarAnalysis;

        if (currentAttempt && currentAttempt.analysis) {
            grammarAnalysis = currentAttempt.analysis;
        } else {
            grammarAnalysis = analyzeGrammar({
                expectedText: currentSentence.germanText,
                actualText: transcript,
            });
        }

        // Pronunciation feedback (only for speech and if confidence is high enough)
        // If typed, we don't give pronunciation feedback
        const pronunciationFeedback = generatePronunciationFeedback(
            currentSentence.germanText,
            transcript
        );

        // Format for display
        const formatted = formatAnalysisForDisplay(grammarAnalysis);

        const feedbackData: FeedbackData = {
            grammarAnalysis,
            pronunciationFeedback,
            outcome: grammarAnalysis.outcome,
            formattedFeedback: {
                summary: formatted.summary,
                details: formatted.details,
            },
        };

        setFeedback(feedbackData);
        updateSessionState(currentSentence.id, { hasFeedback: true });

        return feedbackData;
    }, [currentSentence, transcript, currentAttempt, updateSessionState]);

    /**
     * Update SRS state based on performance
     */
    const updateSRS = useCallback(async (quality: 0 | 0.5 | 1) => {
        if (!currentSentence || srsUpdated || !currentAttempt) return;

        const outputType = inputMode === 'speech' ? OutputType.SPOKEN : OutputType.TYPED;

        try {
            const response = await fetch('/api/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sentenceId: currentSentence.id,
                    speakingAttemptId: currentAttempt.id,
                    quality,
                    outputType
                })
            });

            const data = await response.json();

            if (data.success) {
                setSrsUpdated(true);
                updateSessionState(currentSentence.id, { hasSRSUpdate: true });
                console.log('SRS Update persisted:', data.srsState);
            }
        } catch (err) {
            console.error('Failed to update SRS', err);
            setError('Failed to save progress. Please try again.');
        }
    }, [currentSentence, srsUpdated, inputMode, currentAttempt, updateSessionState]);

    /**
     * Move to next sentence (ONLY if current session is complete)
     */
    const goToNext = useCallback(async () => {
        if (!currentSessionState || !isSessionComplete(currentSessionState) || !currentSentence) {
            setError('Complete all steps before proceeding');
            return false;
        }

        // Verify with server before proceeding
        try {
            const response = await fetch('/api/session/complete-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sentenceId: currentSentence.id })
            });

            const data = await response.json();

            if (!data.allowed) {
                setError(data.reason || 'Session verification failed');
                return false;
            }
        } catch (err) {
            console.error('Verification failed', err);
            // Allow proceed if network error? Secure mode says no. MVP says maybe.
            // Let's block to be strict as per constitution.
            setError('Could not verify session completion with server.');
            return false;
        }

        if (currentIndex < sentences.length - 1) {
            setCurrentIndex(prev => prev + 1);
            // Reset for next sentence
            setTranscript('');
            setConfidence(0);
            setFeedback(null);
            setError(null);
            setSrsUpdated(false);
            setTypedInput('');
            setInputMode('speech');
            setCurrentAttempt(null);
            return true;
        }

        return false; // No more sentences
    }, [currentIndex, sentences.length, currentSessionState, isSessionComplete, currentSentence]);

    /**
     * Check if all sentences in lesson are complete
     */
    const isLessonComplete = useCallback(() => {
        return sentences.every(s => {
            const state = sessionStates.get(s.id);
            return state && isSessionComplete(state);
        });
    }, [sentences, sessionStates, isSessionComplete]);

    /**
     * Can proceed to next?
     * "Next" disabled until valid output exists
     */
    const canProceed = currentSessionState?.hasOutput && feedback !== null && srsUpdated;

    return {
        // State
        currentSentence,
        currentIndex,
        totalSentences: sentences.length,
        isRecording,
        transcript,
        confidence,
        feedback,
        error,
        canProceed,
        inputMode,
        typedInput,
        currentSessionState,
        isLessonComplete: isLessonComplete(),
        speechSupported,

        // Actions
        playAudio,
        startRecording,
        stopRecording,
        submitTypedInput,
        generateFeedback,
        updateSRS,
        goToNext,
        setTypedInput,
        setInputMode,
        setError,
    };
}
