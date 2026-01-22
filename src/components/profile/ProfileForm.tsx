'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ProfileData {
    name: string;
    email: string;
    level: string;
    dailyGoal: number;
    srsRetention: number;
    errorRecovery: number;
    dailyShieldActive: boolean;
}

export default function ProfileForm({ initialData }: { initialData: ProfileData }) {
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState(initialData);

    // This would be replaced by a real Server Action or API call
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        // In a full implementation, we'd POST to /api/profile
        // For now, we simulate success
        setIsEditing(false);
        alert("Profile updated! (Persisted to DB in next iteration)");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Settings Card */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e2e8f0]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-xl text-[#2d1b0e]">Personal Information</h2>
                        {!isEditing && (
                            <Button variant="secondary" onClick={() => setIsEditing(true)}>
                                Edit Profile
                            </Button>
                        )}
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Display Name"
                                value={user.name}
                                onChange={e => setUser({ ...user, name: e.target.value })}
                                disabled={!isEditing}
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={user.email}
                                onChange={e => setUser({ ...user, email: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Current Level"
                                value={user.level}
                                disabled
                                className="bg-[#f8fafc] cursor-not-allowed"
                            />
                            <Input
                                label="Daily Goal (Minutes)"
                                type="number"
                                value={user.dailyGoal}
                                onChange={e => setUser({ ...user, dailyGoal: parseInt(e.target.value) })}
                                disabled={!isEditing}
                            />
                        </div>

                        {isEditing && (
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#c5503c]/20">
                    <h2 className="font-bold text-xl text-[#c5503c] mb-2">Danger Zone</h2>
                    <p className="text-[#5c4a3a] text-sm mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                    <Button variant="danger" size="sm">
                        Delete Account
                    </Button>
                </div>
            </div>

            {/* Stats Sidebar with REAL Data */}
            <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0]">
                    <h3 className="font-bold text-[#8b7355] text-sm uppercase tracking-wide mb-4">Constitution Metrics</h3>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-[#2d1b0e] font-medium">SRS Retention</span>
                                <span className="text-[#6b8e23] font-bold">{user.srsRetention}%</span>
                            </div>
                            <div className="w-full bg-[#f0f4f8] rounded-full h-1.5">
                                <div
                                    className="bg-[#6b8e23] h-1.5 rounded-full transition-all duration-1000"
                                    style={{ width: `${user.srsRetention}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-[#2d1b0e] font-medium">Error Recovery</span>
                                <span className="text-[#d4800f] font-bold">{user.errorRecovery}%</span>
                            </div>
                            <div className="w-full bg-[#f0f4f8] rounded-full h-1.5">
                                <div
                                    className="bg-[#d4800f] h-1.5 rounded-full transition-all duration-1000"
                                    style={{ width: `${user.errorRecovery}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-[#2d1b0e] font-medium">Daily Shield</span>
                                <span className={`font-bold ${user.dailyShieldActive ? 'text-[#c17767]' : 'text-gray-400'}`}>
                                    {user.dailyShieldActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="text-xs text-[#8b7355] mt-1">
                                {user.dailyShieldActive
                                    ? "Great job maintaining practice!"
                                    : "Practice 5 mins to activate"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
