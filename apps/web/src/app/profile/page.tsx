'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppLayout from '@/components/AppLayout';
import { useAuth, getAvatarUrl } from '@/lib/auth';
import { Mail, Calendar, Award, Edit2 } from 'lucide-react';

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth?redirect=/profile');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-slate-400">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    const avatarUrl = getAvatarUrl(user.email || user.id);
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <AppLayout>
            <div className="min-h-screen p-8">
                <div className="max-w-2xl mx-auto">
                    {/* Profile Header */}
                    <div className="bg-[#0F1729] border border-[#1E293B] rounded-2xl p-8 mb-8 text-center">
                        {/* Avatar */}
                        <div className="relative inline-block mb-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-600/30 bg-[#1E293B]">
                                <img
                                    src={avatarUrl}
                                    alt="Profile avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                                title="Edit avatar"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Name */}
                        <h1 className="text-2xl font-bold text-white mb-2">{userName}</h1>

                        {/* Email */}
                        <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                        </div>

                        {/* Join Date */}
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {joinDate}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-white mb-1">A1</div>
                            <div className="text-sm text-slate-400">Current Level</div>
                        </div>
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-white mb-1">12</div>
                            <div className="text-sm text-slate-400">Sessions</div>
                        </div>
                        <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-white mb-1">45</div>
                            <div className="text-sm text-slate-400">Words Learned</div>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="bg-[#0F1729] border border-[#1E293B] rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-500" />
                            Achievements
                        </h2>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-yellow-600/20 border border-yellow-600/30 flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl">🎯</span>
                                </div>
                                <div className="text-xs text-slate-400">First Lesson</div>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl">🗣️</span>
                                </div>
                                <div className="text-xs text-slate-400">First Speech</div>
                            </div>
                            <div className="text-center opacity-40">
                                <div className="w-12 h-12 rounded-full bg-[#1E293B] border border-[#2D3B54] flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl">🏆</span>
                                </div>
                                <div className="text-xs text-slate-500">Locked</div>
                            </div>
                            <div className="text-center opacity-40">
                                <div className="w-12 h-12 rounded-full bg-[#1E293B] border border-[#2D3B54] flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl">⭐</span>
                                </div>
                                <div className="text-xs text-slate-500">Locked</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
