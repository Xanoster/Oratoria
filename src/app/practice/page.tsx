'use client';

import React from 'react';
import Link from 'next/link';

const PRACTICE_MODES = [
    {
        id: 'speaking',
        title: 'Speaking Practice',
        description: 'Practice speaking German with instant feedback',
        icon: '🗣️',
        href: '/dashboard', // Uses main SRS session
        color: 'from-[#c17767] to-[#8b5e3c]',
        available: true
    },
    {
        id: 'flashcards',
        title: 'Flashcards',
        description: 'Review vocabulary with flip cards',
        icon: '🎴',
        href: '/practice/flashcards',
        color: 'from-[#6b8e23] to-[#5a7a1e]',
        available: true
    },
    {
        id: 'reading',
        title: 'Reading',
        description: 'Read German texts and answer questions',
        icon: '📖',
        href: '/practice/reading',
        color: 'from-[#5c4a3a] to-[#3a2f24]',
        available: false // Coming soon
    },
    {
        id: 'listening',
        title: 'Listening',
        description: 'Listen to German audio and practice comprehension',
        icon: '🎧',
        href: '/practice/listening',
        color: 'from-[#4a7c59] to-[#3a6b49]',
        available: false // Coming soon
    },
    {
        id: 'grammar',
        title: 'Grammar Drills',
        description: 'Focused practice on German grammar rules',
        icon: '📝',
        href: '/practice/grammar',
        color: 'from-[#8b6b47] to-[#6b4f2f]',
        available: false // Coming soon
    },
    {
        id: 'roleplay',
        title: 'Roleplay Scenarios',
        description: 'Have conversations in real-life situations',
        icon: '🎭',
        href: '/roadmap',
        color: 'from-[#c17767] to-[#a96557]',
        available: true
    }
];

export default function PracticePage() {
    return (
        <div className="min-h-screen bg-[#faf5f0] py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-serif text-4xl font-bold text-[#2d1b0e] mb-3">
                        Practice German
                    </h1>
                    <p className="text-lg text-[#5c4a3a]">
                        Choose your learning method
                    </p>
                </div>

                {/* Practice Modes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PRACTICE_MODES.map((mode) => (
                        <Link
                            key={mode.id}
                            href={mode.available ? mode.href : '#'}
                            className={`
                                relative group block bg-white rounded-2xl shadow-lg overflow-hidden
                                transition-all duration-300
                                ${mode.available
                                    ? 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
                                    : 'opacity-60 cursor-not-allowed'
                                }
                            `}
                        >
                            {/* Gradient Header */}
                            <div className={`h-32 bg-gradient-to-br ${mode.color} flex items-center justify-center`}>
                                <span className="text-6xl">{mode.icon}</span>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h3 className="font-serif text-xl font-bold text-[#2d1b0e] mb-2">
                                    {mode.title}
                                </h3>
                                <p className="text-sm text-[#8b7355]">
                                    {mode.description}
                                </p>
                            </div>

                            {/* Coming Soon Badge */}
                            {!mode.available && (
                                <div className="absolute top-4 right-4 bg-[#2d1b0e] text-white text-xs px-3 py-1 rounded-full">
                                    Coming Soon
                                </div>
                            )}

                            {/* Hover Arrow */}
                            {mode.available && (
                                <div className="absolute bottom-6 right-6 text-[#c17767] opacity-0 group-hover:opacity-100 transition-opacity">
                                    →
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
