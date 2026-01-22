'use client';

import React, { useState, useRef, useEffect } from 'react';

interface OutputCaptureProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    disabled?: boolean;
    showSpeechButton?: boolean;
}

export default function OutputCapture({
    value,
    onChange,
    onSubmit,
    placeholder = 'Type your German answer here...',
    disabled = false,
    showSpeechButton = true
}: OutputCaptureProps) {
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Check for Web Speech API support
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            setSpeechSupported(!!SpeechRecognition);

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'de-DE'; // German

                recognitionRef.current.onresult = (event: any) => {
                    let transcript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        transcript += event.results[i][0].transcript;
                    }
                    onChange(transcript);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [onChange]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                onSubmit();
            }
        }
    };

    const hasOutput = value.trim().length > 0;

    return (
        <div className="space-y-3">
            {/* Text Input */}
            <div className="relative">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || isListening}
                    className={`
                        w-full p-4 pr-12 border rounded-xl resize-none text-lg
                        focus:ring-2 focus:ring-[#c17767] focus:border-transparent
                        transition-all duration-200
                        ${hasOutput ? 'border-[#6b8e23] bg-[#f8fdf5]' : 'border-[#e2d5c7]'}
                        ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
                    `}
                    rows={2}
                    autoFocus
                />

                {/* Output Indicator */}
                {hasOutput && (
                    <div className="absolute right-3 top-3">
                        <span className="text-[#6b8e23] text-xl">✓</span>
                    </div>
                )}
            </div>

            {/* Speech Button */}
            {showSpeechButton && speechSupported && (
                <button
                    type="button"
                    onClick={toggleListening}
                    disabled={disabled}
                    className={`
                        flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                        transition-all duration-200 text-sm font-medium
                        ${isListening
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-[#faf5f0] text-[#5c4a3a] hover:bg-[#e2d5c7]'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    {isListening ? (
                        <>
                            <span className="w-3 h-3 bg-white rounded-full animate-ping" />
                            Listening... Click to stop
                        </>
                    ) : (
                        <>
                            🎤 Speak in German
                        </>
                    )}
                </button>
            )}

            {/* No Speech Support Message */}
            {showSpeechButton && !speechSupported && (
                <p className="text-xs text-[#8b7355]">
                    🎤 Speech input not supported in this browser
                </p>
            )}

            {/* Output Required Notice */}
            {!hasOutput && (
                <p className="text-xs text-[#c17767] flex items-center gap-1">
                    ⚠️ You must produce German output to continue
                </p>
            )}
        </div>
    );
}

