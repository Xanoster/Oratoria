import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Play, MessageSquare, Target } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#0A0E1A]">
            {/* Subtle grid pattern */}
            <div className="fixed inset-0 bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 pointer-events-none" />

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-[#0A0E1A]/80 backdrop-blur-xl border-b border-[#1E293B] z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Oratoria</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/auth">
                            <button className="text-slate-300 hover:text-white transition-colors px-4 py-2">
                                Log in
                            </button>
                        </Link>
                        <Link href="/onboarding">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-lg px-6 py-2">
                                Start speaking German
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-40 pb-32 px-6">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F1729] border border-[#1E293B] mb-8">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-slate-400">AI-Powered Speaking Practice</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Speak German.
                        <br />
                        <span className="text-blue-500">Not someday. Now.</span>
                    </h1>
                    <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Real speaking practice with AI correction. Build actual fluency in 15 minutes a day.
                    </p>
                    <Link href="/onboarding">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base border-0 rounded-lg">
                            Start speaking German
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* How It Works */}
            <section className="relative py-20 px-6">
                <div className="max-w-5xl mx-auto relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-16 text-center">How Oratoria Works</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-2xl p-8">
                            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center mb-6">
                                <Target className="h-6 w-6 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-3">Placement by speaking</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                5-minute voice assessment determines your exact level. No guessing.
                            </p>
                        </div>
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-2xl p-8">
                            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center mb-6">
                                <Play className="h-6 w-6 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-3">Daily guided speaking</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Structured lessons that force you to speak, not just read or tap.
                            </p>
                        </div>
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-2xl p-8">
                            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center mb-6">
                                <MessageSquare className="h-6 w-6 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-3">Correction + retention</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                AI analyzes pronunciation, grammar, and usage. SRS ensures you remember.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* What We Avoid */}
            <section className="relative py-20 px-6">
                <div className="max-w-4xl mx-auto relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-12 text-center">What We Explicitly Avoid</h2>
                    <div className="space-y-4">
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6">
                            <p className="text-slate-300">No streaks. Consistency matters, but streaks create anxiety, not fluency.</p>
                        </div>
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6">
                            <p className="text-slate-300">No guessing grammar. You learn rules through speaking, not multiple choice.</p>
                        </div>
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6">
                            <p className="text-slate-300">No fake progress. Your level is based on real speech samples, not XP.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Methodology */}
            <section className="relative py-20 px-6">
                <div className="max-w-3xl mx-auto relative z-10 text-center">
                    <h2 className="text-3xl font-bold text-white mb-8">Built on Learning Science</h2>
                    <p className="text-slate-400 leading-relaxed mb-6">
                        Oratoria combines spaced repetition, forced output, and immediate corrective feedback—the three pillars proven to accelerate language acquisition.
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                        Every feature exists either to make you speak, correct what you said, or help you remember.
                    </p>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative py-20 px-6">
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-8">Ready to start speaking?</h2>
                    <Link href="/onboarding">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base border-0 rounded-lg">
                            Start speaking German
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[#1E293B] bg-[#0A0E1A] py-8 px-6">
                <div className="max-w-7xl mx-auto flex justify-center gap-8 text-sm text-slate-500">
                    <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
                    <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
                </div>
            </footer>
        </div>
    );
}
