'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Clock, ArrowRight } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

interface SessionPlan {
    primaryFocus: 'pronunciation' | 'grammar' | 'vocabulary' | 'speaking' | 'repair' | 'review';
    lessonId?: string;
    generatedLessonSpec?: {
        type: string;
        focus: string;
        difficulty: string;
    };
    estimatedTime: number;
    explanationText: string;
}

type SessionLabel = 'Repair Session' | 'Progress Session';

function getSessionLabel(focus: SessionPlan['primaryFocus']): SessionLabel {
    // Repair session if user is struggling
    if (focus === 'repair' || focus === 'grammar' || focus === 'pronunciation') {
        return 'Repair Session';
    }
    // Progress session if progressing
    return 'Progress Session';
}

function getFocusLabel(focus: SessionPlan['primaryFocus']): string {
    switch (focus) {
        case 'repair': return 'Targeted Practice';
        case 'pronunciation': return 'Pronunciation';
        case 'grammar': return 'Grammar';
        case 'vocabulary': return 'Vocabulary';
        case 'speaking': return 'Speaking';
        case 'review': return 'Review';
        default: return 'Practice';
    }
}

export default function LearnPage() {
    const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [showExplanation, setShowExplanation] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSessionPlan() {
            try {
                // Get user ID from session/auth (simplified for now)
                const userId = 'current-user';
                const timeAvailable = 15; // Default 15 minutes

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/adaptive-learning/next-session/${userId}?time=${timeAvailable}`,
                    { credentials: 'include' }
                );

                if (res.ok) {
                    const plan = await res.json();
                    setSessionPlan(plan);
                } else {
                    // Fallback plan if API not available
                    setSessionPlan({
                        primaryFocus: 'vocabulary',
                        estimatedTime: 15,
                        explanationText: 'Continuing with your current learning path.',
                    });
                }
            } catch (err) {
                console.error('Failed to fetch session plan:', err);
                // Fallback plan
                setSessionPlan({
                    primaryFocus: 'vocabulary',
                    estimatedTime: 15,
                    explanationText: 'Continuing with your current learning path.',
                });
            } finally {
                setLoading(false);
            }
        }

        fetchSessionPlan();
    }, []);

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (!sessionPlan) {
        return (
            <AppLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-slate-400">Unable to load session.</p>
                </div>
            </AppLayout>
        );
    }

    const sessionLabel = getSessionLabel(sessionPlan.primaryFocus);
    const isRepair = sessionLabel === 'Repair Session';
    const lessonPath = sessionPlan.lessonId
        ? `/learn/${sessionPlan.lessonId}`
        : '/learn/generated';

    return (
        <AppLayout>
            <div className="min-h-screen p-8">
                <div className="max-w-lg mx-auto">
                    {/* Session Card - Single Primary Action */}
                    <div className={`
                        rounded-2xl p-8 mb-6
                        ${isRepair
                            ? 'bg-amber-950/30 border border-amber-800/40'
                            : 'bg-[#0F1729] border border-[#1E293B]'
                        }
                    `}>
                        {/* Session Label */}
                        <div className="mb-6">
                            <span className={`
                                inline-block px-3 py-1 text-xs font-medium rounded-full mb-3
                                ${isRepair
                                    ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                                    : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                                }
                            `}>
                                {sessionLabel}
                            </span>

                            <h1 className="text-xl font-semibold text-white">
                                {getFocusLabel(sessionPlan.primaryFocus)}
                            </h1>
                        </div>

                        {/* Time Estimate */}
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-8">
                            <Clock size={16} />
                            <span>{sessionPlan.estimatedTime} minutes</span>
                        </div>

                        {/* Primary Action Button */}
                        <Link
                            href={lessonPath}
                            className={`
                                flex items-center justify-center gap-2 w-full py-4 rounded-lg font-medium transition-colors
                                ${isRepair
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }
                            `}
                        >
                            <span>Start</span>
                            <ArrowRight size={18} />
                        </Link>
                    </div>

                    {/* Why This Session - Collapsible */}
                    <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#0F1729] border border-[#1E293B] text-slate-400 hover:text-slate-300 transition-colors"
                    >
                        <span className="text-sm">Why this session?</span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform ${showExplanation ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {showExplanation && (
                        <div className="mt-2 px-4 py-3 rounded-lg bg-[#0A0F1C] border border-[#1E293B]">
                            <p className="text-sm text-slate-500">
                                {sessionPlan.explanationText}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
