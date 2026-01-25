'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpen, Target, Mic } from 'lucide-react';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // Auto-redirect logged-in users to /learn
        const hasAuth = document.cookie.includes('sb-');
        if (hasAuth) {
            router.push('/learn');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-[#F0FDF4]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-200 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <span className="text-white font-bold">O</span>
                        </div>
                        <span className="font-bold text-gray-900">Oratoria</span>
                    </Link>
                    <Link
                        href="/auth"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Learn German Effectively
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Master German with structured lessons, practical vocabulary, and interactive exercises designed for real-world communication.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex gap-4 justify-center mb-20">
                        <Link
                            href="/auth"
                            className="flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-500/25"
                        >
                            Start Learning
                            <ArrowRight size={20} />
                        </Link>
                        <Link
                            href="/learn/demo"
                            className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 hover:border-emerald-400 hover:text-emerald-600 rounded-xl font-semibold transition-colors"
                        >
                            <span>▷</span>
                            Try a Lesson
                        </Link>
                    </div>

                    {/* Features */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Learn with Us</h2>
                    <div className="grid md:grid-cols-3 gap-6 mb-20">
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="h-7 w-7 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Structured Lessons</h3>
                            <p className="text-gray-500">Learn German step-by-step with organized lessons for all levels</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Target className="h-7 w-7 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-world Skills</h3>
                            <p className="text-gray-500">Focus on practical vocabulary and grammar you'll actually use</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Mic className="h-7 w-7 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Speaking Practice</h3>
                            <p className="text-gray-500">Improve pronunciation with interactive speaking exercises</p>
                        </div>
                    </div>

                    {/* Level Selection */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Learn at Your Level</h2>
                    <p className="text-gray-500 mb-8">Follow the Common European Framework of Reference (CEFR) from complete beginner to advanced proficiency.</p>
                    <div className="flex justify-center gap-6">
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level, i) => (
                            <div key={level} className="text-center">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold mb-2 ${i < 2 ? 'bg-emerald-500' : i < 4 ? 'bg-blue-500' : 'bg-orange-500'
                                    }`}>
                                    {level}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {i === 0 ? 'Beginner' : i === 1 ? 'Elementary' : i === 2 ? 'Intermediate' : i === 3 ? 'Upper Int.' : i === 4 ? 'Advanced' : 'Proficient'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-8 px-6">
                <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
                    © 2024 Oratoria. Learn German effectively.
                </div>
            </footer>
        </div>
    );
}
