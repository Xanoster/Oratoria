'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
    lang?: string;
    onResult?: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onListeningChange?: (isListening: boolean) => void;
    silenceTimeout?: number; // ms to wait after silence before auto-stopping
}

interface SpeechRecognitionResult {
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    error: string | null;
    isSupported: boolean;
    start: () => void;
    stop: () => void;
    reset: () => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): SpeechRecognitionResult {
    const {
        lang = 'de-DE',
        onResult,
        onError,
        onListeningChange,
        silenceTimeout = 2000, // Auto-stop after 2 seconds of silence
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasSpokenRef = useRef(false);

    const clearSilenceTimer = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    const startSilenceTimer = useCallback(() => {
        clearSilenceTimer();
        // Only start timer if user has spoken at least once
        if (hasSpokenRef.current) {
            silenceTimerRef.current = setTimeout(() => {
                // Auto-stop after silence
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
            }, silenceTimeout);
        }
    }, [silenceTimeout, clearSilenceTimer]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            setError('Speech recognition not supported. Try Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            hasSpokenRef.current = false;
            onListeningChange?.(true);
        };

        recognition.onend = () => {
            setIsListening(false);
            clearSilenceTimer();
            onListeningChange?.(false);
        };

        recognition.onerror = (event) => {
            if (event.error === 'aborted' || event.error === 'no-speech') {
                return; // Ignore these
            }
            const errorMessage = getErrorMessage(event.error);
            setError(errorMessage);
            setIsListening(false);
            onListeningChange?.(false);
            onError?.(errorMessage);
        };

        recognition.onresult = (event) => {
            clearSilenceTimer();
            let finalTranscript = '';
            let interim = '';

            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                    hasSpokenRef.current = true;
                } else {
                    interim += result[0].transcript;
                    hasSpokenRef.current = true;
                }
            }

            if (finalTranscript) {
                setTranscript(finalTranscript);
                onResult?.(finalTranscript, true);
                // Start silence timer after final result
                startSilenceTimer();
            }

            setInterimTranscript(interim);
            if (interim) {
                onResult?.(interim, false);
            }
        };

        recognition.onspeechend = () => {
            // User stopped talking, start timer
            startSilenceTimer();
        };

        recognitionRef.current = recognition;

        return () => {
            clearSilenceTimer();
            recognition.abort();
        };
    }, [lang, onResult, onError, onListeningChange, startSilenceTimer, clearSilenceTimer]);

    const start = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setInterimTranscript('');
            setError(null);
            hasSpokenRef.current = false;
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error('Failed to start speech recognition:', e);
            }
        }
    }, [isListening]);

    const stop = useCallback(() => {
        clearSilenceTimer();
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, [clearSilenceTimer]);

    const reset = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        error,
        isSupported,
        start,
        stop,
        reset,
    };
}

function getErrorMessage(error: string): string {
    switch (error) {
        case 'no-speech':
            return 'No speech detected. Speak clearly.';
        case 'audio-capture':
            return 'No microphone found.';
        case 'not-allowed':
            return 'Microphone access denied. Please allow in browser settings.';
        case 'network':
            return 'Network error.';
        default:
            return `Error: ${error}`;
    }
}

// Text-to-speech
export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);

    const speak = useCallback((text: string, lang = 'de-DE') => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.85;

        const voices = window.speechSynthesis.getVoices();
        const germanVoice = voices.find(v => v.lang.startsWith('de'));
        if (germanVoice) utterance.voice = germanVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, []);

    return { speak, stop, isSpeaking };
}
