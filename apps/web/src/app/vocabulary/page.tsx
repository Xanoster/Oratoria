'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, Volume2, BookOpen, Filter } from 'lucide-react';
import { useTTS } from '@/lib/hooks/useTTS';

interface VocabularyItem {
    id: string;
    word: string;
    translation: string;
    level: string;
    example?: string;
    category: string;
}

const SAMPLE_VOCABULARY: VocabularyItem[] = [
    { id: '1', word: 'Guten Tag', translation: 'Good day', level: 'A1', category: 'Greetings', example: 'Guten Tag, wie geht es Ihnen?' },
    { id: '2', word: 'Danke', translation: 'Thank you', level: 'A1', category: 'Greetings', example: 'Vielen Dank für Ihre Hilfe.' },
    { id: '3', word: 'Bitte', translation: 'Please / You\'re welcome', level: 'A1', category: 'Greetings', example: 'Bitte schön!' },
    { id: '4', word: 'Entschuldigung', translation: 'Excuse me / Sorry', level: 'A1', category: 'Greetings', example: 'Entschuldigung, wo ist der Bahnhof?' },
    { id: '5', word: 'Ja', translation: 'Yes', level: 'A1', category: 'Basics', example: 'Ja, das stimmt.' },
    { id: '6', word: 'Nein', translation: 'No', level: 'A1', category: 'Basics', example: 'Nein, danke.' },
    { id: '7', word: 'Wasser', translation: 'Water', level: 'A1', category: 'Food & Drinks', example: 'Ich möchte ein Glas Wasser.' },
    { id: '8', word: 'Kaffee', translation: 'Coffee', level: 'A1', category: 'Food & Drinks', example: 'Einen Kaffee, bitte.' },
    { id: '9', word: 'Brot', translation: 'Bread', level: 'A1', category: 'Food & Drinks', example: 'Das Brot ist frisch.' },
    { id: '10', word: 'Haus', translation: 'House', level: 'A1', category: 'Places', example: 'Das Haus ist groß.' },
    { id: '11', word: 'Bahnhof', translation: 'Train station', level: 'A1', category: 'Places', example: 'Der Bahnhof ist in der Nähe.' },
    { id: '12', word: 'Arbeit', translation: 'Work', level: 'A1', category: 'Daily Life', example: 'Ich gehe zur Arbeit.' },
    { id: '13', word: 'Familie', translation: 'Family', level: 'A1', category: 'People', example: 'Meine Familie wohnt in Berlin.' },
    { id: '14', word: 'Freund', translation: 'Friend (male)', level: 'A1', category: 'People', example: 'Das ist mein Freund Max.' },
    { id: '15', word: 'Freundin', translation: 'Friend (female)', level: 'A1', category: 'People', example: 'Meine Freundin heißt Anna.' },
    { id: '16', word: 'heute', translation: 'Today', level: 'A1', category: 'Time', example: 'Heute ist Montag.' },
    { id: '17', word: 'morgen', translation: 'Tomorrow', level: 'A1', category: 'Time', example: 'Morgen gehe ich einkaufen.' },
    { id: '18', word: 'gestern', translation: 'Yesterday', level: 'A1', category: 'Time', example: 'Gestern war ich im Kino.' },
    { id: '19', word: 'schön', translation: 'Beautiful / Nice', level: 'A1', category: 'Adjectives', example: 'Das Wetter ist schön.' },
    { id: '20', word: 'groß', translation: 'Big / Tall', level: 'A1', category: 'Adjectives', example: 'Das Haus ist sehr groß.' },
];

const CATEGORIES = ['All', 'Greetings', 'Basics', 'Food & Drinks', 'Places', 'Daily Life', 'People', 'Time', 'Adjectives'];
const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2'];

function SkeletonCard() {
    return (
        <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
            </div>
        </div>
    );
}

export default function VocabularyPage() {
    const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { speak, isSpeaking } = useTTS();

    useEffect(() => {
        const timer = setTimeout(() => {
            setVocabulary(SAMPLE_VOCABULARY);
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const filteredVocabulary = vocabulary.filter(item => {
        const matchesSearch =
            item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.translation.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        const matchesLevel = selectedLevel === 'All' || item.level === selectedLevel;
        return matchesSearch && matchesCategory && matchesLevel;
    });

    const handleSpeak = (text: string) => {
        speak(text);
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-screen p-8 bg-[#F0FDF4]">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <div className="animate-pulse h-8 bg-gray-200 rounded w-48 mb-8" />
                        <div className="animate-pulse h-12 bg-gray-200 rounded-xl mb-6" />
                        {[1, 2, 3, 4, 5].map(i => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="min-h-screen p-8 bg-[#F0FDF4]">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Vocabulary</h1>
                            <p className="text-gray-500 text-sm">{filteredVocabulary.length} words</p>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="mb-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search words..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-gray-500" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-emerald-500"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-emerald-500"
                            >
                                {LEVELS.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Vocabulary List */}
                    <div className="space-y-3">
                        {filteredVocabulary.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                No words found matching your search.
                            </div>
                        ) : (
                            filteredVocabulary.map(item => (
                                <div
                                    key={item.id}
                                    className={`bg-white border border-gray-200 rounded-xl p-4 transition-all cursor-pointer hover:border-emerald-300 hover:shadow-sm ${expandedId === item.id ? 'border-emerald-400 shadow-sm' : ''
                                        }`}
                                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSpeak(item.word);
                                                }}
                                                disabled={isSpeaking}
                                                className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center hover:bg-emerald-200 transition-colors disabled:opacity-50"
                                            >
                                                <Volume2 className="h-5 w-5 text-emerald-600" />
                                            </button>
                                            <div>
                                                <p className="text-lg font-medium text-gray-900">{item.word}</p>
                                                <p className="text-gray-500">{item.translation}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                                {item.category}
                                            </span>
                                            <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
                                                {item.level}
                                            </span>
                                        </div>
                                    </div>

                                    {expandedId === item.id && item.example && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-sm text-gray-500 mb-1">Example:</p>
                                            <p className="text-gray-700 italic">"{item.example}"</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSpeak(item.example!);
                                                }}
                                                disabled={isSpeaking}
                                                className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                            >
                                                <Volume2 className="h-4 w-4" />
                                                Listen to example
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
