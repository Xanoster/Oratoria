'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './placement.module.css';
import RecordControl from '@/components/RecordControl';

const PROMPTS = [
    {
        id: 'p1',
        text: 'Bitte stellen Sie sich vor. Wie heißen Sie und woher kommen Sie?',
        translation: 'Please introduce yourself. What is your name and where are you from?',
    },
    {
        id: 'p2',
        text: 'Was machen Sie beruflich? Erzählen Sie mir von Ihrem Arbeitstag.',
        translation: 'What do you do for work? Tell me about your workday.',
    },
    {
        id: 'p3',
        text: 'Was sind Ihre Hobbys? Warum interessieren Sie sich dafür?',
        translation: 'What are your hobbies? Why are you interested in them?',
    },
];

export default function PlacementPage() {
    const router = useRouter();
    const [currentPrompt, setCurrentPrompt] = useState(0);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<{ level: string; confidence: number } | null>(null);
    const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

    useEffect(() => {
        // Check mic permission
        navigator.permissions?.query({ name: 'microphone' as PermissionName })
            .then((result) => {
                setMicPermission(result.state as 'granted' | 'denied' | 'prompt');
            })
            .catch(() => {
                // Permission API not available, will prompt when needed
            });
    }, []);

    async function handleTranscript(transcript: string) {
        const prompt = PROMPTS[currentPrompt];
        setResponses((prev) => ({ ...prev, [prompt.id]: transcript }));

        if (currentPrompt < PROMPTS.length - 1) {
            setCurrentPrompt(currentPrompt + 1);
        } else {
            await analyzeResponses({ ...responses, [prompt.id]: transcript });
        }
    }

    async function analyzeResponses(allResponses: Record<string, string>) {
        setIsAnalyzing(true);

        try {
            // In production, this would call the API
            // For now, simulate analysis
            await new Promise((r) => setTimeout(r, 2000));

            setResult({
                level: 'A1',
                confidence: 0.82,
            });
        } catch (error) {
            console.error('Analysis failed:', error);
            setResult({
                level: 'A1',
                confidence: 0.5,
            });
        } finally {
            setIsAnalyzing(false);
        }
    }

    function handleSkipPrompt() {
        if (currentPrompt < PROMPTS.length - 1) {
            setCurrentPrompt(currentPrompt + 1);
        } else {
            // On last prompt, trigger analysis with whatever responses we have
            analyzeResponses(responses);
        }
    }

    function handleContinue() {
        router.push('/learn');
    }

    function handleRetry() {
        setCurrentPrompt(0);
        setResponses({});
        setResult(null);
    }

    if (micPermission === 'denied') {
        return (
            <main className={styles.main}>
                <div className={styles.modal}>
                    <h2>Microphone permission required</h2>
                    <p>
                        Open browser settings and allow microphone access for this site.
                        Or continue with a short typing test.
                    </p>
                    <div className={styles.buttonRow}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => window.open('chrome://settings/content/microphone', '_blank')}
                        >
                            Open browser settings
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => router.push('/placement/typing')}
                        >
                            Use typing fallback
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    if (isAnalyzing) {
        return (
            <main className={styles.main}>
                <div className={styles.analyzing}>
                    <div className={styles.spinner} />
                    <h2>Analyzing your responses...</h2>
                    <p className="text-muted">This may take a moment.</p>
                </div>
            </main>
        );
    }

    if (result) {
        const isHighConfidence = result.confidence >= 0.7;

        return (
            <main className={styles.main}>
                <div className={styles.result}>
                    <div className={styles.resultIcon}>🎉</div>
                    <h1>Placement Complete!</h1>

                    <div className={styles.levelCard}>
                        <div className={styles.levelLabel}>Estimated level</div>
                        <div className={styles.level}>{result.level}</div>
                        <div className={styles.confidence}>
                            Confidence: {isHighConfidence ? 'High' : 'Low'}
                        </div>
                    </div>

                    {!isHighConfidence && (
                        <p className="text-muted mb-4">
                            Low confidence — you may want to retry for a more accurate assessment.
                        </p>
                    )}

                    <div className={styles.buttonRow}>
                        {!isHighConfidence && (
                            <button className="btn btn-secondary" onClick={handleRetry}>
                                Retry placement
                            </button>
                        )}
                        <button className="btn btn-primary btn-lg" onClick={handleContinue}>
                            Start learning
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const prompt = PROMPTS[currentPrompt];

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <h1>Placement test — 5 minutes</h1>
                    <div className={styles.progress}>
                        {currentPrompt + 1} of {PROMPTS.length}
                    </div>
                </div>

                {/* Prompt Card */}
                <div className={styles.promptCard}>
                    <p className={styles.promptText}>{prompt.text}</p>
                    <p className={styles.promptTranslation}>{prompt.translation}</p>

                    <button className={styles.repeatBtn}>
                        🔊 Repeat prompt
                    </button>
                </div>

                {/* Record Control */}
                <div className={styles.recordArea}>
                    <RecordControl
                        id={`record-${prompt.id}`}
                        onTranscript={handleTranscript}
                        ariaLabel="Start speaking"
                    />

                    <button className={styles.skipBtn} onClick={handleSkipPrompt}>
                        Skip prompt
                    </button>
                </div>
            </div>
        </main>
    );
}
