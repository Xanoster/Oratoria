'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './review.module.css';
import RecordControl from '@/components/RecordControl';
import AppLayout from '@/components/AppLayout';

interface ReviewItem {
    id: string;
    type: 'vocab' | 'grammar_pattern' | 'sentence';
    content: {
        question: string;
        answer: string;
        context?: string;
    };
}

type Judgment = 'again' | 'hard' | 'good';

export default function ReviewPage() {
    const [items, setItems] = useState<ReviewItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        async function fetchQueue() {
            try {
                const res = await fetch('/api/v1/srs/queue', {
                    credentials: 'include',
                });

                if (res.ok) {
                    const data = await res.json();
                    setItems(data.items || []);
                } else {
                    // Sample items for demo
                    setItems([
                        {
                            id: '1',
                            type: 'vocab',
                            content: { question: 'What is "bread" in German?', answer: 'das Brot' },
                        },
                        {
                            id: '2',
                            type: 'grammar_pattern',
                            content: { question: 'Complete: Ich ___ (gehen) nach Hause.', answer: 'gehe' },
                        },
                        {
                            id: '3',
                            type: 'sentence',
                            content: { question: 'Translate: "I am learning German."', answer: 'Ich lerne Deutsch.' },
                        },
                    ]);
                }
            } catch (error) {
                console.error('Failed to fetch queue:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchQueue();
    }, []);

    async function handleJudgment(judgment: Judgment) {
        const item = items[currentIndex];

        try {
            await fetch('/api/v1/srs/response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ itemId: item.id, judgment }),
            });
        } catch (error) {
            console.error('Failed to submit response:', error);
        }

        // Move to next item
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
            setUserAnswer('');
        } else {
            setCompleted(true);
        }
    }

    function handleAnswer() {
        setShowAnswer(true);
    }

    function handleTranscript(transcript: string) {
        setUserAnswer(transcript);
        setShowAnswer(true);
    }

    if (loading) {
        return (
            <AppLayout>
                <main className={styles.main}>
                    <div className={styles.loading}>Loading reviews...</div>
                </main>
            </AppLayout>
        );
    }

    if (items.length === 0) {
        return (
            <AppLayout>
                <main className={styles.main}>
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>✨</div>
                        <h1>All caught up!</h1>
                        <p className="text-muted">No items due for review right now.</p>
                        <Link href="/learn" className="btn btn-primary mt-6">
                            Back to learning
                        </Link>
                    </div>
                </main>
            </AppLayout>
        );
    }

    if (completed) {
        return (
            <AppLayout>
                <main className={styles.main}>
                    <div className={styles.complete}>
                        <div className={styles.completeIcon}>🎉</div>
                        <h1>Review Complete!</h1>
                        <p className="text-muted">You reviewed {items.length} items.</p>
                        <Link href="/learn" className="btn btn-primary btn-lg mt-6">
                            Continue learning
                        </Link>
                    </div>
                </main>
            </AppLayout>
        );
    }

    const item = items[currentIndex];

    return (
        <AppLayout>
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Header */}
                    <header className={styles.header}>
                        <Link href="/learn" className={styles.backLink}>← Back</Link>
                        <div className={styles.progress}>
                            {currentIndex + 1} / {items.length}
                        </div>
                    </header>

                    {/* Card */}
                    <div className={styles.card}>
                        <div className={styles.cardType}>{item.type.replace('_', ' ')}</div>

                        <div className={styles.question}>
                            {item.content.question}
                        </div>

                        {!showAnswer ? (
                            <div className={styles.answerArea}>
                                <div className={styles.inputRow}>
                                    <input
                                        type="text"
                                        className="input"
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        placeholder="Type your answer..."
                                        onKeyDown={(e) => e.key === 'Enter' && handleAnswer()}
                                    />
                                </div>

                                <div className={styles.orDivider}>or</div>

                                <RecordControl
                                    id="review-speak"
                                    onTranscript={handleTranscript}
                                    ariaLabel="Speak your answer"
                                />

                                <div className={styles.actionRow}>
                                    <button className="btn btn-primary" onClick={handleAnswer}>
                                        Answer
                                    </button>
                                    <button className={styles.skipBtn} onClick={() => handleJudgment('again')}>
                                        Skip
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.resultArea}>
                                <div className={styles.correctAnswer}>
                                    <span className={styles.answerLabel}>Correct answer:</span>
                                    <span className={styles.answerText}>{item.content.answer}</span>
                                </div>

                                {userAnswer && (
                                    <div className={styles.userAnswer}>
                                        <span className={styles.answerLabel}>Your answer:</span>
                                        <span className={styles.answerText}>{userAnswer}</span>
                                    </div>
                                )}

                                <div className={styles.judgmentRow}>
                                    <button
                                        className={`${styles.judgmentBtn} ${styles.again}`}
                                        onClick={() => handleJudgment('again')}
                                    >
                                        Again
                                    </button>
                                    <button
                                        className={`${styles.judgmentBtn} ${styles.hard}`}
                                        onClick={() => handleJudgment('hard')}
                                    >
                                        Hard
                                    </button>
                                    <button
                                        className={`${styles.judgmentBtn} ${styles.good}`}
                                        onClick={() => handleJudgment('good')}
                                    >
                                        Good
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
