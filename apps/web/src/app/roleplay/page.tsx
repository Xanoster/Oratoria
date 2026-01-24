'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Mic, MicOff, Volume2, Send, ArrowLeft } from 'lucide-react';
import { useRecordControl } from '@/lib/hooks/useRecordControl';
import { useTextToSpeech } from '@/lib/hooks/useSpeech';
import { SCENARIOS } from '@/lib/ai/gemini';

interface Message {
    role: 'user' | 'ai';
    message: string;
    translation?: string;
    correction?: string;
}

// Listening animation component
function ListeningIndicator() {
    return (
        <div className="flex items-center gap-1">
            <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-6 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <div className="w-1 h-5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
            <div className="w-1 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
        </div>
    );
}

export default function RoleplayPage() {
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userLevel] = useState('A1');

    // Use robust record control hook
    const {
        state: recordState,
        transcript,
        startRecording,
        stopRecording
    } = useRecordControl({
        maxMs: 60000,
        silenceTimeoutMs: 2500,
        onTranscript: (text) => {
            if (text.trim()) {
                setInputText(text.trim());
                // Auto-send happens in separate effect or here?
                // For safety, let's just set input. 
                // Wait, useRecordControl calls onTranscript ONLY when finished/stopped/processed.
                // So this is the FINAL text. We can likely auto-send.
                sendMessage(text.trim());
            }
        },
    });

    // Sync live transcript to input
    useEffect(() => {
        if (recordState === 'recording' && transcript) {
            setInputText(transcript);
        }
    }, [recordState, transcript]);

    const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();

    // Start scenario with AI greeting
    useEffect(() => {
        if (selectedScenario && messages.length === 0) {
            const scenario = SCENARIOS[selectedScenario as keyof typeof SCENARIOS];
            if (scenario) {
                setMessages([{
                    role: 'ai',
                    message: scenario.starterDE,
                    translation: scenario.starterEN,
                }]);
                setTimeout(() => speak(scenario.starterDE), 500);
            }
        }
    }, [selectedScenario, messages.length, speak]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || !selectedScenario || isLoading) return;

        const userMessage: Message = { role: 'user', message: text };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/roleplay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenarioId: selectedScenario,
                    message: text,
                    history: messages,
                    level: userLevel,
                }),
            });

            if (!res.ok) throw new Error('Failed to get response');

            const data = await res.json();
            const aiMessage: Message = {
                role: 'ai',
                message: data.response,
                translation: data.translation,
                correction: data.correction,
            };
            setMessages(prev => [...prev, aiMessage]);
            speak(data.response);
        } catch (err) {
            console.error('Roleplay error:', err);
            setMessages(prev => [...prev, {
                role: 'ai',
                message: 'Entschuldigung, etwas ist schief gelaufen.',
                translation: 'Sorry, something went wrong.',
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMicClick = () => {
        if (recordState === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const isListening = recordState === 'recording';
    const isProcessing = recordState === 'processing';

    // Scenario selection
    if (!selectedScenario) {
        return (
            <AppLayout>
                <div className="min-h-screen p-8">
                    <div className="max-w-3xl mx-auto">
                        <h1 className="text-2xl font-bold text-white mb-2">🎭 Roleplay Scenarios</h1>
                        <p className="text-slate-400 mb-8">Practice real-world German conversations with AI</p>

                        <div className="grid gap-4">
                            {Object.entries(SCENARIOS).map(([id, scenario]) => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedScenario(id)}
                                    className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6 text-left hover:border-blue-600/50 hover:bg-[#0F1729]/80 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-semibold text-white">{scenario.title}</h3>
                                        <span className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                            {scenario.level}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-3">{scenario.context}</p>
                                    <div className="flex gap-4 text-xs text-slate-500">
                                        <span>👤 You: {scenario.userRole}</span>
                                        <span>🤖 AI: {scenario.aiRole}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const scenario = SCENARIOS[selectedScenario as keyof typeof SCENARIOS];

    return (
        <AppLayout>
            <div className="min-h-screen flex flex-col">
                {/* Header */}
                <div className="bg-[#0F1729] border-b border-[#1E293B] px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setSelectedScenario(null);
                                    setMessages([]);
                                    stopSpeaking();
                                    stopRecording();
                                }}
                                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-[#1E293B]"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-lg font-semibold text-white">{scenario.title}</h1>
                                <p className="text-sm text-slate-400">You: {scenario.userRole}</p>
                            </div>
                        </div>
                        {isListening && (
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                                <ListeningIndicator />
                                Listening...
                            </div>
                        )}
                        {isProcessing && (
                            <div className="flex items-center gap-2 text-blue-400 text-sm animate-pulse">
                                Processing speech...
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#1E293B] text-white'
                                }`}>
                                <p className="text-base">{msg.message}</p>
                                {msg.translation && (
                                    <p className="text-sm text-slate-300 mt-1 opacity-70 italic">{msg.translation}</p>
                                )}
                                {msg.correction && (
                                    <p className="text-sm text-amber-400 mt-2 border-t border-slate-600 pt-2">
                                        💡 {msg.correction}
                                    </p>
                                )}
                                {msg.role === 'ai' && (
                                    <button
                                        onClick={() => speak(msg.message)}
                                        className="mt-2 text-slate-400 hover:text-white flex items-center gap-1 text-xs"
                                        disabled={isSpeaking}
                                    >
                                        <Volume2 className="h-4 w-4" />
                                        {isSpeaking ? 'Speaking...' : 'Replay'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-[#1E293B] rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="bg-[#0F1729] border-t border-[#1E293B] p-4">
                    {/* Listening indicator */}
                    {isListening && (
                        <div className="flex items-center justify-center gap-3 mb-3 py-2 px-4 bg-red-900/20 border border-red-600/30 rounded-lg">
                            <span className="text-red-400 text-sm font-medium">
                                🎤 Listening...
                            </span>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage(inputText)}
                            placeholder={isListening ? "Listening..." : "Type in German or use the mic..."}
                            className="flex-1 bg-[#1E293B] border border-[#2D3B4F] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-600 transition-all"
                            disabled={isListening || isProcessing}
                        />
                        <button
                            onClick={handleMicClick}
                            disabled={isProcessing}
                            className={`p-3 rounded-xl transition-all ${isListening
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-110'
                                : 'bg-[#1E293B] text-slate-400 hover:text-white hover:bg-[#2D3B4F]'
                                }`}
                        >
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={() => sendMessage(inputText)}
                            disabled={!inputText.trim() || isLoading || isListening}
                            className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 mt-3 text-center">
                        🎤 Click mic to start
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
