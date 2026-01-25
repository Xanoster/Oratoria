'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Clock, ArrowRight, BookOpen, Target, Flame } from 'lucide-react';
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

interface ProgressStats {
    lessonsCompleted: number;
    totalLessons: number;
    wordsLearned: number;
    currentStreak: number;
    weeklyGoalProgress: number;
}

type SessionLabel = 'Repair Session' | 'Progress Session';

function getSessionLabel(focus: SessionPlan['primaryFocus']): SessionLabel {
    if (focus === 'repair' || focus === 'grammar' || focus === 'pronunciation') {
        return 'Repair Session';
    }
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

function ProgressBar({ value, max, className = '' }: { value: number; max: number; className?: string }) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className={`h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
            <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
    );
}

export default function LearnPage() {
    const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null);
    const [stats, setStats] = useState<ProgressStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const userId = 'current-user';
                const timeAvailable = 15;

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/adaptive-learning/next-session/${userId}?time=${timeAvailable}`,
                    { credentials: 'include' }
                );

                if (res.ok) {
                    const plan = await res.json();
                    setSessionPlan(plan);
                } else {
                    setSessionPlan({
                        primaryFocus: 'vocabulary',
                        estimatedTime: 15,
                        explanationText: 'Continuing with your current learning path.',
                    });
                }

                setStats({
                    lessonsCompleted: 3,
                    totalLessons: 10,
                    wordsLearned: 47,
                    currentStreak: 5,
                    weeklyGoalProgress: 60,
                });
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setSessionPlan({
                    primaryFocus: 'vocabulary',
                    estimatedTime: 15,
                    explanationText: 'Continuing with your current learning path.',
                });
                setStats({
                    lessonsCompleted: 0,
                    totalLessons: 10,
                    wordsLearned: 0,
                    currentStreak: 0,
                    weeklyGoalProgress: 0,
                });
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-screen p-8 bg-[#F0FDF4]">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="animate-pulse h-8 bg-gray-200 rounded w-64 mb-8" />
                        <SkeletonCard />
                        <div className="grid grid-cols-3 gap-4">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!sessionPlan) {
        return (
            <AppLayout>
                <div className="min-h-screen flex items-center justify-center bg-[#F0FDF4]">
                    <p className="text-gray-500">Unable to load session.</p>
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
            <div className="min-h-screen p-8 bg-[#F0FDF4]">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Learn German Effectively</h1>
                        <p className="text-gray-600">Master German with structured lessons and interactive exercises</p>
                    </div>

                    {/* Progress Overview */}
                    {stats && (
                        <div className="mb-8">
                            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-600">Course Progress</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {stats.lessonsCompleted}/{stats.totalLessons} lessons
                                    </span>
                                </div>
                                <ProgressBar value={stats.lessonsCompleted} max={stats.totalLessons} />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                                    <BookOpen className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                                    <div className="text-xl font-bold text-gray-900">{stats.wordsLearned}</div>
                                    <div className="text-xs text-gray-500">Words Learned</div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                                    <Flame className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                                    <div className="text-xl font-bold text-gray-900">{stats.currentStreak}</div>
                                    <div className="text-xs text-gray-500">Day Streak</div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                                    <Target className="h-5 w-5 text-blue-500 mx-auto mb-2" />
                                    <div className="text-xl font-bold text-gray-900">{stats.weeklyGoalProgress}%</div>
                                    <div className="text-xs text-gray-500">Weekly Goal</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 mb-8">
                        <Link
                            href={lessonPath}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 px-6 rounded-xl font-medium transition-colors"
                        >
                            Start Learning
                            <ArrowRight size={18} />
                        </Link>
                        <Link
                            href="/learn/demo"
                            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-4 px-6 rounded-xl font-medium transition-colors"
                        >
                            Try a Lesson
                        </Link>
                    </div>

                    {/* Features Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Why Learn with Us</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <BookOpen className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Structured Lessons</h3>
                                <p className="text-sm text-gray-500">Learn German step-by-step with organized lessons for all levels</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <Target className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Real-world Skills</h3>
                                <p className="text-sm text-gray-500">Focus on practical vocabulary and grammar you'll actually use</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <Flame className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Speaking Practice</h3>
                                <p className="text-sm text-gray-500">Improve pronunciation with interactive speaking exercises</p>
                            </div>
                        </div>
                    </div>

                    {/* Level Selection */}
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Learn at Your Level</h2>
                        <p className="text-sm text-gray-500 mb-6">Follow the Common European Framework of Reference (CEFR)</p>
                        <div className="flex justify-center gap-4">
                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level, i) => (
                                <div key={level} className="text-center">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm mb-1 ${i < 2 ? 'bg-emerald-500' : i < 4 ? 'bg-blue-500' : 'bg-orange-500'
                                        }`}>
                                        {level}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {i === 0 ? 'Beginner' : i === 1 ? 'Elementary' : i === 2 ? 'Intermediate' : i === 3 ? 'Upper Int.' : i === 4 ? 'Advanced' : 'Proficient'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
