'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './speak.module.css';
import RecordControl from '@/components/RecordControl';
import AppLayout from '@/components/AppLayout';

const SCENARIOS = [
    { id: 'cafe', label: 'At a café', prompt: 'Order a coffee and a sandwich', level: 'A1' },
    { id: 'train', label: 'Train station', prompt: 'Ask for a ticket to Munich', level: 'A1' },
    { id: 'doctor', label: "Doctor's office", prompt: 'Describe how you feel', level: 'A2' },
    { id: 'job', label: 'Job interview', prompt: 'Introduce yourself professionally', level: 'B1' },
];

export default function SpeakPage() {
    const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState<{
        accepted: boolean;
        pronunciationScore?: number;
        suggestions?: string[];
    } | null>(null);

    function handleTranscript(text: string) {
        setTranscript(text);
        // Show immediate micro-feedback
        setFeedback({
            accepted: false,
            pronunciationScore: 0.75,
            suggestions: ['Good attempt! Try to stress the first syllable more.'],
        });
    }

    function handleTryAgain() {
        setTranscript('');
        setFeedback(null);
    }

    function handleAccept() {
        // Queue full analysis
        setFeedback({ ...feedback!, accepted: true });
        // In production, this would call the API
        console.log('Accepted transcript:', transcript);
    }

    return (
        <AppLayout>
            <main className={styles.main}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <Link href="/learn" className={styles.backLink}>← Back</Link>
                        <h1>Speaking Practice</h1>
                    </header>

                    {/* Scenario Picker */}
                    <div className={styles.scenarioPicker}>
                        <label htmlFor="scenario" className="label">Choose a scenario</label>
                        <select
                            id="scenario"
                            className="input"
                            value={selectedScenario.id}
                            onChange={(e) => setSelectedScenario(SCENARIOS.find(s => s.id === e.target.value)!)}
                        >
                            {SCENARIOS.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.label} ({s.level})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Prompt Card */}
                    <div className={styles.promptCard}>
                        <div className={styles.promptLevel}>{selectedScenario.level}</div>
                        <h2>{selectedScenario.label}</h2>
                        <p className={styles.promptText}>{selectedScenario.prompt}</p>
                    </div>

                    {/* Recording Area */}
                    <div className={styles.recordArea}>
                        {!transcript ? (
                            <RecordControl
                                id="speak-practice"
                                onTranscript={handleTranscript}
                                ariaLabel="Start speaking"
                            />
                        ) : (
                            <div className={styles.resultArea}>
                                <div className={styles.transcriptBox}>
                                    <div className={styles.transcriptLabel}>You said:</div>
                                    <p className={styles.transcriptText}>{transcript}</p>
                                </div>

                                {feedback && !feedback.accepted && (
                                    <>
                                        <div className={styles.feedbackBox}>
                                            <div className={styles.feedbackScore}>
                                                Score: {Math.round((feedback.pronunciationScore || 0) * 100)}%
                                            </div>
                                            {feedback.suggestions?.map((s, i) => (
                                                <p key={i} className={styles.feedbackSuggestion}>{s}</p>
                                            ))}
                                        </div>

                                        <div className={styles.actionRow}>
                                            <button className="btn btn-secondary" onClick={handleTryAgain}>
                                                Try again
                                            </button>
                                            <button className="btn btn-primary" onClick={handleAccept}>
                                                Accept
                                            </button>
                                        </div>
                                    </>
                                )}

                                {feedback?.accepted && (
                                    <div className={styles.acceptedBox}>
                                        <p>✓ Saved! Full analysis will be ready soon.</p>
                                        <button className="btn btn-primary mt-4" onClick={handleTryAgain}>
                                            Practice again
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
