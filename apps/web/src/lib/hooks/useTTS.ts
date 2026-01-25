'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTTSOptions {
    rate?: number;    // 0.1 to 10, default 1
    pitch?: number;   // 0 to 2, default 1
    voice?: string;   // Voice name (German preferred)
    onEnd?: () => void;
    onError?: (error: string) => void;
}

interface UseTTSReturn {
    speak: (text: string) => void;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    isSpeaking: boolean;
    isPaused: boolean;
    isSupported: boolean;
    voices: SpeechSynthesisVoice[];
    setRate: (rate: number) => void;
}

/**
 * React hook for Text-to-Speech using Web Speech API
 * Prioritizes German voices when available
 */
export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [rate, setRateState] = useState(options.rate || 1);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    // Load available voices
    useEffect(() => {
        if (!isSupported) return;

        const loadVoices = () => {
            const availableVoices = speechSynthesis.getVoices();
            // Prioritize German voices
            const sortedVoices = availableVoices.sort((a, b) => {
                const aIsGerman = a.lang.startsWith('de');
                const bIsGerman = b.lang.startsWith('de');
                if (aIsGerman && !bIsGerman) return -1;
                if (!aIsGerman && bIsGerman) return 1;
                return 0;
            });
            setVoices(sortedVoices);
        };

        loadVoices();
        speechSynthesis.addEventListener('voiceschanged', loadVoices);

        return () => {
            speechSynthesis.removeEventListener('voiceschanged', loadVoices);
        };
    }, [isSupported]);

    const speak = useCallback((text: string) => {
        if (!isSupported) {
            options.onError?.('Speech synthesis not supported in this browser');
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = options.pitch || 1;

        // Try to use specified voice or find a German voice
        if (options.voice) {
            const selectedVoice = voices.find(v => v.name === options.voice);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        } else {
            // Find a German voice
            const germanVoice = voices.find(v => v.lang.startsWith('de'));
            if (germanVoice) {
                utterance.voice = germanVoice;
            }
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
            setIsPaused(false);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
            options.onEnd?.();
        };

        utterance.onerror = (event) => {
            setIsSpeaking(false);
            setIsPaused(false);
            options.onError?.(event.error);
        };

        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
    }, [isSupported, rate, options, voices]);

    const stop = useCallback(() => {
        if (!isSupported) return;
        speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
    }, [isSupported]);

    const pause = useCallback(() => {
        if (!isSupported) return;
        speechSynthesis.pause();
        setIsPaused(true);
    }, [isSupported]);

    const resume = useCallback(() => {
        if (!isSupported) return;
        speechSynthesis.resume();
        setIsPaused(false);
    }, [isSupported]);

    const setRate = useCallback((newRate: number) => {
        setRateState(Math.max(0.1, Math.min(10, newRate)));
    }, []);

    return {
        speak,
        stop,
        pause,
        resume,
        isSpeaking,
        isPaused,
        isSupported,
        voices,
        setRate,
    };
}

export default useTTS;
