'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/app/dashboard/layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState({
        name: 'Hans Müller',
        email: 'hans@example.com',
        level: 'A1',
        dailyGoal: 10, // minutes
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsEditing(false);
        // Save logic would go here
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="font-serif text-3xl font-bold text-[#2d1b0e]">My Profile</h1>
                        <p className="text-[#5c4a3a]">Manage your account and settings</p>
                    </div>
                    {!isEditing && (
                        <Button variant="secondary" onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Settings Card */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e2e8f0]">
                            <h2 className="font-bold text-xl text-[#2d1b0e] mb-6">Personal Information</h2>

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

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0]">
                            <h3 className="font-bold text-[#8b7355] text-sm uppercase tracking-wide mb-4">Constitution Metrics</h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-[#2d1b0e] font-medium">SRS Retention</span>
                                        <span className="text-[#6b8e23] font-bold">94%</span>
                                    </div>
                                    <div className="w-full bg-[#f0f4f8] rounded-full h-1.5">
                                        <div className="bg-[#6b8e23] h-1.5 rounded-full w-[94%]"></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-[#2d1b0e] font-medium">Error Recovery</span>
                                        <span className="text-[#d4800f] font-bold">68%</span>
                                    </div>
                                    <div className="w-full bg-[#f0f4f8] rounded-full h-1.5">
                                        <div className="bg-[#d4800f] h-1.5 rounded-full w-[68%]"></div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-[#2d1b0e] font-medium">Daily Shield</span>
                                        <span className="text-[#c17767] font-bold">Active</span>
                                    </div>
                                    <p className="text-xs text-[#8b7355] mt-1">Maintained for 3 days</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-[#2d1b0e] to-[#5c4a3a] rounded-2xl p-6 text-white shadow-lg">
                            <h3 className="font-serif text-lg font-bold mb-2">Oratoria Pro</h3>
                            <p className="text-white/80 text-sm mb-4">Unlock unlimited speaking practice and roleplay scenarios.</p>
                            <Button variant="secondary" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                                Upgrade Plan
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
