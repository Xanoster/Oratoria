'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import styles from './speak.module.css';
import RecordControl from '@/components/RecordControl';
import AppLayout from '@/components/AppLayout';
import PronunciationFeedbackModal, { PhonemeError, EvaluationResult } from '@/components/PronunciationFeedbackModal';
import { useTextToSpeech } from '@/lib/hooks/useSpeech';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Scenario {
    id: string;
    label: string;
    prompt: string;
    expectedResponse: string;
    level: string;
}

const SCENARIOS: Scenario[] = [
    {
        id: 'cafe',
        label: 'At a café',
        prompt: 'Order a coffee and a sandwich',
        expectedResponse: 'Ich hätte gerne einen Kaffee und ein Sandwich, bitte.',
        level: 'A1'
    },
    {
        id: 'train',
        label: 'Train station',
        prompt: 'Ask for a ticket to Munich',
        expectedResponse: 'Ich möchte eine Fahrkarte nach München, bitte.',
        level: 'A1'
    },
    {
        id: 'doctor',
        label: "Doctor's office",
        prompt: 'Describe how you feel',
        expectedResponse: 'Ich fühle mich nicht gut. Ich habe Kopfschmerzen.',
        level: 'A2'
    },
    {
        id: 'job',
        label: 'Job interview',
        prompt: 'Introduce yourself professionally',
        expectedResponse: 'Guten Tag, ich heiße Anna. Ich bin Softwareentwicklerin.',
        level: 'B1'
    },
];

// Track error attempts
interface ErrorTracker {
    [errorToken: string]: number;
}

export default function SpeakPage() {
    const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
    const [transcript, setTranscript] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const [phonemeErrors, setPhonemeErrors] = useState<PhonemeError[]>([]);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [errorTracker, setErrorTracker] = useState<ErrorTracker>({});
    const [suggestRepairDrill, setSuggestRepairDrill] = useState(false);
    const [suggestShorterTask, setSuggestShorterTask] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);
    const { speak } = useTextToSpeech();

    // Check for repeated errors (3+ times same error)
    useEffect(() => {
        const repeatedErrors = Object.entries(errorTracker).filter(([_, count]) => count >= 3);
        if (repeatedErrors.length > 0) {
            setSuggestRepairDrill(true);
        }
        if (attemptCount >= 5 && evaluation && evaluation.pronunciationScore < 60) {
            setSuggestShorterTask(true);
        }
    }, [errorTracker, attemptCount, evaluation]);

    async function handleTranscript(text: string) {
        setTranscript(text);
        setIsEvaluating(true);
        setAttemptCount(prev => prev + 1);

        // Call EvaluationEngine
        try {
            const res = await fetch(`${API_URL}/api/v1/evaluation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    userId: 'current-user',
                    transcript: text,
                    expectedText: selectedScenario.expectedResponse,
                    userLevel: selectedScenario.level,
                    mode: 'lesson',
                }),
            });

            if (res.ok) {
                const evalResult: EvaluationResult = await res.json();
                setEvaluation(evalResult);

                // Track errors for repeat detection
                const newErrorTracker = { ...errorTracker };
                evalResult.detectedErrors
                    .filter(e => e.type === 'pronunciation')
                    .forEach(e => {
                        newErrorTracker[e.token] = (newErrorTracker[e.token] || 0) + 1;
                    });
                setErrorTracker(newErrorTracker);

                // Extract phoneme errors
                const errors: PhonemeError[] = evalResult.detectedErrors
                    .filter(e => e.type === 'pronunciation')
                    .slice(0, 3)
                    .map(e => ({
                        word: e.token,
                        phoneme: '',
                        expected: e.expected,
                        actual: e.token,
                        tip: e.explanation,
                    }));
                setPhonemeErrors(errors);
            } else {
                // Fallback evaluation
                setEvaluation({
                    overallScore: 70,
                    pronunciationScore: 70,
                    grammarScore: 75,
                    fluencyScore: 70,
                    confidence: 0.8,
                    detectedErrors: [],
                });
            }
        } catch (error) {
            console.error('Evaluation failed:', error);
            setEvaluation({
                overallScore: 70,
                pronunciationScore: 70,
                grammarScore: 75,
                fluencyScore: 70,
                confidence: 0.8,
                detectedErrors: [],
            });
        } finally {
            setIsEvaluating(false);
        }
    }

    function handleTryAgain() {
        setTranscript('');
        setEvaluation(null);
        setPhonemeErrors([]);
    }

    function handleShowDetails() {
        setShowFeedbackModal(true);
    }

    function handleSwitchToRepairDrill() {
        // In production, navigate to repair drill
        const errorWord = Object.entries(errorTracker)
            .sort(([, a], [, b]) => b - a)[0]?.[0];
        console.log('Switch to repair drill for:', errorWord);
        // router.push(`/learn/repair?word=${errorWord}`);
    }

    function handleSwitchToShorterTask() {
        // Switch to an easier scenario
        const easierScenarios = SCENARIOS.filter(s => s.level === 'A1');
        if (easierScenarios.length > 0) {
            setSelectedScenario(easierScenarios[0]);
            handleTryAgain();
            setSuggestShorterTask(false);
            setAttemptCount(0);
        }
    }

    function getScoreIndicator(score: number): { color: string; label: string } {
        if (score >= 80) return { color: 'text-green-400', label: 'Good' };
        if (score >= 60) return { color: 'text-amber-400', label: 'Fair' };
        return { color: 'text-red-400', label: 'Needs work' };
    }

    return (
        <AppLayout>
            <main className={styles.main}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <Link href="/learn" className={styles.backLink}>← Back</Link>
                        <h1>Speaking Practice</h1>
                    </header>

                    {/* Repair Drill Suggestion */}
                    {suggestRepairDrill && (
                        <div className="mb-6 p-4 rounded-lg bg-purple-950/30 border border-purple-800/40">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-purple-200 mb-2">
                                        Same pronunciation issue detected 3+ times. A focused drill may help.
                                    </p>
                                    <button
                                        onClick={handleSwitchToRepairDrill}
                                        className="text-sm text-purple-400 hover:text-purple-300"
                                    >
                                        Switch to repair drill →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shorter Task Suggestion */}
                    {suggestShorterTask && !suggestRepairDrill && (
                        <div className="mb-6 p-4 rounded-lg bg-amber-950/30 border border-amber-800/40">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-amber-200 mb-2">
                                        This task may be challenging. Try a simpler scenario to build confidence.
                                    </p>
                                    <button
                                        onClick={handleSwitchToShorterTask}
                                        className="text-sm text-amber-400 hover:text-amber-300"
                                    >
                                        Switch to easier task →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scenario Picker */}
                    <div className={styles.scenarioPicker}>
                        <label htmlFor="scenario" className="label">Choose a scenario</label>
                        <select
                            id="scenario"
                            className="input"
                            value={selectedScenario.id}
                            onChange={(e) => {
                                setSelectedScenario(SCENARIOS.find(s => s.id === e.target.value)!);
                                handleTryAgain();
                                setErrorTracker({});
                                setAttemptCount(0);
                                setSuggestRepairDrill(false);
                                setSuggestShorterTask(false);
                            }}
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
                        <p className="text-sm text-slate-500 mt-4">
                            Say: "{selectedScenario.expectedResponse}"
                        </p>
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
                                {/* Transcript */}
                                <div className={styles.transcriptBox}>
                                    <div className={styles.transcriptLabel}>You said:</div>
                                    <p className={styles.transcriptText}>{transcript}</p>
                                </div>

                                {/* Evaluating State */}
                                {isEvaluating && (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin mr-3" />
                                        <span className="text-slate-400">Evaluating...</span>
                                    </div>
                                )}

                                {/* Micro-Feedback (Immediate) */}
                                {evaluation && !isEvaluating && (
                                    <>
                                        <div className="p-4 rounded-lg bg-[#0A0F1C] border border-[#1E293B] mb-4">
                                            {/* Quick Score Indicator */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm text-slate-400">Pronunciation</span>
                                                <span className={`text-sm font-medium ${getScoreIndicator(evaluation.pronunciationScore).color}`}>
                                                    {getScoreIndicator(evaluation.pronunciationScore).label}
                                                </span>
                                            </div>

                                            {/* Error Count */}
                                            {phonemeErrors.length > 0 ? (
                                                <p className="text-sm text-slate-400">
                                                    {phonemeErrors.length} word{phonemeErrors.length > 1 ? 's' : ''} to practice
                                                </p>
                                            ) : (
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <Check size={16} />
                                                    <span className="text-sm">Clear pronunciation</span>
                                                </div>
                                            )}

                                            {/* View Details Link */}
                                            {phonemeErrors.length > 0 && (
                                                <button
                                                    onClick={handleShowDetails}
                                                    className="mt-3 flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                                                >
                                                    Practice words
                                                    <ChevronDown size={14} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <button
                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[#1E293B] hover:bg-[#2D3B4F] text-slate-300 font-medium transition-colors"
                                                onClick={handleTryAgain}
                                            >
                                                <RefreshCw size={16} />
                                                Try again
                                            </button>
                                            <button
                                                className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                                                onClick={() => {
                                                    // Move to next scenario or complete
                                                    const currentIndex = SCENARIOS.findIndex(s => s.id === selectedScenario.id);
                                                    if (currentIndex < SCENARIOS.length - 1) {
                                                        setSelectedScenario(SCENARIOS[currentIndex + 1]);
                                                        handleTryAgain();
                                                        setErrorTracker({});
                                                    }
                                                }}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Attempt Counter */}
                    {attemptCount > 0 && (
                        <p className="text-center text-sm text-slate-500 mt-4">
                            Attempt {attemptCount}
                        </p>
                    )}
                </div>
            </main>

            {/* Pronunciation Feedback Modal */}
            {evaluation && (
                <PronunciationFeedbackModal
                    isOpen={showFeedbackModal}
                    onClose={() => setShowFeedbackModal(false)}
                    evaluationResult={evaluation}
                    phonemeErrors={phonemeErrors}
                    expectedText={selectedScenario.expectedResponse}
                    userTranscript={transcript}
                    onRetry={() => {
                        setShowFeedbackModal(false);
                        handleTryAgain();
                    }}
                    onContinue={() => setShowFeedbackModal(false)}
                    onSpeak={speak}
                />
            )}
        </AppLayout>
    );
}
