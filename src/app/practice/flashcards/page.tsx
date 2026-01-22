'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FlashcardSession from '@/components/flashcards/FlashcardSession';

interface FlashcardData {
    id: string;
    sentenceId: string;
    sentence: {
        englishText: string;
        germanText: string;
    };
}

export default function FlashcardsPage() {
    const router = useRouter();
    const [cards, setCards] = useState<FlashcardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCards() {
            try {
                // Use same SRS queue endpoint
                const res = await fetch('/api/srs/queue');
                if (!res.ok) throw new Error('Failed to fetch cards');

                const data = await res.json();
                setCards(data.items || []);
            } catch (err) {
                setError('Failed to load flashcards');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCards();
    }, []);

    const handleCardGraded = async (cardId: string, quality: number) => {
        try {
            await fetch('/api/srs/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    srsStateId: cardId,
                    quality,
                    outputType: 'flashcard'
                })
            });
        } catch (err) {
            console.error('Failed to update card:', err);
        }
    };

    const handleComplete = () => {
        router.push('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#faf5f0] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#c17767] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#faf5f0] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-[#c17767] hover:underline"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div className="min-h-screen bg-[#faf5f0] flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-[#f0f7e6] rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🎉</span>
                    </div>
                    <h1 className="font-serif text-2xl font-bold text-[#2d1b0e] mb-2">
                        All Caught Up!
                    </h1>
                    <p className="text-[#8b7355] mb-6">
                        You've reviewed all your flashcards for now. Great work!
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3 bg-[#c17767] text-white rounded-xl hover:bg-[#a96557] transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf5f0] py-8">
            <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-bold text-[#2d1b0e]">
                    Flashcard Practice
                </h1>
                <p className="text-[#8b7355] mt-2">
                    Review your German vocabulary
                </p>
            </div>

            <FlashcardSession
                cards={cards.map(c => ({
                    id: c.id,
                    englishText: c.sentence.englishText,
                    germanText: c.sentence.germanText
                }))}
                onComplete={handleComplete}
                onCardGraded={handleCardGraded}
            />
        </div>
    );
}
