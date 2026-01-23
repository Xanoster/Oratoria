'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './RecordControl.module.css';

interface RecordControlProps {
    id: string;
    maxMs?: number;
    silenceTimeoutMs?: number; // Auto-stop after silence
    ariaLabel?: string;
    onTranscript: (transcript: string) => void;
    onError?: (error: { code: string; message: string }) => void;
}

type RecordState = 'idle' | 'recording' | 'processing' | 'error' | 'disabled';

export default function RecordControl({
    id,
    maxMs = 60000,
    silenceTimeoutMs = 2000, // Auto-stop after 2 seconds of silence
    ariaLabel = 'Start speaking',
    onTranscript,
    onError,
}: RecordControlProps) {
    const [state, setState] = useState<RecordState>('idle');
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const maxTimerRef = useRef<NodeJS.Timeout | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const transcriptRef = useRef<string>('');
    const stateRef = useRef<RecordState>('idle');
    const isStoppingRef = useRef(false);

    // Keep refs in sync with state
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (maxTimerRef.current) {
            clearTimeout(maxTimerRef.current);
            maxTimerRef.current = null;
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    // Reset silence timer whenever we get speech
    const resetSilenceTimer = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }

        silenceTimerRef.current = setTimeout(() => {
            // Auto-stop after silence
            if (stateRef.current === 'recording' && transcriptRef.current) {
                console.log('Auto-stopping after silence');
                stopRecording();
            }
        }, silenceTimeoutMs);
    }, [silenceTimeoutMs]);

    const processResult = useCallback(() => {
        const currentTranscript = transcriptRef.current;
        setState('processing');

        setTimeout(() => {
            if (currentTranscript) {
                onTranscript(currentTranscript);
            }
            setState('idle');
            setTranscript('');
            transcriptRef.current = '';
            isStoppingRef.current = false;
        }, 300);
    }, [onTranscript]);

    const stopRecording = useCallback(() => {
        if (!recognitionRef.current || isStoppingRef.current) return;

        isStoppingRef.current = true;
        cleanup();

        try {
            recognitionRef.current.stop();
        } catch (e) {
            console.error('Error stopping recognition:', e);
            // If stop fails, still process the result
            processResult();
        }
    }, [cleanup, processResult]);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setState('disabled');
            onError?.({ code: 'NOT_SUPPORTED', message: 'Speech recognition not supported' });
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'de-DE';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            const newTranscript = finalTranscript || interimTranscript;
            setTranscript(newTranscript);
            transcriptRef.current = newTranscript;

            // Reset silence timer on any speech
            resetSilenceTimer();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            cleanup();
            isStoppingRef.current = false;

            if (event.error === 'not-allowed') {
                setState('error');
                onError?.({ code: 'MIC_DENIED', message: 'Microphone access blocked' });
            } else if (event.error === 'no-speech') {
                // No speech detected - go back to idle
                setState('idle');
                onError?.({ code: 'NO_SPEECH', message: 'No voice detected' });
            } else if (event.error === 'aborted') {
                // User stopped - this is expected
                processResult();
            } else {
                setState('error');
                onError?.({ code: 'UNKNOWN', message: event.error });
            }
        };

        recognition.onend = () => {
            console.log('Recognition ended');
            cleanup();

            // Process result if we have a transcript
            if (stateRef.current === 'recording' || isStoppingRef.current) {
                processResult();
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
            cleanup();
        };
    }, [onError, cleanup, resetSilenceTimer, processResult]);

    function handleToggle() {
        if (state === 'recording') {
            stopRecording();
        } else if (state === 'idle' || state === 'error') {
            startRecording();
        }
    }

    function startRecording() {
        if (!recognitionRef.current) return;

        isStoppingRef.current = false;
        setState('recording');
        setTranscript('');
        transcriptRef.current = '';

        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error('Error starting recognition:', e);
            setState('error');
            return;
        }

        // Auto-stop after maxMs
        maxTimerRef.current = setTimeout(() => {
            console.log('Max time reached, stopping');
            stopRecording();
        }, maxMs);

        // Start silence timer
        resetSilenceTimer();
    }

    return (
        <div className={styles.container}>
            {/* Live transcript */}
            {transcript && (
                <div className={styles.transcript} aria-live="polite">
                    {transcript}
                </div>
            )}

            {/* Record button */}
            <button
                id={id}
                type="button"
                className={`${styles.recordBtn} ${state === 'recording' ? styles.recording : ''}`}
                onClick={handleToggle}
                disabled={state === 'disabled' || state === 'processing'}
                aria-label={ariaLabel}
                aria-pressed={state === 'recording'}
            >
                {state === 'idle' && (
                    <>
                        <span className={styles.micIcon}>🎤</span>
                        <span>Start speaking</span>
                    </>
                )}
                {state === 'recording' && (
                    <>
                        <span className={styles.pulseRing} />
                        <span className={styles.stopIcon}>⏹</span>
                        <span>Stop</span>
                    </>
                )}
                {state === 'processing' && (
                    <>
                        <span className={styles.spinner} />
                        <span>Processing...</span>
                    </>
                )}
                {state === 'error' && (
                    <>
                        <span className={styles.errorIcon}>⚠️</span>
                        <span>Retry</span>
                    </>
                )}
                {state === 'disabled' && (
                    <>
                        <span className={styles.disabledIcon}>🎤</span>
                        <span>Not available</span>
                    </>
                )}
            </button>

            {/* Status message */}
            <div className={styles.status} aria-live="polite">
                {state === 'recording' && 'Listening...'}
                {state === 'error' && 'Try speaking again'}
            </div>
        </div>
    );
}

// Type declarations for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}
