'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

interface NextSession {
    lessonId: string;
    title: string;
    estimatedTime: number;
    focus: string;
}

export default function LearnPage() {
    const [nextSession, setNextSession] = useState<NextSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const lessonRes = await fetch('/api/v1/lessons/next', {
                    credentials: 'include',
                });

                if (lessonRes.ok) {
                    const lesson = await lessonRes.json();
                    if (lesson) {
                        setNextSession({
                            lessonId: lesson.id,
                            title: lesson.title,
                            estimatedTime: 30,
                            focus: 'Speaking + Grammar practice',
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-slate-400">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    // Demo session if none loaded
    const session = nextSession || {
        lessonId: 'demo-1',
        title: 'At the Bakery',
        estimatedTime: 30,
        focus: 'Speaking + Accusative case',
    };

    return (
        <AppLayout>
            <div className="min-h-screen p-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Good evening! 👋</h1>
                        <p className="text-slate-400">Ready for your next session?</p>
                    </div>

                    {/* Next Session Card - Dominant */}
                    <div className="bg-[#0F1729] border border-[#1E293B] rounded-2xl p-8 mb-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-white mb-2">
                                Your next 30-minute session
                            </h2>
                            <span className="inline-block px-3 py-1 text-sm rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                {session.focus}
                            </span>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-slate-300">
                                <span className="text-2xl">🗣️</span>
                                <span>Speaking practice (10 min)</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <span className="text-2xl">📖</span>
                                <span>Grammar focus (10 min)</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-300">
                                <span className="text-2xl">🧠</span>
                                <span>SRS review (10 min)</span>
                            </div>
                        </div>

                        <Link
                            href={`/learn/${session.lessonId}`}
                            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-4 rounded-lg font-medium transition-colors"
                        >
                            Start session
                        </Link>
                    </div>

                    {/* Why this lesson - Collapsed */}
                    <details className="bg-[#0F1729] border border-[#1E293B] rounded-xl mb-8">
                        <summary className="px-6 py-4 text-slate-400 cursor-pointer hover:text-white transition-colors">
                            Why this lesson?
                        </summary>
                        <div className="px-6 pb-4 text-slate-500 text-sm">
                            Based on your performance in past sessions, we've identified the accusative case and bakery vocabulary as areas for improvement. This lesson reinforces those patterns.
                        </div>
                    </details>

                    {/* Secondary Links */}
                    <div className="text-center space-x-6">
                        <Link href="/review" className="text-slate-400 hover:text-blue-400 transition-colors">
                            Go to review →
                        </Link>
                        <Link href="/speak" className="text-slate-400 hover:text-blue-400 transition-colors">
                            Speak now →
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
