'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { startSpeechRecognition, speakText } from '@/lib/speech/speech';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    translation?: string;
    audioUrl?: string; // Future TTS
}

export default function RoleplayPage() {
    const params = useParams();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [persona, setPersona] = useState('Assistant');
    const [setting, setSetting] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [turns, setTurns] = useState(0);
    const maxTurns = 6;

    const stopRecognitionRef = useRef<(() => void) | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial Load
    useEffect(() => {
        const initSession = async () => {
            try {
                const res = await fetch('/api/roleplay/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scenarioId: params.id })
                });

                if (!res.ok) throw new Error('Failed to start session');

                const data = await res.json();

                setPersona(data.persona);
                setSetting(data.setting);

                // Add greeting
                setMessages([{
                    id: 'greeting',
                    role: 'model',
                    text: data.greeting.german,
                    translation: data.greeting.english
                }]);

                // Speak greeting (optional)
                speakText(data.greeting.german);

            } catch (err) {
                console.error('API Error, using fallback:', err);
                // Fallback for MVP testing even if DB is offline
                setPersona('Friendly Baker (Offline)');
                setSetting('A cozy bakery (Offline Mode)');
                setMessages([{
                    id: 'fallback',
                    role: 'model',
                    text: 'Guten Morgen! Was möchten Sie? (Offline Mode)',
                    translation: 'Good morning! What would you like?'
                }]);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            initSession();
        }
    }, [params.id]);

    const handleRecord = () => {
        if (isRecording) {
            // Stop logic
            if (stopRecognitionRef.current) {
                stopRecognitionRef.current();
                stopRecognitionRef.current = null;
            }
            setIsRecording(false);
            return;
        }

        // Start logic
        stopRecognitionRef.current = startSpeechRecognition({
            onStart: () => setIsRecording(true),
            onResult: () => { }, // Can show live transcript if desired
            onError: (err) => setError(err),
            onEnd: async (transcript) => {
                setIsRecording(false);
                if (transcript && transcript.trim()) {
                    await handleTurn(transcript);
                }
            }
        });
    };

    const handleTurn = async (userText: string) => {
        // Optimistic UI update
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: userText
        };
        setMessages(prev => [...prev, userMsg]);
        setTurns(prev => prev + 1);

        try {
            // Call API
            const res = await fetch('/api/roleplay/turn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenarioId: params.id, // In real app, sessionId
                    userMessage: userText,
                    history: messages.map(m => ({ role: m.role, text: m.text }))
                })
            });

            let responseData;

            if (res.ok) {
                const data = await res.json();
                responseData = data.response;
            } else {
                // Fallback script if API fails
                responseData = {
                    german: 'Das verstehe ich gut. (Offline Reply)',
                    english: 'I understand that well.'
                };
            }

            const modelMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseData.german,
                translation: responseData.english
            };

            setMessages(prev => [...prev, modelMsg]);
            speakText(responseData.german);

        } catch (err) {
            console.error('Turn error:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#c17767] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#faf8f5] max-w-4xl mx-auto shadow-2xl overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-[#e2e8f0] p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>←</Button>
                    <div>
                        <h1 className="font-bold text-[#2d1b0e]">{persona}</h1>
                        <p className="text-xs text-[#8b7355] truncate max-w-[150px]">{setting}</p>
                    </div>
                </div>
                <div className="text-xs font-bold px-2 py-1 bg-[#f0f4f8] rounded-full text-[#5c4a3a]">
                    Turn {turns} / {maxTurns}
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <div
                            className={`
                                max-w-[85%] rounded-2xl p-4 shadow-sm text-sm leading-relaxed
                                ${msg.role === 'user'
                                    ? 'bg-[#c17767] text-white rounded-br-none'
                                    : 'bg-white text-[#2d1b0e] border border-[#e2e8f0] rounded-bl-none'}
                            `}
                        >
                            <p>{msg.text}</p>
                        </div>
                        {msg.translation && (
                            <p className="text-xs text-[#8b7355] mt-1 px-2">
                                {msg.translation}
                            </p>
                        )}
                    </div>
                ))}

                {error && (
                    <div className="mx-auto bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-[#e2e8f0]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRecord}
                        className={`
                            w-full py-4 rounded-2xl font-bold transition-all transform active:scale-95 shadow-md flex items-center justify-center gap-2
                            ${isRecording
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-gradient-to-r from-[#c17767] to-[#8b5e3c] text-white hover:shadow-lg'}
                        `}
                    >
                        {isRecording ? (
                            <>
                                <span className="w-3 h-3 bg-white rounded-full animate-bounce"></span>
                                Listening... Use 'Stop' to send
                            </>
                        ) : (
                            <>
                                <span>🎤</span> Tap to Speak
                            </>
                        )}
                    </button>
                </div>
                <p className="text-center text-xs text-[#8b7355] mt-3">
                    {isRecording ? 'Tap again to stop and send' : 'Speak clearly in German'}
                </p>
            </div>
        </div>
    );
}
