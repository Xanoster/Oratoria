'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ErrorPattern {
    type: string;
    count: number;
    examples: string[];
    explanation: string;
    suggestedAction: string;
}

interface CEFREvidence {
    suggestedLevel: string;
    confidence: number;
    reasons: string[];
    strengths: string[];
    weaknesses: string[];
}

interface ClarityTrend {
    current: number;
    previous: number;
    direction: 'improving' | 'declining' | 'stable';
    dataPoints: Array<{ date: string; score: number }>;
    explanation: string;
    suggestedAction: string;
}

export default function ProgressPage() {
    const [loading, setLoading] = useState(true);
    const [cefrData, setCefrData] = useState<CEFREvidence | null>(null);
    const [clarityTrend, setClarityTrend] = useState<ClarityTrend | null>(null);
    const [topErrors, setTopErrors] = useState<ErrorPattern[]>([]);

    useEffect(() => {
        async function loadProgressData() {
            try {
                // Fetch user evaluations
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/evaluation/user/current-user`);

                if (res.ok) {
                    const evaluations = await res.json();

                    // Analyze data
                    const cefr = analyzeCEFRLevel(evaluations);
                    const clarity = analyzeClarityTrend(evaluations);
                    const errors = analyzeRecurringErrors(evaluations);

                    setCefrData(cefr);
                    setClarityTrend(clarity);
                    setTopErrors(errors);
                }
            } catch (error) {
                console.error('Failed to load progress data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadProgressData();
    }, []);

    function analyzeCEFRLevel(evaluations: any[]): CEFREvidence {
        if (evaluations.length === 0) {
            return {
                suggestedLevel: 'A0',
                confidence: 0,
                reasons: ['No evaluation data available'],
                strengths: [],
                weaknesses: [],
            };
        }

        // Take recent evaluations (last 10)
        const recent = evaluations.slice(0, 10);
        const avgPronunciation = recent.reduce((sum, e) => sum + e.pronunciationScore, 0) / recent.length;
        const avgGrammar = recent.reduce((sum, e) => sum + e.grammarScore, 0) / recent.length;
        const avgFluency = recent.reduce((sum, e) => sum + e.fluencyScore, 0) / recent.length;

        // Determine level based on scores
        let level = 'A0';
        let confidence = 0.7;
        const reasons: string[] = [];
        const strengths: string[] = [];
        const weaknesses: string[] = [];

        if (avgGrammar >= 85 && avgPronunciation >= 80 && avgFluency >= 85) {
            level = 'B2';
            reasons.push('Consistently high scores across all areas');
            reasons.push(`Grammar: ${avgGrammar.toFixed(0)}% (complex structures)`);
        } else if (avgGrammar >= 75 && avgPronunciation >= 70 && avgFluency >= 75) {
            level = 'B1';
            reasons.push('Solid intermediate performance');
            reasons.push(`Grammar: ${avgGrammar.toFixed(0)}% (handles cases and subordinate clauses)`);
        } else if (avgGrammar >= 65 && avgPronunciation >= 60) {
            level = 'A2';
            reasons.push('Basic grammar structures mastered');
            reasons.push(`Pronunciation: ${avgPronunciation.toFixed(0)}% (understandable with effort)`);
        } else if (avgPronunciation >= 50 || avgGrammar >= 50) {
            level = 'A1';
            reasons.push('Building foundational skills');
            reasons.push('Can produce simple phrases');
        } else {
            level = 'A0';
            reasons.push('Starting German learning journey');
        }

        // Identify strengths
        if (avgPronunciation >= 75) strengths.push('Clear pronunciation');
        if (avgGrammar >= 75) strengths.push('Strong grammar foundation');
        if (avgFluency >= 75) strengths.push('Natural speaking flow');

        // Identify weaknesses
        if (avgPronunciation < 65) weaknesses.push('Pronunciation accuracy');
        if (avgGrammar < 65) weaknesses.push('Grammar structures');
        if (avgFluency < 65) weaknesses.push('Speaking fluency');

        return {
            suggestedLevel: level,
            confidence,
            reasons,
            strengths,
            weaknesses,
        };
    }

    function analyzeClarityTrend(evaluations: any[]): ClarityTrend {
        if (evaluations.length < 2) {
            return {
                current: 0,
                previous: 0,
                direction: 'stable',
                dataPoints: [],
                explanation: 'Not enough data to determine trend. Complete more speaking tasks.',
                suggestedAction: 'Continue practicing to establish baseline.',
            };
        }

        // Get recent pronunciation scores
        const recent = evaluations.slice(0, 10).reverse(); // Oldest to newest
        const dataPoints = recent.map(e => ({
            date: new Date(e.createdAt).toLocaleDateString(),
            score: e.pronunciationScore,
        }));

        const current = recent[recent.length - 1].pronunciationScore;
        const previous = recent[0].pronunciationScore;
        const diff = current - previous;

        let direction: 'improving' | 'declining' | 'stable' = 'stable';
        let explanation = '';
        let suggestedAction = '';

        if (diff > 5) {
            direction = 'improving';
            explanation = `Pronunciation clarity improved by ${diff.toFixed(0)} points over recent sessions. Consistent practice is showing results.`;
            suggestedAction = 'Maintain current practice frequency. Focus on sentence-level pronunciation.';
        } else if (diff < -5) {
            direction = 'declining';
            explanation = `Pronunciation clarity decreased by ${Math.abs(diff).toFixed(0)} points. This may indicate attempting more complex material or fatigue.`;
            suggestedAction = 'Review fundamentals. Practice slower, deliberate pronunciation of common words.';
        } else {
            direction = 'stable';
            explanation = 'Pronunciation clarity remains consistent. This indicates a stable skill plateau.';
            suggestedAction = 'To improve further, focus on challenging phonemes identified in error feedback.';
        }

        return {
            current,
            previous,
            direction,
            dataPoints,
            explanation,
            suggestedAction,
        };
    }

    function analyzeRecurringErrors(evaluations: any[]): ErrorPattern[] {
        const errorMap: Map<string, ErrorPattern> = new Map();

        // Aggregate errors from evaluations
        for (const evaluation of evaluations) {
            const errors = evaluation.detectedErrors || [];
            for (const error of errors) {
                const key = `${error.type}-${error.token}`;

                if (errorMap.has(key)) {
                    const existing = errorMap.get(key)!;
                    existing.count += 1;
                    if (existing.examples.length < 3) {
                        existing.examples.push(error.expected);
                    }
                } else {
                    errorMap.set(key, {
                        type: error.type,
                        count: 1,
                        examples: [error.expected],
                        explanation: error.explanation || getErrorExplanation(error.type),
                        suggestedAction: getSuggestedAction(error.type, error.token),
                    });
                }
            }
        }

        // Get top 3 most frequent errors
        return Array.from(errorMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    }

    function getErrorExplanation(type: string): string {
        const explanations: Record<string, string> = {
            pronunciation: 'This phoneme or word is consistently mispronounced. German pronunciation differs from English in vowel length and consonant sounds.',
            grammar: 'Grammatical structure error. German grammar requires strict word order and case agreement.',
            fluency: 'Speaking rhythm interrupted. Natural German speech uses consistent pacing and clear article-noun connections.',
        };
        return explanations[type] || 'Recurring error pattern detected.';
    }

    function getSuggestedAction(type: string, token: string): string {
        const actions: Record<string, string> = {
            pronunciation: `Practice "${token}" in isolation. Listen to native audio, then record yourself. Compare.`,
            grammar: `Review the grammatical rule for "${token}". Complete targeted drills in the lesson section.`,
            fluency: `Slow down when speaking. Focus on completing full sentences before moving to the next thought.`,
        };
        return actions[type] || 'Review this pattern in lessons.';
    }

    if (loading) {
        return (
            <AppLayout>
                <main className="min-h-screen p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center py-12 text-slate-400">
                            Analyzing your performance data...
                        </div>
                    </div>
                </main>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <main className="min-h-screen p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Diagnostic Report</h1>
                        <p className="text-slate-400">Evidence-based analysis of your German speaking ability</p>
                    </div>

                    {/* CEFR Level */}
                    {cefrData && (
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-white mb-1">CEFR Level</h2>
                                    <div className="text-3xl font-bold text-blue-400">{cefrData.suggestedLevel}</div>
                                </div>
                                <div className="text-xs px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                    {Math.round(cefrData.confidence * 100)}% confidence
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-slate-300 mb-2">What this means</div>
                                    <div className="space-y-1">
                                        {cefrData.reasons.map((reason, i) => (
                                            <div key={i} className="text-sm text-slate-400 flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                <span>{reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {cefrData.strengths.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium text-green-400 mb-2">Demonstrated strengths</div>
                                        <div className="flex flex-wrap gap-2">
                                            {cefrData.strengths.map((strength, i) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded bg-green-900/20 text-green-400 border border-green-600/30">
                                                    {strength}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {cefrData.weaknesses.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium text-amber-400 mb-2">Areas for development</div>
                                        <div className="flex flex-wrap gap-2">
                                            {cefrData.weaknesses.map((weakness, i) => (
                                                <span key={i} className="text-xs px-2 py-1 rounded bg-amber-900/20 text-amber-400 border border-amber-600/30">
                                                    {weakness}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-[#1E293B]">
                                    <div className="text-sm font-medium text-white mb-2">Next action</div>
                                    <div className="text-sm text-slate-300">
                                        {cefrData.weaknesses.length > 0
                                            ? `Focus on ${cefrData.weaknesses[0].toLowerCase()
                                            } through targeted practice sessions.`
                                            : `Continue practicing at ${cefrData.suggestedLevel} level to solidify skills.`}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Speaking Clarity Trend */}
                    {clarityTrend && (
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Speaking Clarity Trend</h2>
                                <div className={`flex items - center gap - 2 text - sm ${clarityTrend.direction === 'improving' ? 'text-green-400' :
                                        clarityTrend.direction === 'declining' ? 'text-red-400' :
                                            'text-slate-400'
                                    } `}>
                                    {clarityTrend.direction === 'improving' && <TrendingUp className="h-4 w-4" />}
                                    {clarityTrend.direction === 'declining' && <TrendingDown className="h-4 w-4" />}
                                    {clarityTrend.direction === 'stable' && <Minus className="h-4 w-4" />}
                                    {clarityTrend.direction}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Simple line chart visualization */}
                                {clarityTrend.dataPoints.length > 0 && (
                                    <div className="h-24 flex items-end gap-2">
                                        {clarityTrend.dataPoints.map((point, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-blue-600/30 rounded-t relative group"
                                                style={{ height: `${point.score}% ` }}
                                            >
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                                                    {point.score}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <div className="text-sm font-medium text-slate-300 mb-2">What this means</div>
                                    <div className="text-sm text-slate-400">{clarityTrend.explanation}</div>
                                </div>

                                <div className="pt-4 border-t border-[#1E293B]">
                                    <div className="text-sm font-medium text-white mb-2">Next action</div>
                                    <div className="text-sm text-slate-300">{clarityTrend.suggestedAction}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top 3 Recurring Errors */}
                    <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Top Recurring Errors</h2>

                        {topErrors.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                No recurring error patterns detected yet. Complete more speaking tasks to identify areas for improvement.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {topErrors.map((error, i) => (
                                    <div key={i} className="bg-[#1E293B] rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-400 flex items-center justify-center text-sm font-bold">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium capitalize">{error.type} error</div>
                                                    <div className="text-xs text-slate-400">Occurred {error.count} times</div>
                                                </div>
                                            </div>
                                            <AlertCircle className="h-5 w-5 text-amber-400" />
                                        </div>

                                        <div className="space-y-3">
                                            {error.examples.length > 0 && (
                                                <div>
                                                    <div className="text-xs font-medium text-slate-400 mb-1">Examples</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {error.examples.map((example, idx) => (
                                                            <span key={idx} className="text-xs px-2 py-1 rounded bg-[#0F1729] text-slate-300">
                                                                {example}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <div className="text-xs font-medium text-slate-300 mb-1">What this means</div>
                                                <div className="text-xs text-slate-400">{error.explanation}</div>
                                            </div>

                                            <div className="pt-2 border-t border-[#2D3B4F]">
                                                <div className="text-xs font-medium text-white mb-1">Next action</div>
                                                <div className="text-xs text-slate-300">{error.suggestedAction}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-6">
                        <Link
                            href="/learn"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
                        >
                            Continue Learning
                        </Link>
                    </div>
                </div>
            </main>
        </AppLayout>
    );
}
