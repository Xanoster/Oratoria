'use client';

import React from 'react';

interface FlashcardProps {
    front: string;  // English
    back: string;   // German
    onFlip?: () => void;
}

export default function Flashcard({ front, back, onFlip }: FlashcardProps) {
    const [isFlipped, setIsFlipped] = React.useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        onFlip?.();
    };

    return (
        <div
            className="perspective-1000 w-full max-w-md mx-auto cursor-pointer"
            onClick={handleFlip}
        >
            <div
                className={`
                    relative w-full h-80 transition-transform duration-500 transform-style-3d
                    ${isFlipped ? 'rotate-y-180' : ''}
                `}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front Side - English */}
                <div
                    className={`
                        absolute w-full h-full bg-white rounded-2xl shadow-2xl
                        flex flex-col items-center justify-center p-8 backface-hidden border-2 border-[#e2d5c7]
                        ${isFlipped ? 'invisible' : 'visible'}
                    `}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <p className="text-sm text-[#8b7355] mb-4 uppercase tracking-wide">English → German</p>
                    <p className="text-2xl font-medium text-center text-[#2d1b0e]">{front}</p>
                    <p className="text-xs text-[#8b7355] mt-8">Tap to reveal German</p>
                </div>

                {/* Back Side - German */}
                <div
                    className={`
                        absolute w-full h-full bg-gradient-to-br from-[#c17767] to-[#8b5e3c] rounded-2xl shadow-2xl
                        flex flex-col items-center justify-center p-8 backface-hidden
                        ${!isFlipped ? 'invisible' : 'visible'}
                    `}
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                    }}
                >
                    <p className="text-sm text-white/80 mb-4 uppercase tracking-wide">German</p>
                    <p className="text-3xl font-bold text-center text-white">{back}</p>
                    <p className="text-xs text-white/70 mt-8">Tap to flip back</p>
                </div>
            </div>
        </div>
    );
}
