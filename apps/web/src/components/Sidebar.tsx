'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Play, RefreshCw, Mic, Users, TrendingUp, Settings, User } from 'lucide-react';
import { useAuth, getAvatarUrl } from '@/lib/auth';

const navItems = [
    { href: '/learn', label: 'Learn', icon: Play },
    { href: '/review', label: 'Review', icon: RefreshCw },
    { href: '/speak', label: 'Speak', icon: Mic },
    { href: '/roleplay', label: 'Roleplay', icon: Users },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    const avatarUrl = user ? getAvatarUrl(user.email || user.id) : null;
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0A0E1A] border-r border-[#1E293B] flex flex-col z-40">
            {/* Logo */}
            <Link href="/learn" className="flex items-center gap-3 px-6 py-5 border-b border-[#1E293B]">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Oratoria</span>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const Icon = item.icon;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                                        : 'text-slate-400 hover:text-white hover:bg-[#0F1729]'
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom Section */}
            <div className="px-3 py-4 border-t border-[#1E293B] space-y-2">
                {/* Settings */}
                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${pathname === '/settings'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-[#0F1729]'
                        }`}
                >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Settings</span>
                </Link>

                {/* User Profile */}
                <Link
                    href="/profile"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${pathname === '/profile'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-[#0F1729]'
                        }`}
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Profile"
                            className="w-6 h-6 rounded-full bg-[#1E293B]"
                        />
                    ) : (
                        <User className="h-5 w-5" />
                    )}
                    <span className="font-medium truncate">{userName}</span>
                </Link>
            </div>
        </aside>
    );
}
