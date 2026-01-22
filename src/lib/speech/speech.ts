/**
 * ORATORIA Speech Engine
 * 
 * IMPLEMENTATION:
 * - Uses Web Speech API (free, browser-native)
 * - Speech recognition for user output capture
 * - Pronunciation comparison and feedback
 * 
 * FEEDBACK (from constitution):
 * - Compare expected sentence vs transcript
 * - Highlight mismatched words or syllables
 * - Provide short phonetic hints (avoid heavy IPA)
 * - Include one concrete corrective action
 * 
 * PRIVACY:
 * - Process audio locally by default
 * - Store audio only with explicit opt-in
 */

'use client';

import { PronunciationFeedback } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface SpeechRecognitionResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
}

export interface SpeechCaptureCallbacks {
    onResult: (result: SpeechRecognitionResult) => void;
    onError: (error: string) => void;
    onEnd: () => void;
    onStart?: () => void;
}

// =============================================================================
// BROWSER SUPPORT CHECK
// =============================================================================

export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;

    return !!(
        window.SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition
    );
}

// =============================================================================
// SPEECH RECOGNITION
// =============================================================================

let recognition: InstanceType<typeof window.SpeechRecognition> | null = null;

/**
 * Start speech recognition
 * 
 * @returns Cleanup function to stop recognition
 */
export function startSpeechRecognition(
    callbacks: SpeechCaptureCallbacks,
    language: string = 'de-DE'
): () => void {
    if (!isSpeechRecognitionSupported()) {
        callbacks.onError('Speech recognition is not supported in this browser');
        return () => { };
    }

    const SpeechRecognition =
        window.SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        callbacks.onStart?.();
    };

    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        callbacks.onResult({
            transcript,
            confidence: confidence || 0.5, // Default if not provided
            isFinal: result.isFinal,
        });
    };

    recognition.onerror = (event) => {
        // Debug logging
        console.error('Speech Recognition Error:', {
            error: event.error,
            message: event.message,
            type: event.type
        });

        let errorMessage = 'Speech recognition error';

        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone not available. Please check permissions.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access denied. Please enable in browser settings.';
                break;
            case 'network':
                errorMessage = 'Network error - Speech recognition requires internet. Please check your connection or use text input below.';
                break;
            case 'service-not-allowed':
                errorMessage = 'Speech service unavailable. Please use text input below.';
                break;
            default:
                errorMessage = `Speech error: ${event.error}. Try using text input instead.`;
        }

        callbacks.onError(errorMessage);
    };

    recognition.onend = () => {
        console.log('Speech recognition ended');
        callbacks.onEnd();
    };

    try {
        console.log('Starting speech recognition with language:', language);
        recognition.start();
    } catch (error) {
        console.error('Failed to start recognition:', error);
        callbacks.onError('Failed to start microphone. Please refresh and try again.');
        return () => { };
    }

    return () => {
        if (recognition) {
            recognition.stop();
            recognition = null;
        }
    };
}

/**
 * Stop current recognition session
 */
export function stopSpeechRecognition(): void {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
}

// =============================================================================
// PRONUNCIATION FEEDBACK
// =============================================================================

/**
 * German phonetic simplifications (not full IPA)
 */
const PHONETIC_HINTS: Record<string, string> = {
    'ch': 'soft "ch" after e/i, harsh after a/o/u',
    'sch': 'like English "sh"',
    'sp': 'sounds like "shp" at start',
    'st': 'sounds like "sht" at start',
    'ß': 'sharp "s" sound',
    'ü': 'round lips, say "ee"',
    'ö': 'round lips, say "eh"',
    'ä': 'like "e" in "bed"',
    'ei': 'like English "eye"',
    'ie': 'like English "ee"',
    'eu': 'like "oy" in "boy"',
    'äu': 'like "oy" in "boy"',
    'z': 'like "ts"',
    'v': 'like "f" in most German words',
    'w': 'like English "v"',
    'r': 'uvular or rolled, not English "r"',
    'j': 'like English "y"',
};

/**
 * Compare expected and actual speech, generating feedback
 */
export function generatePronunciationFeedback(
    expectedText: string,
    transcribedText: string
): PronunciationFeedback {
    const expectedWords = normalizeText(expectedText).split(/\s+/);
    const transcribedWords = normalizeText(transcribedText).split(/\s+/);

    const mismatches: PronunciationFeedback['mismatchedWords'] = [];

    // Find mismatched words
    const maxLen = Math.max(expectedWords.length, transcribedWords.length);

    for (let i = 0; i < maxLen; i++) {
        const expected = expectedWords[i] || '';
        const actual = transcribedWords[i] || '';

        if (expected.toLowerCase() !== actual.toLowerCase() && expected) {
            const phoneticHint = getPhoneticHint(expected);
            const correctiveAction = getCorrectiveAction(expected, actual);

            mismatches.push({
                word: expected,
                position: i,
                phoneticHint,
                correctiveAction,
            });
        }
    }

    // Calculate overall confidence
    const matchedCount = expectedWords.filter(
        (w, i) => transcribedWords[i]?.toLowerCase() === w.toLowerCase()
    ).length;
    const overallConfidence = expectedWords.length > 0
        ? matchedCount / expectedWords.length
        : 0;

    return {
        expectedText,
        transcribedText,
        mismatchedWords: mismatches,
        overallConfidence,
    };
}

/**
 * Get a phonetic hint for a German word
 */
function getPhoneticHint(word: string): string {
    const lower = word.toLowerCase();

    // Check for special sounds
    for (const [pattern, hint] of Object.entries(PHONETIC_HINTS)) {
        if (lower.includes(pattern)) {
            return `"${pattern}": ${hint}`;
        }
    }

    // Default hint based on word structure
    if (lower.endsWith('en')) {
        return 'Final "-en" is often softened';
    }
    if (lower.startsWith('ge')) {
        return 'Prefix "ge-" is unstressed';
    }

    return 'Practice slowly, then speed up';
}

/**
 * Get a concrete corrective action for a mispronunciation
 */
function getCorrectiveAction(expected: string, actual: string): string {
    const lower = expected.toLowerCase();
    const actualLower = actual?.toLowerCase() || '';

    // Specific corrections
    if (lower.includes('ch') && !actualLower.includes('ch')) {
        return 'Focus on the "ch" sound. Place tongue near roof of mouth.';
    }

    if (lower.includes('ü') || lower.includes('ue')) {
        return 'Round your lips tightly while saying "ee".';
    }

    if (lower.includes('ö') || lower.includes('oe')) {
        return 'Round your lips while saying "eh".';
    }

    if (lower.includes('r') && !actualLower.includes('r')) {
        return 'Practice the German "r" at back of throat.';
    }

    if (lower.endsWith('e') && actualLower.endsWith('a')) {
        return 'German final "e" is more like "uh", not "ah".';
    }

    // Generic correction
    return `Listen and repeat: "${expected}". Slow down if needed.`;
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[.,!?;:'"„""]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// =============================================================================
// SPEECH SYNTHESIS (for audio playback)
// =============================================================================

/**
 * Speak text using Web Speech API
 */
export function speakText(
    text: string,
    language: string = 'de-DE',
    rate: number = 0.9
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            reject(new Error('Speech synthesis not supported'));
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = rate;

        // Try to find a German voice
        const voices = window.speechSynthesis.getVoices();
        const germanVoice = voices.find(v => v.lang.startsWith('de'));
        if (germanVoice) {
            utterance.voice = germanVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (event) => reject(new Error(event.error));

        window.speechSynthesis.speak(utterance);
    });
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}
