'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import Flashcard from './Flashcard';

interface FlashcardData {
    id: string;
    englishText: string;
    germanText: string;
}

interface FlashcardSessionProps {
    cards: FlashcardData[];
    onComplete: () => void;
    onCardGraded: (cardId: string, quality: number) => void;
}

export default function FlashcardSession({ cards, onComplete, onCardGraded }: FlashcardSessionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasFlipped, setHasFlipped] = useState(false);

    const currentCard = cards[currentIndex];
    const progress = ((currentIndex + 1) / cards.length) * 100;

    const gradeCard = async (quality: number) => {
        if (!hasFlipped) {
            return; // Must flip card before grading
        }

        await onCardGraded(currentCard.id, quality);

        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setHasFlipped(false);
        } else {
            onComplete();
        }
    };

    if (!currentCard) {
        return (
            <div className="text-center py-12">
                <p className="text-[#8b7355]">No cards to review</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Progress */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-[#8b7355] mb-2">
                    <span>Card {currentIndex + 1} of {cards.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-[#e2d5c7] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#c17767] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Flashcard */}
            <Flashcard
                front={currentCard.englishText}
                back={currentCard.germanText}
                onFlip={() => setHasFlipped(true)}
            />

            {/* Grading Buttons */}
            {hasFlipped && (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                        onClick={() => gradeCard(0)}
                        className="bg-red-500 hover:bg-red-600"
                        size="lg"
                    >
                        Again
                    </Button>
                    <Button
                        onClick={() => gradeCard(0.3)}
                        className="bg-orange-500 hover:bg-orange-600"
                        size="lg"
                    >
                        Hard
                    </Button>
                    <Button
                        onClick={() => gradeCard(0.7)}
                        className="bg-[#6b8e23] hover:bg-[#5a7a1e]"
                        size="lg"
                    >
                        Good
                    </Button>
                    <Button
                        onClick={() => gradeCard(1)}
                        className="bg-[#4a7c59] hover:bg-[#3a6b49]"
                        size="lg"
                    >
                        Easy
                    </Button>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 text-center">
                <p className="text-sm text-[#8b7355]">
                    {hasFlipped
                        ? 'How well did you know this?'
                        : 'Click the card to reveal the German translation'}
                </p>
            </div>
        </div>
    );
}
