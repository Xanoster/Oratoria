'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Play, RefreshCw, Mic, Users, TrendingUp, Settings, User, BookOpen } from 'lucide-react';
import { useAuth, getAvatarUrl } from '@/lib/auth';

const navItems = [
    { href: '/learn', label: 'Home', icon: Home },
    { href: '/learn/lessons', label: 'Learn', icon: Play },
    { href: '/vocabulary', label: 'Vocabulary', icon: BookOpen },
    { href: '/speak', label: 'Practice', icon: Mic },
    { href: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Only show user-specific data after mounting to prevent hydration mismatch
    const avatarUrl = mounted && user ? getAvatarUrl(user.email || user.id) : null;
    const userName = mounted && user
        ? (user?.user_metadata?.name || user?.email?.split('@')[0] || 'User')
        : 'User';

    return (
        <aside className="sticky top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 flex-none">
            {/* Logo */}
            <Link href="/learn" className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">O</span>
                </div>
                <span className="text-lg font-bold text-gray-900">Oratoria</span>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/learn' && pathname.startsWith(item.href + '/')) ||
                            (item.href === '/learn' && pathname === '/learn');
                        const Icon = item.icon;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
        </aside>
    );
}
