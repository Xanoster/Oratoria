'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Mic, Send, HelpCircle, Pause, Volume2 } from 'lucide-react';

const SCENARIOS = [
    {
        id: 'bakery',
        title: 'At the Bakery',
        persona: 'You are at a German bakery. The baker greets you warmly.',
        level: 'A1',
        aiGreeting: 'Guten Morgen! Was darf es sein?',
    },
    {
        id: 'doctor',
        title: "Doctor's Office",
        persona: 'You are at a doctor\'s office for a check-up. The receptionist asks about your appointment.',
        level: 'A2',
        aiGreeting: 'Guten Tag! Haben Sie einen Termin?',
    },
    {
        id: 'interview',
        title: 'Job Interview',
        persona: 'You are in a job interview. The interviewer asks you to introduce yourself.',
        level: 'B1',
        aiGreeting: 'Willkommen! Bitte stellen Sie sich vor.',
    },
];

interface Message {
    role: 'user' | 'ai';
    content: string;
    correction?: string;
}

export default function RoleplayPage() {
    const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: SCENARIOS[0].aiGreeting }
    ]);
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    function handleScenarioChange(id: string) {
        const scenario = SCENARIOS.find(s => s.id === id);
        if (scenario) {
            setSelectedScenario(scenario);
            setMessages([{ role: 'ai', content: scenario.aiGreeting }]);
        }
    }

    function handleRecord() {
        setIsRecording(!isRecording);
        // Simulated response after recording
        if (isRecording) {
            setTimeout(() => {
                setMessages(prev => [
                    ...prev,
                    { role: 'user', content: 'Ich möchte ein Brötchen bitte.' },
                    {
                        role: 'ai',
                        content: 'Sehr gerne! Welches Brötchen möchten Sie? Wir haben Vollkorn, Weizen, und Mehrkorn.',
                    }
                ]);
            }, 500);
        }
    }

    return (
        <AppLayout>
            <div className="min-h-screen p-8">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Roleplay</h1>
                        <p className="text-slate-400">Practice real-world conversations with AI</p>
                    </div>

                    {/* Scenario Selector */}
                    <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-4 mb-6">
                        <label className="block text-sm text-slate-400 mb-2">Select scenario</label>
                        <select
                            value={selectedScenario.id}
                            onChange={(e) => handleScenarioChange(e.target.value)}
                            className="w-full bg-[#0A0E1A] border border-[#1E293B] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-600"
                        >
                            {SCENARIOS.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.title} ({s.level})
                                </option>
                            ))}
                        </select>
                        <p className="text-slate-500 text-sm mt-3">{selectedScenario.persona}</p>
                    </div>

                    {/* Chat Area */}
                    <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl overflow-hidden mb-6">
                        {/* Messages */}
                        <div className="p-6 space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-[#1E293B] text-slate-200'
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        {msg.correction && (
                                            <p className="text-sm text-yellow-400 mt-2 border-t border-white/20 pt-2">
                                                💡 {msg.correction}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="border-t border-[#1E293B] p-4 flex items-center justify-between gap-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsPaused(!isPaused)}
                                    className="p-3 rounded-lg bg-[#1E293B] text-slate-400 hover:text-white hover:bg-[#2D3B54] transition-all"
                                    title="Pause & Coach"
                                >
                                    <Pause className="h-5 w-5" />
                                </button>
                                <button
                                    className="p-3 rounded-lg bg-[#1E293B] text-slate-400 hover:text-white hover:bg-[#2D3B54] transition-all"
                                    title="Get hint"
                                >
                                    <HelpCircle className="h-5 w-5" />
                                </button>
                                <button
                                    className="p-3 rounded-lg bg-[#1E293B] text-slate-400 hover:text-white hover:bg-[#2D3B54] transition-all"
                                    title="Play last AI message"
                                >
                                    <Volume2 className="h-5 w-5" />
                                </button>
                            </div>

                            <button
                                onClick={handleRecord}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${isRecording
                                        ? 'bg-red-600 text-white animate-pulse'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                <Mic className="h-5 w-5" />
                                {isRecording ? 'Recording...' : 'Speak'}
                            </button>
                        </div>
                    </div>

                    {/* Paused Coach Mode */}
                    {isPaused && (
                        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-6">
                            <h3 className="text-yellow-500 font-semibold mb-2">⏸ Coaching Mode</h3>
                            <p className="text-slate-300 text-sm mb-4">
                                Take your time. Here's what you could say next:
                            </p>
                            <p className="text-white bg-[#1E293B] rounded-lg px-4 py-3">
                                "Ein Vollkornbrötchen, bitte."
                            </p>
                            <button
                                onClick={() => setIsPaused(false)}
                                className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                            >
                                Resume conversation →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
