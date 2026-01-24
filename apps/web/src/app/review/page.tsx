'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { Mic, MicOff, Volume2, Lightbulb, WifiOff, CheckCircle } from 'lucide-react';
import { useRecordControl } from '@/lib/hooks/useRecordControl';
import { useTextToSpeech } from '@/lib/hooks/useSpeech';
import PronunciationFeedbackModal from '@/components/PronunciationFeedbackModal';

interface ReviewItem {
    id: string;
    type: string;
    content: {
        question: string;
        answer: string;
        context?: string;
        phoneme?: string;
        tip?: string;
    };
    dueAt: string;
    failureCount: number;
    explanation: string | null;
    requiresSpoken: boolean;
}

interface CachedReview {
    items: ReviewItem[];
    responses: Record<string, {
        itemId: string;
        score: number;
        timestamp: number;
    }>;
    lastSync: number;
    pendingSync: Array<{
        itemId: string;
        score: number;
        timestamp: number;
    }>;
}

const CACHE_KEY = 'oratoria_review_cache';

export default function ReviewPage() {
    const [items, setItems] = useState<ReviewItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [userAnswer, setUserAnswer] = useState('');
    const [showAnswer, setShowAnswer] = useState(false);
    const [evaluationScore, setEvaluationScore] = useState<number | null>(null);
    const [showPronunciationModal, setShowPronunciationModal] = useState(false);
    const [pronunciationErrors, setPronunciationErrors] = useState<any[]>([]);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    const {
        state: recordState,
        transcript,
        startRecording,
        stopRecording
    } = useRecordControl({
        maxMs: 60000,
        silenceTimeoutMs: 2500,
        onTranscript: async (text) => {
            if (text.trim()) {
                setUserAnswer(text.trim());
                await evaluateAnswer(text.trim());
            }
        },
    });

    const { speak, isSpeaking } = useTextToSpeech();

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncPendingResponses();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Load queue with offline caching
    useEffect(() => {
        async function fetchQueue() {
            try {
                // Try to fetch from API
                if (isOnline) {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srs/queue?userId=current-user`);

                    if (res.ok) {
                        const data = await res.json();
                        setItems(data.items || []);

                        // Cache the queue
                        const cache: CachedReview = {
                            items: data.items || [],
                            responses: {},
                            lastSync: Date.now(),
                            pendingSync: [],
                        };
                        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
                    } else {
                        loadFromCache();
                    }
                } else {
                    loadFromCache();
                }
            } catch (error) {
                console.error('Failed to fetch queue:', error);
                loadFromCache();
            } finally {
                setLoading(false);
            }
        }

        fetchQueue();
    }, [isOnline]);

    function loadFromCache() {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const data: CachedReview = JSON.parse(cached);
                setItems(data.items);
                setPendingSyncCount(data.pendingSync.length);
            } catch (error) {
                console.error('Failed to load cache:', error);
            }
        }
    }

    async function syncPendingResponses() {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return;

        try {
            const data: CachedReview = JSON.parse(cached);

            if (data.pendingSync.length === 0) return;

            // Sync all pending responses
            for (const response of data.pendingSync) {
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srs/response`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: 'current-user',
                            itemId: response.itemId,
                            judgment: 'again', // Will be auto-determined from score
                            score: response.score,
                        }),
                    });
                } catch (error) {
                    console.error('Failed to sync response:', error);
                }
            }

            // Clear pending sync
            data.pendingSync = [];
            data.lastSync = Date.now();
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            setPendingSyncCount(0);

        } catch (error) {
            console.error('Sync failed:', error);
        }
    }

    async function evaluateAnswer(answer: string) {
        const item = items[currentIndex];

        // Always try AI evaluation if online
        if (isOnline) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: 'current-user',
                        transcript: answer,
                        expectedText: item.content.answer,
                        userLevel: 'A1',
                        mode: 'lesson',
                    }),
                });

                if (res.ok) {
                    const evaluation = await res.json();

                    // For text answers, prioritize grammar score if available, else overall
                    const score = item.requiresSpoken ? evaluation.pronunciationScore : evaluation.grammarScore || evaluation.overallScore;
                    setEvaluationScore(score);

                    // Extract errors (pronunciation OR grammar)
                    const errors = (evaluation.detectedErrors || [])
                        .map((e: any) => ({
                            word: e.token || e.word, // Handle both formats
                            expected: e.expected,
                            phoneme: e.phoneme,
                            tip: e.explanation,
                            type: e.type
                        }));

                    // Only show modal for spoken/pronunciation errors
                    const spokenErrors = errors.filter((e: any) => e.type === 'pronunciation');
                    setPronunciationErrors(spokenErrors);

                    if (spokenErrors.length > 0 && evaluation.pronunciationScore < 70 && (item.requiresSpoken || item.type === 'pronunciation')) {
                        setShowPronunciationModal(true);
                    }

                    setShowAnswer(true);
                } else {
                    // Fallback to local check on API failure
                    const score = compareAnswers(answer, item.content.answer);
                    setEvaluationScore(score);
                    setShowAnswer(true);
                }
            } catch (error) {
                console.error('Evaluation error:', error);
                const score = compareAnswers(answer, item.content.answer);
                setEvaluationScore(score);
                setShowAnswer(true);
            }
        } else {
            // Offline fallback: simple comparison
            const score = compareAnswers(answer, item.content.answer);
            setEvaluationScore(score);
            setShowAnswer(true);
        }
    }

    function compareAnswers(userAnswer: string, correctAnswer: string): number {
        const normalized = (s: string) => s.toLowerCase().trim().replace(/[.,!?]/g, '');
        const user = normalized(userAnswer);
        const correct = normalized(correctAnswer);

        if (user === correct) return 100;

        // Simple similarity check
        const words1 = user.split(/\s+/);
        const words2 = correct.split(/\s+/);
        const matches = words1.filter(w => words2.includes(w)).length;
        const total = Math.max(words1.length, words2.length);

        return Math.round((matches / total) * 100);
    }

    async function submitResponse() {
        if (evaluationScore === null) return;

        const item = items[currentIndex];

        // Save response locally
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const data: CachedReview = JSON.parse(cached);
            data.responses[item.id] = {
                itemId: item.id,
                score: evaluationScore,
                timestamp: Date.now(),
            };

            // If offline, add to pending sync
            if (!isOnline) {
                data.pendingSync.push({
                    itemId: item.id,
                    score: evaluationScore,
                    timestamp: Date.now(),
                });
                setPendingSyncCount(data.pendingSync.length);
            }

            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        }

        // If online, sync immediately
        if (isOnline) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/srs/response`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: 'current-user',
                        itemId: item.id,
                        judgment: 'again', // Auto-determined from score
                        score: evaluationScore,
                    }),
                });
            } catch (error) {
                console.error('Failed to submit response:', error);
            }
        }

        // Move to next item
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
            setUserAnswer('');
            setEvaluationScore(null);
            setPronunciationErrors([]);
        } else {
            setCompleted(true);
        }
    }

    const isListening = recordState === 'recording';
    const item = items[currentIndex];

    if (loading) {
        return (
            <AppLayout>
                <main className="min-h-screen flex items-center justify-center">
                    <div className="text-slate-400">Loading reviews...</div>
                </main>
            </AppLayout>
        );
    }

    if (items.length === 0) {
        return (
            <AppLayout>
                <main className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">✨</div>
                        <h1 className="text-2xl font-bold text-white mb-2">All caught up!</h1>
                        <p className="text-slate-400 mb-6">No items due for review right now.</p>
                        <Link href="/learn" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all">
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
                <main className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h1 className="text-2xl font-bold text-white mb-2">Review Complete!</h1>
                        <p className="text-slate-400 mb-2">You reviewed {items.length} items.</p>
                        {pendingSyncCount > 0 && (
                            <p className="text-amber-400 text-sm mb-6">📡 {pendingSyncCount} responses will sync when online</p>
                        )}
                        <Link href="/learn" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all">
                            Continue learning
                        </Link>
                    </div>
                </main>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {showPronunciationModal && pronunciationErrors.length > 0 && (
                <PronunciationFeedbackModal
                    errors={pronunciationErrors}
                    onClose={() => setShowPronunciationModal(false)}
                    onContinue={() => {
                        setShowPronunciationModal(false);
                        submitResponse();
                    }}
                />
            )}

            <main className="min-h-screen p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-6">
                        <Link href="/learn" className="text-slate-400 hover:text-white transition-all">
                            ← Back
                        </Link>
                        <div className="flex items-center gap-4">
                            {!isOnline && (
                                <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-900/20 px-3 py-1 rounded-lg border border-amber-600/30">
                                    <WifiOff className="h-4 w-4" />
                                    Offline ({pendingSyncCount} pending)
                                </div>
                            )}
                            <div className="text-slate-400 text-sm">
                                {currentIndex + 1} / {items.length}
                            </div>
                        </div>
                    </header>

                    {/* Progress bar */}
                    <div className="mb-6">
                        <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all"
                                style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Card */}
                    <div className="bg-[#0F1729] border border-[#1E293B] rounded-2xl p-8">
                        {/* Type badge */}
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-xs px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                {item.type.replace('_', ' ')}
                            </span>
                            {item.failureCount >= 2 && (
                                <span className="text-xs px-3 py-1 rounded-full bg-amber-600/20 text-amber-400 border border-amber-600/30">
                                    ⚠️ {item.failureCount} failures
                                </span>
                            )}
                        </div>

                        {/* Question */}
                        <div className="text-xl text-white mb-8 font-medium">
                            {item.content.question}
                        </div>

                        {!showAnswer ? (
                            <div className="space-y-4">
                                {/* Mic-first interface */}
                                <div className="flex flex-col items-center gap-4">
                                    <button
                                        onClick={() => isListening ? stopRecording() : startRecording()}
                                        disabled={loading}
                                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isListening
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 scale-110'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                                            }`}
                                    >
                                        {isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                                    </button>
                                    <p className="text-sm text-slate-400">
                                        {isListening ? 'Listening...' : item.requiresSpoken ? 'Speak your answer' : 'Tap to speak'}
                                    </p>
                                </div>

                                {/* Text input as fallback */}
                                {!item.requiresSpoken && (
                                    <>
                                        <div className="text-center text-xs text-slate-500">or type</div>
                                        <input
                                            type="text"
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && userAnswer.trim() && evaluateAnswer(userAnswer)}
                                            placeholder="Type your answer"
                                            className="w-full bg-[#1E293B] border border-[#2D3B4F] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600"
                                            disabled={isListening}
                                        />
                                    </>
                                )}

                                {userAnswer && !isListening && (
                                    <button
                                        onClick={() => evaluateAnswer(userAnswer)}
                                        className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition-all"
                                    >
                                        Check Answer
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Correct answer */}
                                <div>
                                    <div className="text-sm text-slate-400 mb-2">Correct answer:</div>
                                    <div className="text-lg text-green-400 font-medium flex items-center gap-2">
                                        {item.content.answer}
                                        <button
                                            onClick={() => speak(item.content.answer)}
                                            className="text-slate-400 hover:text-white transition-all"
                                            disabled={isSpeaking}
                                        >
                                            <Volume2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* User answer */}
                                {userAnswer && (
                                    <div>
                                        <div className="text-sm text-slate-400 mb-2">Your answer:</div>
                                        <div className="text-lg text-white">{userAnswer}</div>
                                    </div>
                                )}

                                {/* Score */}
                                {evaluationScore !== null && (
                                    <div className={`text-center p-4 rounded-lg ${evaluationScore >= 80 ? 'bg-green-900/20 border border-green-600/30' :
                                        evaluationScore >= 60 ? 'bg-amber-900/20 border border-amber-600/30' :
                                            'bg-red-900/20 border border-red-600/30'
                                        }`}>
                                        <div className="text-3xl font-bold mb-1">
                                            {evaluationScore >= 80 ? '😊' : evaluationScore >= 60 ? '😐' : '😓'}
                                        </div>
                                        <div className="text-sm">
                                            {evaluationScore >= 80 ? 'Good' : evaluationScore >= 60 ? 'Fair' : 'Needs work'} ({evaluationScore}%)
                                        </div>
                                    </div>
                                )}

                                {/* Explanation (shown after 2+ failures) */}
                                {item.failureCount >= 2 && item.explanation && (
                                    <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                                        <div className="flex items-start gap-2">
                                            <Lightbulb className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-sm font-medium text-blue-400 mb-1">Explanation</div>
                                                <div className="text-sm text-slate-300">{item.explanation}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={showPronunciationModal ? () => { } : submitResponse}
                                    className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition-all"
                                >
                                    {showPronunciationModal ? 'Practice pronunciations first' : 'Continue'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
