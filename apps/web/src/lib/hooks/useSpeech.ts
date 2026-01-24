'use client';

import { useState, useCallback } from 'react';

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
