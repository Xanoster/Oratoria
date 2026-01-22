import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { getAuthenticatedUser } from '@/lib/auth';
import { getDashboardData } from '@/lib/dashboard';

export const dynamic = 'force-dynamic'; // Ensure no caching of stats

export default async function DashboardPage() {
    // Fetch real data
    const user = await getAuthenticatedUser();
    if (!user) {
        redirect('/login');
    }

    const data = await getDashboardData(user.id);

    const stats = [
        { label: 'Current Level', value: data.level, subtext: 'Student' },
        { label: 'Day Streak', value: data.streak.toString(), subtext: 'Days' },
        { label: 'Sentences', value: data.masteredCount.toString(), subtext: 'Mastered' },
    ];

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-[#2d1b0e]">Guten Tag, {data.userName}! 👋</h1>
                    <p className="text-[#5c4a3a] mt-1">Ready to continue your German journey?</p>
                </div>
                <Link href="/lesson">
                    <Button size="lg" className="w-full md:w-auto shadow-xl shadow-[#c17767]/20">
                        Continue Learning
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0] hover:shadow-md transition-shadow">
                        <p className="text-sm font-semibold text-[#8b7355] uppercase tracking-wide">{stat.label}</p>
                        <div className="flex items-baseline mt-2">
                            <span className="text-3xl font-bold text-[#2d1b0e]">{stat.value}</span>
                            <span className="ml-2 text-sm text-[#5c4a3a]">{stat.subtext}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden">
                        <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
                            <h2 className="font-serif text-xl font-bold text-[#2d1b0e]">Recent Activity</h2>
                            <Link href="/profile" className="text-sm font-semibold text-[#c17767] hover:underline">
                                View History
                            </Link>
                        </div>
                        <div className="divide-y divide-[#f0f4f8]">
                            {data.recentActivity.length > 0 ? (
                                data.recentActivity.map((activity) => (
                                    <div key={activity.id} className="p-4 hover:bg-[#faf8f5] transition-colors flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm
                                                ${activity.status === 'Success'
                                                    ? 'bg-[#f0f7e6] text-[#6b8e23]'
                                                    : 'bg-[#fef4e6] text-[#d4800f]'}`}>
                                                {activity.status === 'Success' ? '✓' : '↻'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-[#2d1b0e] truncate max-w-[200px]">{activity.title}</h3>
                                                <p className="text-sm text-[#8b7355]">{activity.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-[#2d1b0e]">{activity.score}</span>
                                            <p className={`text-xs font-medium mt-0.5
                                                ${activity.status === 'Success' ? 'text-[#6b8e23]' : 'text-[#d4800f]'}`}>
                                                {activity.status}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-[#8b7355]">
                                    No activity yet. Complete a lesson to see your progress!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - 1/3 width */}
                <div className="space-y-6">
                    {/* Next Goal Card */}
                    <div className="bg-gradient-to-br from-[#c17767] to-[#8b5e3c] rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="font-serif text-lg font-bold mb-2">Next Goal</h3>
                        <p className="text-white/90 text-sm mb-4">{data.nextGoal}</p>
                        <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                            <div
                                className="bg-white rounded-full h-2 transition-all duration-500"
                                style={{ width: `${data.progressPercent}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-white/80 font-medium">{Math.round(data.progressPercent)}% Progress</p>
                    </div>

                    {/* Tip Card */}
                    <div className="bg-[#faf5f0] rounded-2xl p-6 border-l-4 border-[#c17767]">
                        <h3 className="font-bold text-[#2d1b0e] mb-2 flex items-center">
                            <span className="text-xl mr-2">💡</span> Proton Tip
                        </h3>
                        <p className="text-sm text-[#5c4a3a]">
                            {data.tip}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
