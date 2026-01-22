'use client';

import React from 'react';
import Link from 'next/link';
import DashboardLayout from '@/app/dashboard/layout';
import { Button } from '@/components/ui/Button';

// Mock Roadmap Data
const nodes = [
    {
        id: 1,
        title: 'The Bakery',
        description: 'Order bread and pastries',
        status: 'completed', // completed, active, locked
        lessons: 3,
        completedLessons: 3,
        icon: '🥐'
    },
    {
        id: 2,
        title: 'Train Station',
        description: 'Buy tickets and ask directions',
        status: 'active',
        lessons: 4,
        completedLessons: 1,
        icon: '🚂'
    },
    {
        id: 3,
        title: 'The Cafe',
        description: 'Meet a friend and order drinks',
        status: 'locked',
        lessons: 3,
        completedLessons: 0,
        icon: '☕'
    },
    {
        id: 4,
        title: 'Apartment Hunting',
        description: 'Discuss rent and amenities',
        status: 'locked',
        lessons: 5,
        completedLessons: 0,
        icon: '🏠'
    },
    {
        id: 5,
        title: 'Doctor Visit',
        description: 'Explain symptoms and get medicine',
        status: 'locked',
        lessons: 4,
        completedLessons: 0,
        icon: '🩺'
    }
];

export default function RoadmapPage() {
    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="font-serif text-3xl font-bold text-[#2d1b0e]">Your Journey</h1>
                    <p className="text-[#5c4a3a]">Master German one scenario at a time</p>
                </div>

                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 top-8 bottom-8 w-1 bg-[#e2e8f0] -z-10 rounded-full">
                        {/* Progress Fill (Dynamic height based on active index) */}
                        <div className="w-full bg-[#c17767] rounded-full h-[35%]"></div>
                    </div>

                    <div className="space-y-12">
                        {nodes.map((node) => (
                            <div key={node.id} className={`flex gap-6 relative group ${node.status === 'locked' ? 'opacity-60 grayscale' : ''}`}>
                                {/* Node Icon */}
                                <div className={`
                                    w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl shadow-md border-4
                                    transition-all duration-300 transform group-hover:scale-110 z-10
                                    ${node.status === 'completed' ? 'bg-[#6b8e23] border-[#f0f7e6] text-white' : ''}
                                    ${node.status === 'active' ? 'bg-[#c17767] border-[#fef4e6] text-white ring-4 ring-[#c17767]/20 animate-pulse-slow' : ''}
                                    ${node.status === 'locked' ? 'bg-[#cbd5e0] border-white text-gray-500' : ''}
                                `}>
                                    {node.status === 'completed' ? '✓' : node.icon}
                                </div>

                                {/* Content Card */}
                                <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0] hover:shadow-md transition-shadow relative">
                                    {/* Arrow pointing to icon */}
                                    <div className="absolute left-[-8px] top-6 w-4 h-4 bg-white border-l border-b border-[#e2e8f0] transform rotate-45"></div>

                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-serif text-xl font-bold text-[#2d1b0e]">{node.title}</h3>
                                            <p className="text-[#5c4a3a] text-sm">{node.description}</p>
                                        </div>
                                        {node.status !== 'locked' && (
                                            <span className="text-xs font-bold px-2 py-1 rounded bg-[#faf5f0] text-[#8b7355]">
                                                {node.completedLessons} / {node.lessons}
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress Bar inside card */}
                                    <div className="w-full bg-[#f0f4f8] rounded-full h-2 mb-4">
                                        <div
                                            className={`h-2 rounded-full ${node.status === 'completed' ? 'bg-[#6b8e23]' : 'bg-[#c17767]'}`}
                                            style={{ width: `${(node.completedLessons / node.lessons) * 100}%` }}
                                        ></div>
                                    </div>

                                    <div>
                                        {node.status === 'active' ? (
                                            <Link href="/roleplay/demo">
                                                <Button size="sm" className="w-full">Continue Journey</Button>
                                            </Link>
                                        ) : node.status === 'completed' ? (
                                            <Link href="/lesson">
                                                <Button size="sm" variant="secondary" className="w-full">Review</Button>
                                            </Link>
                                        ) : (
                                            <Button size="sm" disabled className="w-full bg-[#e2e8f0] text-[#8b7355] cursor-not-allowed">Locked</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
