'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Volume2, ChevronDown } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import styles from './lesson.module.css';
import RecordControl from '@/components/RecordControl';
import PronunciationFeedbackModal, { PhonemeError } from '@/components/PronunciationFeedbackModal';
import { useTextToSpeech } from '@/lib/hooks/useSpeech';

interface LessonContent {
    dialogue: Array<{ speaker: string; text: string; translation: string }>;
    pronunciationDrill: Array<{ word: string; phonetic: string; tip: string }>;
    grammarNote: { rule: string; examples: string[] };
    quiz: Array<{ type: string; question: string; answer: string; options?: string[] }>;
}

interface EvaluationResult {
    overallScore: number;
    pronunciationScore: number;
    grammarScore: number;
    fluencyScore: number;
    confidence: number;
    detectedErrors: Array<{
        type: 'pronunciation' | 'grammar' | 'fluency';
        token: string;
        expected: string;
        explanation: string;
    }>;
}

type LessonPhase = 'intro' | 'pronunciation' | 'grammar' | 'speak' | 'quiz' | 'complete';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function LessonPage() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params.lessonId as string;

    const [phase, setPhase] = useState<LessonPhase>('intro');
    const [content, setContent] = useState<LessonContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [showGrammar, setShowGrammar] = useState(false); // Collapsed by default
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizAnswer, setQuizAnswer] = useState('');
    const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null);
    const { speak } = useTextToSpeech();

    // AI Evaluation State
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [userTranscript, setUserTranscript] = useState('');
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [userErrors, setUserErrors] = useState<string[]>([]);
    const [phonemeErrors, setPhonemeErrors] = useState<PhonemeError[]>([]);

    useEffect(() => {
        async function fetchLesson() {
            try {
                const res = await fetch(`${API_URL}/api/v1/lessons/${lessonId}/content`, {
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

    // Set speaking prompt based on user errors (adaptive)
    useEffect(() => {
        if (phase === 'speak' && content) {
            // If user has pronunciation errors, focus on those words
            if (userErrors.length > 0) {
                const errorWord = userErrors[0];
                setCurrentPrompt(`Practice saying: "${errorWord}"`);
            } else {
                // Default prompt
                setCurrentPrompt('Guten Tag! Wie geht es Ihnen?');
            }
        }
    }, [phase, content, userErrors]);

    function handlePronunciationComplete() {
        setPhase('grammar');
    }

    async function handleSpeakComplete(transcript: string) {
        setUserTranscript(transcript);

        // Call EvaluationEngine
        try {
            const res = await fetch(`${API_URL}/api/v1/evaluation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    userId: 'current-user',
                    transcript,
                    expectedText: currentPrompt.replace(/^Practice saying: "(.+)"$/, '$1').replace(/"/g, ''),
                    userLevel: 'A1',
                    mode: 'lesson',
                }),
            });

            if (res.ok) {
                const evalResult = await res.json();
                setEvaluation(evalResult);

                // Track errors for adaptive prompts
                const newErrors = evalResult.detectedErrors
                    .filter((e: any) => e.type === 'pronunciation')
                    .map((e: any) => e.token);
                setUserErrors(prev => [...new Set([...prev, ...newErrors])]);

                // Extract phoneme errors with tips from drill content
                const extractedPhonemeErrors: PhonemeError[] = evalResult.detectedErrors
                    .filter((e: any) => e.type === 'pronunciation')
                    .slice(0, 3) // Focus on 2-3 max
                    .map((e: any) => {
                        // Try to find matching drill for phonetic info
                        const drill = content?.pronunciationDrill.find(
                            d => d.word.toLowerCase() === e.token.toLowerCase()
                        );
                        return {
                            word: e.token,
                            phoneme: drill?.phonetic || '',
                            expected: e.expected || e.token,
                            actual: e.token,
                            tip: drill?.tip || e.explanation || 'Practice this word.',
                        };
                    });
                setPhonemeErrors(extractedPhonemeErrors);

                // Show feedback modal
                setShowFeedbackModal(true);
            } else {
                // Fallback - proceed without evaluation
                setPhase('quiz');
            }
        } catch (error) {
            console.error('Evaluation failed:', error);
            setPhase('quiz');
        }
    }

    function handleRetry() {
        setShowFeedbackModal(false);
        setRetryCount(prev => prev + 1);
        setUserTranscript('');
        setEvaluation(null);
    }

    function handleContinueAfterSpeaking() {
        setShowFeedbackModal(false);
        setPhase('quiz');
    }

    function handlePracticeError(errorToken: string) {
        // Speak the word for the user to hear
        speak(errorToken);
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
            <AppLayout>
                <div className={styles.main}>
                    <div className={styles.loading}>Loading lesson...</div>
                </div>
            </AppLayout>
        );
    }

    if (!content) {
        return (
            <AppLayout>
                <div className={styles.main}>
                    <div className={styles.error}>
                        <h2>Lesson not found</h2>
                        <Link href="/learn" className="btn btn-primary">
                            Back to learning
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className={styles.main}>
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
                                            <div className="text-gray-500 text-sm mb-4">{drill.tip}</div>
                                            <button
                                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:border-emerald-500/50 hover:text-emerald-600 rounded-lg text-sm text-gray-600 transition-all font-medium"
                                                onClick={() => speak(drill.word)}
                                            >
                                                <Volume2 className="h-4 w-4" />
                                                Listen
                                            </button>
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

                        {/* Grammar Phase - Collapsed by Default */}
                        {phase === 'grammar' && (
                            <section className={styles.section}>
                                <h2>Grammar Note</h2>

                                {/* Collapsible Grammar */}
                                <button
                                    onClick={() => setShowGrammar(!showGrammar)}
                                    className="w-full flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200 text-left mb-4"
                                >
                                    <span className="text-gray-600">{content.grammarNote.rule}</span>
                                    <ChevronDown
                                        size={18}
                                        className={`text-gray-500 transition-transform ${showGrammar ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {showGrammar && (
                                    <div className={styles.grammarCard}>
                                        <div className={styles.grammarExamples}>
                                            {content.grammarNote.examples.map((ex, i) => (
                                                <div key={i} className={styles.grammarExample}>{ex}</div>
                                            ))}
                                        </div>
                                        <div className={styles.grammarDetail}>
                                            <p>
                                                In German, "Sie" (formal you) is always capitalized to distinguish it from
                                                "sie" (she/they). It takes the same verb forms as "sie" (they) - third person plural.
                                            </p>
                                        </div>
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

                        {/* Speak Phase - With AI Evaluation */}
                        {phase === 'speak' && (
                            <section className={styles.section}>
                                <h2>Speaking Task</h2>
                                <p className="text-muted mb-6">
                                    {userErrors.length > 0
                                        ? 'Practice this word based on previous errors:'
                                        : 'Practice greeting someone formally. Say the phrase below:'
                                    }
                                </p>

                                <div className={styles.speakPrompt}>
                                    "{currentPrompt}"
                                </div>

                                {retryCount > 0 && (
                                    <p className="text-sm text-amber-400 mb-4">
                                        Attempt {retryCount + 1}
                                    </p>
                                )}

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
                                                {quizResult === 'correct' ? 'Correct' : `Answer: ${content.quiz[quizIndex].answer}`}
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
                                    <h2>Lesson Complete</h2>
                                    <p className="text-muted mb-6">
                                        You've practiced greetings and formal speech.
                                    </p>

                                    {userErrors.length > 0 && (
                                        <div className="mb-6 p-4 rounded-lg bg-amber-950/30 border border-amber-800/40">
                                            <p className="text-sm text-amber-200 mb-2">
                                                Words to review: {userErrors.slice(0, 3).join(', ')}
                                            </p>
                                            <button
                                                className="text-sm text-amber-400 hover:text-amber-300"
                                                onClick={() => router.push('/review')}
                                            >
                                                Practice these →
                                            </button>
                                        </div>
                                    )}

                                    <div className={styles.completeActions}>
                                        <Link href="/learn" className="btn btn-primary btn-lg">
                                            Finish
                                        </Link>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* Pronunciation Feedback Modal */}
            {evaluation && (
                <PronunciationFeedbackModal
                    isOpen={showFeedbackModal}
                    onClose={() => setShowFeedbackModal(false)}
                    evaluationResult={evaluation}
                    phonemeErrors={phonemeErrors}
                    expectedText={currentPrompt.replace(/^Practice saying: "(.+)"$/, '$1').replace(/"/g, '')}
                    userTranscript={userTranscript}
                    onRetry={handleRetry}
                    onContinue={handleContinueAfterSpeaking}
                    onSpeak={speak}
                />
            )}
        </AppLayout>
    );
}
