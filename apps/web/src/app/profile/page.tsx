'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppLayout from '@/components/AppLayout';
import { useAuth, getAvatarUrl } from '@/lib/auth';
import { Mail, Calendar, Award, Edit2 } from 'lucide-react';

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');

    const [profileData, setProfileData] = useState<any>(null);
    const [progressStats, setProgressStats] = useState<any>(null);

    useEffect(() => {
        if (!user) return;

        // Fetch profile details (for join date & real name)
        fetch('/api/v1/user/me', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setProfileData(data);
                    setEditName(data.name || user.email?.split('@')[0]);
                }
            });

        // Fetch progress stats
        fetch('/api/v1/user/progress', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => setProgressStats(data));

    }, [user]);

    async function handleSaveProfile() {
        try {
            await fetch('/api/v1/user/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName }),
            });
            // Update local state without reload
            setProfileData((prev: any) => ({ ...prev, name: editName }));
            setIsEditing(false);
        } catch (e) {
            console.error('Failed to update profile', e);
        }
    }

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </AppLayout>
        );
    }

    if (!user) return null;

    const avatarUrl = getAvatarUrl(user.email || user.id);
    const userName = profileData?.name || user.email?.split('@')[0] || 'User';
    const joinDate = profileData?.createdAt
        ? new Date(profileData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '...';

    return (
        <AppLayout>
            <div className="min-h-screen p-8">
                <div className="max-w-2xl mx-auto">
                    {/* Profile Header */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 text-center">
                        {/* Avatar */}
                        <div className="relative inline-block mb-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500/30 bg-gray-100">
                                <img
                                    src={avatarUrl}
                                    alt="Profile avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-gray-900 hover:bg-emerald-600 transition-colors"
                                title="Edit avatar"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Name */}
                        {isEditing ? (
                            <div className="mb-4 flex justify-center">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="bg-gray-100 border border-emerald-500/50 rounded-lg px-4 py-2 text-gray-900 text-center focus:outline-none focus:border-blue-500"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{userName}</h1>
                        )}

                        {/* Email */}
                        <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                        </div>

                        {/* Join Date */}
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-6">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {joinDate}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-center gap-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-900 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-[#2D3B54] text-gray-900 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await fetch('/api/v1/auth/logout', { method: 'POST' });
                                                router.push('/');
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-1">{progressStats?.level || 'A1'}</div>
                            <div className="text-sm text-gray-500">Current Level</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-1">{progressStats?.speaking?.sessionsCompleted || 0}</div>
                            <div className="text-sm text-gray-500">Sessions</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-1">{progressStats?.vocabulary?.itemsLearned || 0}</div>
                            <div className="text-sm text-gray-500">Words Learned</div>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="h-5 w-5 text-yellow-500" />
                            Achievements
                        </h2>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-yellow-600/20 border border-yellow-600/30 flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl">🎯</span>
                                </div>
                                <div className="text-xs text-gray-500">First Lesson</div>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl">🗣️</span>
                                </div>
                                <div className="text-xs text-gray-500">First Speech</div>
                            </div>
                            <div className="text-center opacity-40">
                                <div className="w-12 h-12 rounded-full bg-gray-100 border border-[#2D3B54] flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl">🏆</span>
                                </div>
                                <div className="text-xs text-gray-400">Locked</div>
                            </div>
                            <div className="text-center opacity-40">
                                <div className="w-12 h-12 rounded-full bg-gray-100 border border-[#2D3B54] flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl">⭐</span>
                                </div>
                                <div className="text-xs text-gray-400">Locked</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
