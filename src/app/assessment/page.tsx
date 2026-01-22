'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

const LEVELS = [
    {
        id: 'beginner',
        cefrLevel: 'A1',
        title: 'Beginner',
        subtitle: 'I\'m just starting',
        description: 'Little to no German knowledge. Learning basic phrases and vocabulary.',
        icon: '🌱',
        color: '#6b8e23'
    },
    {
        id: 'intermediate',
        cefrLevel: 'A2',
        title: 'Intermediate',
        subtitle: 'I know some German',
        description: 'Can understand simple sentences. Working on grammar and conversation.',
        icon: '🌿',
        color: '#c17767'
    },
    {
        id: 'advanced',
        cefrLevel: 'B1',
        title: 'Advanced',
        subtitle: 'I\'m fairly confident',
        description: 'Can hold conversations. Looking to refine grammar and expand vocabulary.',
        icon: '🌳',
        color: '#5c4a3a'
    }
];

export default function OnboardingPage() {
    const router = useRouter();
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showAssessment, setShowAssessment] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Check if user already completed onboarding
    useEffect(() => {
        async function checkStatus() {
            try {
                const res = await fetch('/api/assessment/status');
                if (res.ok) {
                    const data = await res.json();
                    if (data.assessmentComplete) {
                        router.replace('/dashboard');
                        return;
                    }
                }
            } catch (e) {
                console.error('Failed to check status:', e);
            }
            setCheckingStatus(false);
        }
        checkStatus();
    }, [router]);

    const handleLevelSelect = async () => {
        if (!selectedLevel) return;

        setIsLoading(true);
        try {
            const level = LEVELS.find(l => l.id === selectedLevel);

            const res = await fetch('/api/onboarding/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cefrLevel: level?.cefrLevel || 'A1',
                    skipAssessment: true
                })
            });

            if (res.ok) {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Failed to save level:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen bg-[#faf5f0] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#c17767] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf5f0] py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="font-serif text-3xl font-bold text-[#2d1b0e] mb-3">
                        Welcome to Oratoria! 🎭
                    </h1>
                    <p className="text-[#5c4a3a] text-lg">
                        Let's personalize your German learning journey
                    </p>
                </div>

                {/* Level Selection */}
                <div className="mb-8">
                    <h2 className="font-serif text-xl font-bold text-[#2d1b0e] mb-4 text-center">
                        What's your German level?
                    </h2>

                    <div className="space-y-4">
                        {LEVELS.map((level) => (
                            <button
                                key={level.id}
                                onClick={() => setSelectedLevel(level.id)}
                                className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 text-left
                                    ${selectedLevel === level.id
                                        ? 'border-[#c17767] bg-white shadow-lg'
                                        : 'border-[#e2d5c7] bg-white/50 hover:border-[#c17767]/50 hover:bg-white'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                                        style={{ backgroundColor: `${level.color}20` }}
                                    >
                                        {level.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-[#2d1b0e] text-lg">{level.title}</h3>
                                            <span className="text-xs font-medium text-[#8b7355] bg-[#faf5f0] px-2 py-0.5 rounded">
                                                {level.cefrLevel}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#5c4a3a] mt-0.5">{level.subtitle}</p>
                                        <p className="text-xs text-[#8b7355] mt-2">{level.description}</p>
                                    </div>
                                    {selectedLevel === level.id && (
                                        <div className="w-6 h-6 bg-[#c17767] rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Continue Button */}
                <Button
                    onClick={handleLevelSelect}
                    disabled={!selectedLevel || isLoading}
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                >
                    Start Learning
                </Button>

                {/* Optional Assessment Link */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/assessment/test')}
                        className="text-sm text-[#c17767] hover:underline"
                    >
                        Or take a quick assessment to find your exact level →
                    </button>
                </div>

                {/* Info */}
                <p className="text-center text-xs text-[#8b7355] mt-8">
                    Don't worry, you can change your level later in settings.
                </p>
            </div>
        </div>
    );
}
