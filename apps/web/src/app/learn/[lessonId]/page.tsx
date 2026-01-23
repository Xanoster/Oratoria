'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './lesson.module.css';
import RecordControl from '@/components/RecordControl';
import AudioPlayer from '@/components/AudioPlayer';

interface LessonContent {
    dialogue: Array<{ speaker: string; text: string; translation: string }>;
    pronunciationDrill: Array<{ word: string; phonetic: string; tip: string }>;
    grammarNote: { rule: string; examples: string[] };
    quiz: Array<{ type: string; question: string; answer: string; options?: string[] }>;
}

type LessonPhase = 'intro' | 'pronunciation' | 'grammar' | 'speak' | 'quiz' | 'complete';

export default function LessonPage() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params.lessonId as string;

    const [phase, setPhase] = useState<LessonPhase>('intro');
    const [content, setContent] = useState<LessonContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [showGrammar, setShowGrammar] = useState(false);
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizAnswer, setQuizAnswer] = useState('');
    const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null);

    useEffect(() => {
        async function fetchLesson() {
            try {
                const res = await fetch(`/api/v1/lessons/${lessonId}/content`, {
                    credentials: 'include',
                });

                if (res.ok) {
                    const data = await res.json();
                    setContent(data);
                } else {
                    // Use fallback content
                    setContent({
                        dialogue: [
                            { speaker: 'Anna', text: 'Guten Tag! Wie geht es Ihnen?', translation: 'Good day! How are you?' },
                            { speaker: 'Max', text: 'Mir geht es gut, danke. Und Ihnen?', translation: "I'm fine, thank you. And you?" },
                            { speaker: 'Anna', text: 'Auch gut, danke!', translation: 'Also good, thanks!' },
                        ],
                        pronunciationDrill: [
                            { word: 'Guten', phonetic: '/ˈɡuːtn/', tip: 'Long "u" sound, like "oo" in mood' },
                            { word: 'geht', phonetic: '/ɡeːt/', tip: 'Long "e" sound, lips slightly spread' },
                            { word: 'danke', phonetic: '/ˈdaŋkə/', tip: 'Final "e" is a schwa sound' },
                        ],
                        grammarNote: {
                            rule: 'Formal "Sie" is capitalized and uses third person plural verb forms.',
                            examples: ['Wie heißen Sie?', 'Woher kommen Sie?'],
                        },
                        quiz: [
                            { type: 'cloze', question: 'Wie ___ es Ihnen?', answer: 'geht' },
                            { type: 'mcq', question: 'How do you say "thank you"?', answer: 'Danke', options: ['Bitte', 'Danke', 'Hallo'] },
                        ],
                    });
                }
            } catch (error) {
                console.error('Failed to fetch lesson:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchLesson();
    }, [lessonId]);

    function handlePronunciationComplete() {
        setPhase('grammar');
    }

    function handleSpeakComplete(transcript: string) {
        // Submit for analysis
        console.log('User spoke:', transcript);
        setPhase('quiz');
    }

    function handleQuizSubmit() {
        if (!content) return;

        const currentQuiz = content.quiz[quizIndex];
        const isCorrect = quizAnswer.toLowerCase().trim() === currentQuiz.answer.toLowerCase();

        setQuizResult(isCorrect ? 'correct' : 'incorrect');

        setTimeout(() => {
            if (quizIndex < content.quiz.length - 1) {
                setQuizIndex(quizIndex + 1);
                setQuizAnswer('');
                setQuizResult(null);
            } else {
                setPhase('complete');
            }
        }, 1500);
    }

    if (loading) {
        return (
            <main className={styles.main}>
                <div className={styles.loading}>Loading lesson...</div>
            </main>
        );
    }

    if (!content) {
        return (
            <main className={styles.main}>
                <div className={styles.error}>
                    <h2>Lesson not found</h2>
                    <Link href="/learn" className="btn btn-primary">
                        Back to learning
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <Link href="/learn" className={styles.backLink}>← Back</Link>
                    <div className={styles.phaseIndicator}>
                        {['intro', 'pronunciation', 'grammar', 'speak', 'quiz'].map((p, i) => (
                            <div
                                key={p}
                                className={`${styles.phaseDot} ${['intro', 'pronunciation', 'grammar', 'speak', 'quiz'].indexOf(phase) >= i
                                        ? styles.active
                                        : ''
                                    }`}
                            />
                        ))}
                    </div>
                </header>

                {/* Content Area */}
                <div className={styles.content}>
                    {/* Intro Phase */}
                    {phase === 'intro' && (
                        <section className={styles.section}>
                            <h1>Greetings & Introductions</h1>
                            <span className={styles.levelBadge}>A1</span>

                            <p className={styles.intro}>
                                Learn how to greet people formally in German and ask how they are.
                            </p>

                            <div className={styles.dialogue}>
                                {content.dialogue.map((line, i) => (
                                    <div key={i} className={styles.dialogueLine}>
                                        <div className={styles.speaker}>{line.speaker}</div>
                                        <div className={styles.text}>{line.text}</div>
                                        <div className={styles.translation}>{line.translation}</div>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => setPhase('pronunciation')}
                                style={{ width: '100%' }}
                            >
                                Continue to pronunciation
                            </button>
                        </section>
                    )}

                    {/* Pronunciation Phase */}
                    {phase === 'pronunciation' && (
                        <section className={styles.section}>
                            <h2>Pronunciation Drill</h2>
                            <p className="text-muted mb-6">Listen, then practice each word.</p>

                            <div className={styles.drillList}>
                                {content.pronunciationDrill.map((drill, i) => (
                                    <div key={i} className={styles.drillItem}>
                                        <div className={styles.drillWord}>{drill.word}</div>
                                        <div className={styles.drillPhonetic}>{drill.phonetic}</div>
                                        <div className={styles.drillTip}>{drill.tip}</div>
                                        <button className={styles.playBtn}>🔊 Listen</button>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handlePronunciationComplete}
                                style={{ width: '100%' }}
                            >
                                Continue
                            </button>
                        </section>
                    )}

                    {/* Grammar Phase */}
                    {phase === 'grammar' && (
                        <section className={styles.section}>
                            <h2>Grammar Note</h2>

                            <div className={styles.grammarCard}>
                                <p className={styles.grammarRule}>{content.grammarNote.rule}</p>
                                <div className={styles.grammarExamples}>
                                    {content.grammarNote.examples.map((ex, i) => (
                                        <div key={i} className={styles.grammarExample}>{ex}</div>
                                    ))}
                                </div>
                            </div>

                            <button
                                className={styles.explainBtn}
                                onClick={() => setShowGrammar(!showGrammar)}
                            >
                                {showGrammar ? 'Hide' : 'Explain'} rule
                            </button>

                            {showGrammar && (
                                <div className={styles.grammarDetail}>
                                    <p>
                                        In German, "Sie" (formal you) is always capitalized to distinguish it from
                                        "sie" (she/they). It takes the same verb forms as "sie" (they) - third person plural.
                                    </p>
                                </div>
                            )}

                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => setPhase('speak')}
                                style={{ width: '100%', marginTop: 'var(--spacing-6)' }}
                            >
                                Practice speaking
                            </button>
                        </section>
                    )}

                    {/* Speak Phase */}
                    {phase === 'speak' && (
                        <section className={styles.section}>
                            <h2>Speaking Task</h2>
                            <p className="text-muted mb-6">
                                Practice greeting someone formally. Say the phrase below:
                            </p>

                            <div className={styles.speakPrompt}>
                                "Guten Tag! Wie geht es Ihnen?"
                            </div>

                            <div className={styles.recordContainer}>
                                <RecordControl
                                    id="lesson-speak"
                                    onTranscript={handleSpeakComplete}
                                    ariaLabel="Speak the phrase"
                                />
                            </div>

                            <button
                                className={styles.skipLink}
                                onClick={() => setPhase('quiz')}
                            >
                                Skip
                            </button>
                        </section>
                    )}

                    {/* Quiz Phase */}
                    {phase === 'quiz' && (
                        <section className={styles.section}>
                            <h2>Quick Quiz</h2>

                            {content.quiz[quizIndex] && (
                                <div className={styles.quizCard}>
                                    <p className={styles.quizQuestion}>
                                        {content.quiz[quizIndex].question}
                                    </p>

                                    {content.quiz[quizIndex].type === 'cloze' ? (
                                        <input
                                            type="text"
                                            className={`input ${quizResult === 'incorrect' ? 'input-error' : ''}`}
                                            value={quizAnswer}
                                            onChange={(e) => setQuizAnswer(e.target.value)}
                                            placeholder="Type your answer"
                                            disabled={quizResult !== null}
                                        />
                                    ) : (
                                        <div className={styles.mcqOptions}>
                                            {content.quiz[quizIndex].options?.map((option) => (
                                                <button
                                                    key={option}
                                                    className={`${styles.mcqOption} ${quizAnswer === option ? styles.selected : ''
                                                        } ${quizResult && option === content.quiz[quizIndex].answer
                                                            ? styles.correct
                                                            : ''
                                                        }`}
                                                    onClick={() => setQuizAnswer(option)}
                                                    disabled={quizResult !== null}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {quizResult && (
                                        <div className={`${styles.quizFeedback} ${styles[quizResult]}`}>
                                            {quizResult === 'correct' ? '✓ Correct!' : `✗ The answer is: ${content.quiz[quizIndex].answer}`}
                                        </div>
                                    )}

                                    {!quizResult && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleQuizSubmit}
                                            disabled={!quizAnswer}
                                            style={{ width: '100%', marginTop: 'var(--spacing-4)' }}
                                        >
                                            Answer
                                        </button>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Complete Phase */}
                    {phase === 'complete' && (
                        <section className={styles.section}>
                            <div className={styles.complete}>
                                <div className={styles.completeIcon}>🎉</div>
                                <h2>Lesson Complete!</h2>
                                <p className="text-muted mb-6">
                                    Great work! You've practiced greetings and formal speech.
                                </p>

                                <div className={styles.completeActions}>
                                    <Link href="/learn" className="btn btn-primary btn-lg">
                                        Finish session
                                    </Link>
                                    <button className="btn btn-secondary">
                                        Practice top error
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
