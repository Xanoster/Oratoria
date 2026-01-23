'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './progress.module.css';
import AppLayout from '@/components/AppLayout';

interface ProgressData {
    level: string;
    speaking: {
        averagePronunciationScore: number | null;
        sessionsCompleted: number;
    };
    grammar: {
        itemsLearned: number;
    };
    vocabulary: {
        itemsLearned: number;
    };
}

export default function ProgressPage() {
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProgress() {
            try {
                const res = await fetch('/api/v1/user/progress', {
                    credentials: 'include',
                });

                if (res.ok) {
                    setProgress(await res.json());
                } else {
                    // Demo data
                    setProgress({
                        level: 'A1',
                        speaking: {
                            averagePronunciationScore: 0.75,
                            sessionsCompleted: 5,
                        },
                        grammar: { itemsLearned: 12 },
                        vocabulary: { itemsLearned: 45 },
                    });
                }
            } catch (error) {
                console.error('Failed to fetch progress:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchProgress();
    }, []);

    if (loading) {
        return (
            <AppLayout>
                <main className={styles.main}>
                    <div className={styles.loading}>Loading progress...</div>
                </main>
            </AppLayout>
        );
    }

    const insufficientData = !progress?.speaking.sessionsCompleted || progress.speaking.sessionsCompleted < 3;

    return (
        <AppLayout>
            <main className={styles.main}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <Link href="/learn" className={styles.backLink}>← Back</Link>
                        <h1>Progress & Diagnostics</h1>
                    </header>

                    {/* Level Card */}
                    <section className={styles.levelCard}>
                        <div className={styles.levelLabel}>Current Level</div>
                        <div className={styles.level}>{progress?.level || 'A1'}</div>
                        <div className={styles.levelNote}>Based on your last 3 assessment scores</div>
                    </section>

                    {insufficientData ? (
                        <section className={styles.notice}>
                            <p>
                                <strong>Not enough speaking samples yet</strong> — do 3 short speaking tasks to get started.
                            </p>
                            <Link href="/speak" className="btn btn-primary mt-4">
                                Do 3 speaking samples
                            </Link>
                        </section>
                    ) : (
                        <>
                            {/* Speaking Section */}
                            <section className={styles.section}>
                                <h2>Speaking</h2>

                                <div className={styles.metric}>
                                    <div className={styles.metricLabel}>Speaking Clarity</div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${(progress?.speaking.averagePronunciationScore || 0) * 100}%` }}
                                        />
                                    </div>
                                    <div className={styles.metricValue}>
                                        {Math.round((progress?.speaking.averagePronunciationScore || 0) * 100)}%
                                    </div>
                                </div>

                                <div className={styles.stat}>
                                    <span>Sessions completed</span>
                                    <strong>{progress?.speaking.sessionsCompleted}</strong>
                                </div>
                            </section>

                            {/* Grammar Section */}
                            <section className={styles.section}>
                                <h2>Grammar</h2>
                                <div className={styles.stat}>
                                    <span>Patterns learned</span>
                                    <strong>{progress?.grammar.itemsLearned}</strong>
                                </div>
                            </section>

                            {/* Vocabulary Section */}
                            <section className={styles.section}>
                                <h2>Vocabulary</h2>
                                <div className={styles.stat}>
                                    <span>Words learned</span>
                                    <strong>{progress?.vocabulary.itemsLearned}</strong>
                                </div>
                            </section>

                            {/* Suggestions */}
                            <section className={styles.suggestions}>
                                <h3>Suggested Next Actions</h3>
                                <Link href="/review" className={styles.suggestionItem}>
                                    <span className={styles.suggestionIcon}>📚</span>
                                    <span>Complete pending reviews to reinforce learning</span>
                                </Link>
                                <Link href="/speak" className={styles.suggestionItem}>
                                    <span className={styles.suggestionIcon}>🎤</span>
                                    <span>Do a 10-min targeted practice on pronunciation</span>
                                </Link>
                            </section>
                        </>
                    )}
                </div>
            </main>
        </AppLayout>
    );
}
