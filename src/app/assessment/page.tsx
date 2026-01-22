'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

// Assessment task definitions
const ASSESSMENT_TASKS = [
    // English → German translation (V2 word order)
    {
        id: 1,
        type: 'translation',
        instruction: 'Translate to German:',
        prompt: 'Today I go to the bakery.',
        expected: 'Heute gehe ich zur Bäckerei.',
        grammarFocus: 'VERB_POSITION',
        hints: ['Remember: verb in second position']
    },
    // Article recognition
    {
        id: 2,
        type: 'translation',
        instruction: 'Translate to German:',
        prompt: 'The man has a dog.',
        expected: 'Der Mann hat einen Hund.',
        grammarFocus: 'ARTICLE',
        hints: ['Mann is masculine', 'Hund is masculine, accusative case']
    },
    // Dative case
    {
        id: 3,
        type: 'translation',
        instruction: 'Translate to German:',
        prompt: 'I give the woman a book.',
        expected: 'Ich gebe der Frau ein Buch.',
        grammarFocus: 'CASE',
        hints: ['Frau is feminine, dative case', 'Buch is neuter, accusative case']
    },
    // Accusative case
    {
        id: 4,
        type: 'translation',
        instruction: 'Translate to German:',
        prompt: 'I see the child.',
        expected: 'Ich sehe das Kind.',
        grammarFocus: 'CASE',
        hints: ['Kind is neuter']
    },
    // Perfekt tense
    {
        id: 5,
        type: 'translation',
        instruction: 'Translate to German (past tense):',
        prompt: 'I have eaten.',
        expected: 'Ich habe gegessen.',
        grammarFocus: 'TENSE',
        hints: ['Use Perfekt: haben/sein + past participle']
    },
    // V2 with time expression
    {
        id: 6,
        type: 'translation',
        instruction: 'Translate to German:',
        prompt: 'Tomorrow we will go shopping.',
        expected: 'Morgen gehen wir einkaufen.',
        grammarFocus: 'VERB_POSITION',
        hints: ['Time at start = verb second, subject third']
    },
    // Separable verb
    {
        id: 7,
        type: 'translation',
        instruction: 'Translate to German:',
        prompt: 'I get up at 7 o\'clock.',
        expected: 'Ich stehe um 7 Uhr auf.',
        grammarFocus: 'VERB_POSITION',
        hints: ['aufstehen is separable']
    },
    // Preposition with dative
    {
        id: 8,
        type: 'translation',
        instruction: 'Translate to German:',
        prompt: 'I am at home.',
        expected: 'Ich bin zu Hause.',
        grammarFocus: 'PREPOSITION',
        hints: ['zu Hause is an idiom']
    },
    // Repeat task (spoken input simulation - will be typed for now)
    {
        id: 9,
        type: 'repeat',
        instruction: 'Type this German sentence exactly:',
        prompt: 'Ich möchte ein Brot kaufen.',
        expected: 'Ich möchte ein Brot kaufen.',
        grammarFocus: 'ACCURACY',
        hints: ['Copy exactly with correct spelling']
    },
    {
        id: 10,
        type: 'repeat',
        instruction: 'Type this German sentence exactly:',
        prompt: 'Können Sie mir helfen?',
        expected: 'Können Sie mir helfen?',
        grammarFocus: 'ACCURACY',
        hints: ['Watch for special characters: ö']
    }
];

interface TaskResult {
    taskId: number;
    userInput: string;
    expected: string;
    isCorrect: boolean;
    grammarFocus: string;
}

export default function AssessmentPage() {
    const router = useRouter();
    const [currentTask, setCurrentTask] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [results, setResults] = useState<TaskResult[]>([]);
    const [showHint, setShowHint] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assessmentComplete, setAssessmentComplete] = useState(false);
    const [inferredLevel, setInferredLevel] = useState<string | null>(null);

    const task = ASSESSMENT_TASKS[currentTask];
    const progress = ((currentTask) / ASSESSMENT_TASKS.length) * 100;

    // Normalize text for comparison
    const normalizeText = (text: string): string => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[.,!?]/g, '')
            .replace(/\s+/g, ' ');
    };

    const checkAnswer = (): boolean => {
        const normalized = normalizeText(userInput);
        const expectedNormalized = normalizeText(task.expected);

        // Exact match or very close (allow minor typos)
        if (normalized === expectedNormalized) return true;

        // Check Levenshtein distance for near-matches
        const distance = levenshteinDistance(normalized, expectedNormalized);
        const maxAllowedDistance = Math.floor(expectedNormalized.length * 0.15); // 15% error tolerance
        return distance <= maxAllowedDistance;
    };

    const levenshteinDistance = (a: string, b: string): number => {
        const matrix: number[][] = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    const handleSubmit = async () => {
        if (!userInput.trim()) return;

        const isCorrect = checkAnswer();
        const result: TaskResult = {
            taskId: task.id,
            userInput: userInput.trim(),
            expected: task.expected,
            isCorrect,
            grammarFocus: task.grammarFocus
        };

        const newResults = [...results, result];
        setResults(newResults);

        if (currentTask < ASSESSMENT_TASKS.length - 1) {
            setCurrentTask(currentTask + 1);
            setUserInput('');
            setShowHint(false);
        } else {
            // Assessment complete - submit results
            setIsSubmitting(true);
            try {
                const response = await fetch('/api/assessment/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ results: newResults })
                });

                if (response.ok) {
                    const data = await response.json();
                    setInferredLevel(data.cefrLevel);
                    setAssessmentComplete(true);
                }
            } catch (error) {
                console.error('Failed to submit assessment:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (assessmentComplete) {
        return (
            <div className="min-h-screen bg-[#faf5f0] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-20 h-20 bg-[#6b8e23] rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl text-white">✓</span>
                    </div>
                    <h1 className="font-serif text-2xl font-bold text-[#2d1b0e] mb-4">
                        Assessment Complete!
                    </h1>
                    <p className="text-[#5c4a3a] mb-6">
                        Based on your performance, we've placed you at:
                    </p>
                    <div className="bg-[#faf5f0] rounded-xl p-6 mb-6">
                        <span className="text-4xl font-bold text-[#c17767]">
                            {inferredLevel}
                        </span>
                        <p className="text-sm text-[#8b7355] mt-2">
                            {inferredLevel === 'A0' && 'Complete Beginner'}
                            {inferredLevel === 'A1' && 'Elementary German'}
                            {inferredLevel === 'A2' && 'Pre-Intermediate German'}
                            {inferredLevel === 'B1' && 'Intermediate German'}
                        </p>
                    </div>
                    <p className="text-sm text-[#8b7355] mb-6">
                        Your personalized learning path has been created based on your current abilities.
                    </p>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className="w-full"
                        size="lg"
                    >
                        Start Learning
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf5f0]">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-2 bg-[#e2d5c7]">
                <div
                    className="h-full bg-[#c17767] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="max-w-2xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="font-serif text-2xl font-bold text-[#2d1b0e] mb-2">
                        German Level Assessment
                    </h1>
                    <p className="text-[#8b7355]">
                        Task {currentTask + 1} of {ASSESSMENT_TASKS.length}
                    </p>
                </div>

                {/* Task Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* Task Type Badge */}
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-sm font-medium text-[#8b7355] bg-[#faf5f0] px-3 py-1 rounded-full">
                            {task.type === 'translation' ? '🔄 Translation' : '🗣️ Repeat'}
                        </span>
                        <span className="text-sm text-[#8b7355]">
                            {task.grammarFocus.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Instruction */}
                    <p className="text-[#5c4a3a] mb-3">{task.instruction}</p>

                    {/* Prompt */}
                    <div className="bg-[#faf5f0] rounded-xl p-4 mb-6">
                        <p className="text-xl font-medium text-[#2d1b0e]">
                            {task.prompt}
                        </p>
                    </div>

                    {/* Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-[#5c4a3a] mb-2">
                            Your answer in German:
                        </label>
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your German answer here..."
                            className="w-full p-4 border border-[#e2d5c7] rounded-xl focus:ring-2 focus:ring-[#c17767] focus:border-transparent resize-none text-lg"
                            rows={2}
                            autoFocus
                        />
                    </div>

                    {/* Hint Toggle */}
                    <div className="mb-6">
                        <button
                            onClick={() => setShowHint(!showHint)}
                            className="text-sm text-[#c17767] hover:underline"
                        >
                            {showHint ? 'Hide hint' : 'Need a hint?'}
                        </button>
                        {showHint && (
                            <div className="mt-2 p-3 bg-[#fef4e6] rounded-lg text-sm text-[#8b7355]">
                                💡 {task.hints[0]}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={!userInput.trim() || isSubmitting}
                        className="w-full"
                        size="lg"
                        isLoading={isSubmitting}
                    >
                        {currentTask < ASSESSMENT_TASKS.length - 1 ? 'Next Task' : 'Complete Assessment'}
                    </Button>

                    {/* Cannot Skip Notice */}
                    <p className="text-center text-xs text-[#8b7355] mt-4">
                        ⚠️ You must provide an answer to continue
                    </p>
                </div>

                {/* Results Summary (small) */}
                {results.length > 0 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {results.map((r, i) => (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-full ${r.isCorrect ? 'bg-[#6b8e23]' : 'bg-[#c17767]'
                                    }`}
                                title={r.isCorrect ? 'Correct' : 'Incorrect'}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
