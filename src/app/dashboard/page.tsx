'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import LearningSession from '@/components/learning/LearningSession';

interface SRSItem {
    id: string;
    sentenceId: string;
    sentence: {
        id: string;
        germanText: string;
        englishText: string;
        clozeTargets: string;
        cefrLevel: string;
    };
}

interface SRSCounts {
    dueNow: number;
    overdue: number;
    newToday: number;
    totalDue: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<SRSItem[]>([]);
    const [counts, setCounts] = useState<SRSCounts>({ dueNow: 0, overdue: 0, newToday: 0, totalDue: 0 });
    const [inSession, setInSession] = useState(false);
    const [userName, setUserName] = useState('');
    const [cefrLevel, setCefrLevel] = useState('A1');

    // Fetch SRS queue on mount
    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch user info
                const userRes = await fetch('/api/auth/session');
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUserName(userData?.user?.name || 'Learner');
                }

                // Fetch SRS queue
                const queueRes = await fetch('/api/srs/queue');
                if (queueRes.ok) {
                    const queueData = await queueRes.json();
                    setItems(queueData.items || []);
                    setCounts(queueData.counts || { dueNow: 0, overdue: 0, newToday: 0, totalDue: 0 });
                }

                // Fetch CEFR level
                const assessmentRes = await fetch('/api/assessment/status');
                if (assessmentRes.ok) {
                    const assessmentData = await assessmentRes.json();
                    setCefrLevel(assessmentData.cefrLevel || 'A1');
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleItemComplete = async (itemId: string, quality: number, outputType: string) => {
        try {
            await fetch('/api/srs/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    srsStateId: itemId,
                    quality,
                    outputType
                })
            });
        } catch (error) {
            console.error('Error updating SRS:', error);
        }
    };

    const handleSessionComplete = () => {
        setInSession(false);
        // Refresh the queue
        router.refresh();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf5f0] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#c17767] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#8b7355]">Loading your learning queue...</p>
                </div>
            </div>
        );
    }

    // In learning session mode
    if (inSession && items.length > 0) {
        return (
            <div className="min-h-screen bg-[#faf5f0] py-8 px-4">
                <LearningSession
                    items={items}
                    onComplete={handleSessionComplete}
                    onItemComplete={handleItemComplete}
                />
            </div>
        );
    }

    // Dashboard view - SRS as primary navigation
    return (
        <div className="min-h-screen bg-[#faf5f0] py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="font-serif text-3xl font-bold text-[#2d1b0e]">
                        Guten Tag, {userName}! 👋
                    </h1>
                    <p className="text-[#5c4a3a] mt-2">
                        Level: <span className="font-bold text-[#c17767]">{cefrLevel}</span>
                    </p>
                </div>

                {/* SRS Queue Stats */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="font-serif text-xl font-bold text-[#2d1b0e] mb-6 text-center">
                        Your Review Queue
                    </h2>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {/* Due Now */}
                        <div className="text-center p-4 bg-[#fef4e6] rounded-xl">
                            <p className="text-3xl font-bold text-[#c17767]">{counts.dueNow}</p>
                            <p className="text-xs text-[#8b7355] mt-1">Due Now</p>
                        </div>

                        {/* Overdue */}
                        <div className="text-center p-4 bg-[#fff8f5] rounded-xl">
                            <p className="text-3xl font-bold text-[#d45d5d]">{counts.overdue}</p>
                            <p className="text-xs text-[#8b7355] mt-1">Overdue</p>
                        </div>

                        {/* New Today */}
                        <div className="text-center p-4 bg-[#f0f7e6] rounded-xl">
                            <p className="text-3xl font-bold text-[#6b8e23]">{counts.newToday}</p>
                            <p className="text-xs text-[#8b7355] mt-1">New Today</p>
                        </div>
                    </div>

                    {/* Start Review Button */}
                    {counts.totalDue > 0 ? (
                        <Button
                            onClick={() => setInSession(true)}
                            className="w-full"
                            size="lg"
                        >
                            Start Review ({counts.totalDue} items)
                        </Button>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-[#f0f7e6] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🎉</span>
                            </div>
                            <p className="text-[#6b8e23] font-bold mb-2">All caught up!</p>
                            <p className="text-sm text-[#8b7355]">
                                You've reviewed all due items. Check back later for more.
                            </p>
                        </div>
                    )}
                </div>

                {/* Philosophy Notice */}
                <div className="bg-[#faf5f0] border border-[#e2d5c7] rounded-xl p-4 text-center">
                    <p className="text-sm text-[#8b7355]">
                        🎯 <strong>Focus on output.</strong> Every review requires you to produce German.
                        No passive consumption. No skipping.
                    </p>
                </div>

                {/* No browsing notice */}
                <p className="text-center text-xs text-[#8b7355]">
                    ⚠️ Lesson browsing is disabled. SRS determines your learning path.
                </p>
            </div>
        </div>
    );
}
