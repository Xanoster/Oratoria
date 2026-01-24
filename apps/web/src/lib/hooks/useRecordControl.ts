import { useState, useRef, useEffect, useCallback } from 'react';

export type RecordState = 'idle' | 'recording' | 'processing' | 'error' | 'disabled';

interface UseRecordControlOptions {
    maxMs?: number;
    silenceTimeoutMs?: number;
    onTranscript?: (transcript: string) => void;
    onError?: (error: { code: string; message: string }) => void;
}

export function useRecordControl({
    maxMs = 60000,
    silenceTimeoutMs = 2500,
    onTranscript,
    onError,
}: UseRecordControlOptions = {}) {
    const [state, setState] = useState<RecordState>('idle');
    const [transcript, setTranscript] = useState('');

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const maxTimerRef = useRef<NodeJS.Timeout | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const transcriptRef = useRef<string>('');
    const stateRef = useRef<RecordState>('idle');
    const isStoppingRef = useRef(false);

    // Use refs for callbacks to avoid re-initializing effect when they change
    const onTranscriptRef = useRef(onTranscript);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onTranscriptRef.current = onTranscript;
        onErrorRef.current = onError;
    }, [onTranscript, onError]);

    // Keep refs in sync with state
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

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

    // Stop recording helper
    const stopRecording = useCallback(() => {
        if (!recognitionRef.current || isStoppingRef.current) return;

        isStoppingRef.current = true;
        cleanup();

        try {
            recognitionRef.current.stop();
        } catch (e) {
            console.error('Error stopping recognition:', e);
            // Verify state before forcing update
            if (stateRef.current === 'recording') {
                setState('processing');
                setTimeout(() => {
                    if (transcriptRef.current && onTranscriptRef.current) {
                        onTranscriptRef.current(transcriptRef.current);
                    }
                    setState('idle');
                    isStoppingRef.current = false;
                }, 300);
            }
        }
    }, [cleanup]);

    // Reset silence timer whenever we get speech
    const resetSilenceTimer = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }

        silenceTimerRef.current = setTimeout(() => {
            // Auto-stop after silence ONLY if we have a transcript
            if (stateRef.current === 'recording' && transcriptRef.current) {
                console.log('Auto-stopping after silence');
                stopRecording();
            }
        }, silenceTimeoutMs);
    }, [silenceTimeoutMs, stopRecording]);

    const processResult = useCallback(() => {
        const currentTranscript = transcriptRef.current;
        setState('processing');

        // Small delay to simulate processing / allow UI to update
        setTimeout(() => {
            if (currentTranscript && onTranscriptRef.current) {
                onTranscriptRef.current(currentTranscript);
            }
            // Reset everything
            setState('idle');
            setTranscript('');
            transcriptRef.current = '';
            isStoppingRef.current = false;
        }, 500);
    }, []);

    const startRecording = useCallback(() => {
        if (!recognitionRef.current) return;

        cleanup();
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
    }, [cleanup, maxMs, resetSilenceTimer, stopRecording]);

    // Initialize SpeechRecognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setState('disabled');
            onErrorRef.current?.({ code: 'NOT_SUPPORTED', message: 'Speech recognition not supported' });
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'de-DE';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            // Use RecordControl's proven iteration method
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

            resetSilenceTimer();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            cleanup();
            isStoppingRef.current = false;

            if (event.error === 'not-allowed') {
                setState('error');
                onErrorRef.current?.({ code: 'MIC_DENIED', message: 'Microphone access blocked' });
            } else if (event.error === 'no-speech') {
                setState('idle');
            } else if (event.error === 'aborted') {
                // Ignore aborted, usually manual stop
                if (transcriptRef.current) {
                    processResult();
                } else {
                    setState('idle');
                }
            } else {
                setState('error');
                onErrorRef.current?.({ code: 'UNKNOWN', message: event.error });
            }
        };

        recognition.onend = () => {
            cleanup();
            // If we have content and were recording/stopping, process it
            if ((stateRef.current === 'recording' || isStoppingRef.current) && transcriptRef.current) {
                processResult();
            } else {
                if (stateRef.current === 'recording') {
                    setState('idle');
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
            cleanup();
        };
    }, [cleanup, resetSilenceTimer, processResult]); // Deps are stable now

    return {
        state,
        transcript,
        startRecording,
        stopRecording,
        isRecording: state === 'recording',
        isProcessing: state === 'processing',
    };
}
