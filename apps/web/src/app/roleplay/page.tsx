'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { Mic, MicOff, Volume2, ArrowLeft, Lightbulb, Pause, Play, ChevronDown, ChevronUp, Languages } from 'lucide-react';
import { useRecordControl } from '@/lib/hooks/useRecordControl';
import { useTextToSpeech } from '@/lib/hooks/useSpeech';

interface Scenario {
    id: string;
    title: string;
    context: string;
    level: string;
    userRole: string;
    aiRole: string;
}

interface Correction {
    error: string;
    correction: string;
    explanation: string;
}

interface Turn {
    id: string;
    turnNumber: number;
    userMessage: string | null;
    aiResponse: string;
    aiTranslation: string | null;
    corrections: Correction[];
    hintRequested: boolean;
    hintGiven: string | null;
}

interface Session {
    id: string;
    scenarioId: string;
    scenario: {
        title: string;
        context: string;
        userRole: string;
        aiRole: string;
    };
    userLevel: string;
    status: string;
    hintsUsed: number;
    totalErrors: number;
    turns: Turn[];
}

interface CoachingData {
    totalErrors: number;
    errorsByType: Record<string, { count: number; examples: string[] }>;
    practicePhrase: string;
    recommendations: string[];
}

function CoachingModal({
    coaching,
    onResume,
    onClose
}: {
    coaching: CoachingData;
    onResume: () => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0F1729] border border-[#1E293B] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <h2 className="text-2xl font-bold text-white mb-2">📚 Coaching Session</h2>
                <p className="text-slate-400 mb-6">Let's review your patterns and improve</p>

                {/* Total Errors */}
                <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-4 mb-6">
                    <div className="text-amber-400 text-sm font-medium">Total errors so far</div>
                    <div className="text-3xl font-bold text-amber-300">{coaching.totalErrors}</div>
                </div>

                {/* Error Breakdown */}
                {Object.keys(coaching.errorsByType).length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-white font-semibold mb-3">Error Patterns</h3>
                        <div className="space-y-2">
                            {Object.entries(coaching.errorsByType).map(([type, data]) => (
                                <div key={type} className="bg-[#1E293B] rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white font-medium">{type.replace('-', ' ')}</span>
                                        <span className="text-amber-400 text-sm">×{data.count}</span>
                                    </div>
                                    {data.examples.length > 0 && (
                                        <div className="text-xs text-slate-400 space-y-1">
                                            {data.examples.slice(0, 3).map((ex, i) => (
                                                <div key={i}>• {ex}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {coaching.recommendations.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-white font-semibold mb-3">💡 Recommendations</h3>
                        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 space-y-2">
                            {coaching.recommendations.map((rec, i) => (
                                <div key={i} className="text-slate-300 text-sm">{rec}</div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Practice Phrase */}
                <div className="mb-6">
                    <h3 className="text-white font-semibold mb-3">🎯 Practice This</h3>
                    <div className="bg-[#1E293B] rounded-lg p-4">
                        <div className="text-white text-lg font-medium">{coaching.practicePhrase}</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onResume}
                        className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition-all"
                    >
                        Resume Conversation
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-[#1E293B] text-slate-400 rounded-lg px-4 py-3 hover:bg-[#2D3B4F] transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RoleplayPage() {
    const router = useRouter();
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userLevel] = useState('A1');
    const [showCoaching, setShowCoaching] = useState(false);
    const [coachingData, setCoachingData] = useState<CoachingData | null>(null);
    const [expandedCorrections, setExpandedCorrections] = useState<Set<string>>(new Set());

    const [visibleTranslations, setVisibleTranslations] = useState<Set<string>>(new Set());

    const {
        state: recordState,
        transcript,
        startRecording,
        stopRecording
    } = useRecordControl({
        maxMs: 60000,
        silenceTimeoutMs: 2500,
        onTranscript: (text) => {
            if (text.trim()) {
                setInputText(text.trim());
                submitTurn(text.trim());
            }
        },
    });

    const { speak, isSpeaking } = useTextToSpeech();

    const [error, setError] = useState<string | null>(null);

    //  Sync live transcript
    useEffect(() => {
        if (recordState === 'recording' && transcript) {
            setInputText(transcript);
        }
    }, [recordState, transcript]);

    // Load scenarios
    useEffect(() => {
        async function loadScenarios() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roleplay/scenarios`, {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    setScenarios(data.scenarios || []);
                } else {
                    setError('Failed to load scenarios. Please check your connection.');
                }
            } catch (error) {
                console.error('Failed to load scenarios:', error);
                setError('Failed to load scenarios. API may be unreachable.');
            }
        }
        loadScenarios();
    }, []);

    // Auto-speak AI greeting
    useEffect(() => {
        if (session && session.turns.length === 1 && session.turns[0].userMessage === null) {
            setTimeout(() => speak(session.turns[0].aiResponse), 500);
        }
    }, [session, speak]);

    async function startSession(scenarioId: string) {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roleplay/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    scenarioId,
                    userLevel,
                }),
            });

            if (res.status === 401) {
                router.push('/auth');
                return;
            }

            if (!res.ok) {
                const errorText = await res.text();
                // try to parse json error if possible with fallback to text
                let errorMessage = errorText;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorText;
                } catch (e) { }

                throw new Error(errorMessage);
            }

            const data: Session = await res.json();
            setSession(data);
            setSelectedScenarioId(scenarioId);
        } catch (error) {
            console.error('Start session error:', error);
            setError(`Failed to start session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }

    async function submitTurn(message: string) {
        if (!session || !message.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roleplay/sessions/${session.id}/turn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ userMessage: message }),
            });

            if (!res.ok) throw new Error('Failed to submit turn');

            const turn: Turn = await res.json();

            // Update session with new turn
            setSession(prev => prev ? {
                ...prev,
                turns: [...prev.turns, turn],
                totalErrors: prev.totalErrors + turn.corrections.length,
            } : null);

            setInputText('');
            speak(turn.aiResponse);

        } catch (error) {
            console.error('Submit turn error:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    async function getHint() {
        if (!session) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roleplay/sessions/${session.id}/hint`, {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to get hint');

            const data = await res.json();

            if (data.alreadyUsedThisTurn) {
                // Should not happen with new backend logic, but handled just in case
            } else {
                setSession(prev => {
                    if (!prev) return null;
                    const newTurns = [...prev.turns];
                    // Use the last turn logic since hints are for current state
                    // Note: Backend might define 'last turn' as the one waiting for user input
                    if (newTurns.length > 0) {
                        const lastTurnIndex = newTurns.length - 1;
                        newTurns[lastTurnIndex] = { ...newTurns[lastTurnIndex], hintGiven: data.hint };
                    }
                    return { ...prev, turns: newTurns, hintsUsed: prev.hintsUsed + 1 };
                });
            }
        } catch (error) {
            console.error('Get hint error:', error);
        }
    }

    async function pauseSession() {
        if (!session) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roleplay/sessions/${session.id}/pause`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to pause');

            const data: CoachingData = await res.json();
            setCoachingData(data);
            setShowCoaching(true);
            setSession(prev => prev ? { ...prev, status: 'paused' } : null);
        } catch (error) {
            console.error('Pause error:', error);
        }
    }

    async function resumeSession() {
        if (!session) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roleplay/sessions/${session.id}/resume`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to resume');

            const data: Session = await res.json();
            setSession(data);
            setShowCoaching(false);
        } catch (error) {
            console.error('Resume error:', error);
        }
    }

    function toggleCorrections(turnId: string) {
        setExpandedCorrections(prev => {
            const next = new Set(prev);
            if (next.has(turnId)) {
                next.delete(turnId);
            } else {
                next.add(turnId);
            }
            return next;
        });
    }

    function toggleTranslation(turnId: string) {
        setVisibleTranslations(prev => {
            const next = new Set(prev);
            if (next.has(turnId)) {
                next.delete(turnId);
            } else {
                next.add(turnId);
            }
            return next;
        });
    }

    const isListening = recordState === 'recording';

    // Scenario selection
    if (!selectedScenarioId || !session) {
        return (
            <AppLayout>
                <div className="min-h-screen p-8">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-2xl font-bold text-white mb-2">🎭 Roleplay Scenarios</h1>
                        <p className="text-slate-400 mb-8">Practice structured conversations with AI</p>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6 flex items-center justify-between">
                                <span>{error}</span>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {isLoading && !session ? (
                            <div className="text-center text-slate-400 py-12">Starting session...</div>
                        ) : scenarios.length === 0 ? (
                            <div className="text-center text-slate-400 py-12">
                                <p className="mb-4">No scenarios available. Check console for errors.</p>
                                <p className="text-sm text-slate-500">
                                    API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">{scenarios.map((scenario) => (
                                <button
                                    key={scenario.id}
                                    onClick={() => startSession(scenario.id)}
                                    className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6 text-left hover:border-blue-600/50 hover:bg-[#0F1729]/80 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-white">{scenario.title}</h3>
                                        <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                            {scenario.level}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-3">{scenario.context}</p>
                                    <div className="flex gap-4 text-xs text-slate-500">
                                        <span>👤 You: {scenario.userRole}</span>
                                        <span>🤖 AI: {scenario.aiRole}</span>
                                    </div>
                                </button>
                            ))}
                            </div>
                        )}
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {showCoaching && coachingData && (
                <CoachingModal
                    coaching={coachingData}
                    onResume={resumeSession}
                    onClose={() => setShowCoaching(false)}
                />
            )}

            <div className="min-h-screen flex flex-col">
                {/* Header */}
                <div className="bg-[#0F1729] border-b border-[#1E293B] px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setSelectedScenarioId(null);
                                    setSession(null);
                                    stopRecording();
                                }}
                                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-[#1E293B]"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-lg font-semibold text-white">{session.scenario.title}</h1>
                                <p className="text-sm text-slate-400">Turn {session.turns.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {session.totalErrors >= 3 && (
                                <button
                                    onClick={pauseSession}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 text-amber-400 rounded-lg hover:bg-amber-600/30 transition-all border border-amber-600/30"
                                    disabled={session.status === 'paused'}
                                >
                                    <Pause className="h-4 w-4" />
                                    Pause & Coach
                                </button>
                            )}


                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {session.turns.map((turn, i) => (
                        <div key={turn.id} className="space-y-3">
                            {/* User message */}
                            {turn.userMessage && (
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-blue-600 text-white">
                                        <p>{turn.userMessage}</p>
                                    </div>
                                </div>
                            )}

                            {/* AI response */}
                            <div className="flex justify-start">
                                <div className="max-w-[80%] space-y-2">
                                    <div className="rounded-2xl px-4 py-3 bg-[#1E293B] text-white">
                                        <p className="text-base">{turn.aiResponse}</p>
                                        {visibleTranslations.has(turn.id) && turn.aiTranslation && (
                                            <p className="text-sm text-slate-300 mt-1 opacity-70 italic border-t border-slate-700/50 pt-1">{turn.aiTranslation}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2">
                                            <button
                                                onClick={() => speak(turn.aiResponse)}
                                                className="text-slate-400 hover:text-white flex items-center gap-1 text-xs transition-colors"
                                                disabled={isSpeaking}
                                            >
                                                <Volume2 className="h-3 w-3" />
                                                Replay
                                            </button>
                                            {turn.aiTranslation && (
                                                <button
                                                    onClick={() => toggleTranslation(turn.id)}
                                                    className={`hover:text-white flex items-center gap-1 text-xs transition-colors ${visibleTranslations.has(turn.id) ? 'text-purple-400' : 'text-slate-400'
                                                        }`}
                                                >
                                                    <Languages className="h-3 w-3" />
                                                    {visibleTranslations.has(turn.id) ? 'Hide' : 'Translate'}
                                                </button>
                                            )}
                                            {i === session.turns.length - 1 && (
                                                <button
                                                    onClick={getHint}
                                                    className="text-slate-400 hover:text-amber-400 flex items-center gap-1 text-xs transition-colors"
                                                    title="Get a hint"
                                                    disabled={isLoading}
                                                >
                                                    <Lightbulb className="h-3 w-3" />
                                                    Hint
                                                </button>
                                            )}
                                        </div>
                                        {turn.hintGiven && (
                                            <div className="text-sm text-amber-400 mt-2 p-2 bg-amber-900/20 border border-amber-900/40 rounded italic animate-in fade-in slide-in-from-top-1">
                                                💡 {turn.hintGiven}
                                            </div>
                                        )}
                                    </div>

                                    {/* Corrections (collapsible) */}
                                    {turn.corrections && turn.corrections.length > 0 && (
                                        <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleCorrections(turn.id)}
                                                className="w-full px-4 py-2 flex items-center justify-between text-amber-400 hover:bg-amber-900/30 transition-all"
                                            >
                                                <span className="text-sm font-medium">
                                                    {turn.corrections.length} correction{turn.corrections.length > 1 ? 's' : ''}
                                                </span>
                                                {expandedCorrections.has(turn.id) ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </button>
                                            {expandedCorrections.has(turn.id) && (
                                                <div className="px-4 py-3 space-y-2 border-t border-amber-600/20">
                                                    {turn.corrections.map((corr, idx) => (
                                                        <div key={idx} className="text-sm">
                                                            <div className="text-red-400">❌ {corr.error}</div>
                                                            <div className="text-green-400">✓ {corr.correction}</div>
                                                            <div className="text-slate-300 text-xs mt-1">{corr.explanation}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-[#1E293B] rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="bg-[#0F1729] border-t border-[#1E293B] p-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && submitTurn(inputText)}
                            placeholder={isListening ? "Listening..." : "Type in German..."}
                            className="flex-1 bg-[#1E293B] border border-[#2D3B4F] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-all"
                            disabled={isListening || isLoading || session.status !== 'active'}
                        />
                        <button
                            onClick={() => isListening ? stopRecording() : startRecording()}
                            disabled={isLoading}
                            className={`p-3 rounded-xl transition-all ${isListening
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                : 'bg-[#1E293B] text-slate-400 hover:text-white hover:bg-[#2D3B4F]'
                                }`}
                        >
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout >
    );
}
