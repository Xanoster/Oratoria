'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [showDropdown, setShowDropdown] = useState(false);

    const isActive = (path: string) => pathname === path;
    const linkClasses = (path: string) => `
        font-medium text-sm transition-colors py-2 px-3 rounded-lg
        ${isActive(path)
            ? 'bg-[#c17767]/10 text-[#c17767] font-semibold'
            : 'text-[#5c4a3a] hover:text-[#2d1b0e] hover:bg-[#faf5f0]'}
    `;

    const getUserInitials = () => {
        if (session?.user?.name) {
            return session.user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return session?.user?.email?.[0]?.toUpperCase() || 'U';
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' });
    };

    return (
        <nav className="bg-white border-b border-[#e2e8f0] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center group">
                            <span className="font-serif text-2xl font-bold text-[#2d1b0e] group-hover:text-[#c17767] transition-colors">
                                Oratoria
                            </span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden sm:flex items-center space-x-2">
                        <Link href="/dashboard" className={linkClasses('/dashboard')}>
                            Dashboard
                        </Link>
                        <Link href="/roadmap" className={linkClasses('/roadmap')}>
                            Roadmap
                        </Link>
                        <Link href="/lesson" className={linkClasses('/lesson')}>
                            Practice
                        </Link>
                        <Link href="/profile" className={linkClasses('/profile')}>
                            Profile
                        </Link>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center relative">
                        <div
                            className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-[#faf5f0] transition-colors"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            {session?.user?.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || 'User'}
                                    className="w-9 h-9 rounded-full shadow-sm"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c17767] to-[#8b5e3c] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {getUserInitials()}
                                </div>
                            )}
                            {session?.user && (
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium text-[#2d1b0e]">
                                        {session.user.name || session.user.email}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Dropdown Menu */}
                        {showDropdown && session?.user && (
                            <div className="absolute right-0 top-14 w-56 bg-white rounded-xl shadow-lg border border-[#e2d5c7] py-2 z-50">
                                <div className="px-4 py-2 border-b border-[#e2d5c7]">
                                    <p className="text-sm font-medium text-[#2d1b0e]">{session.user.name}</p>
                                    <p className="text-xs text-[#8b7355]">{session.user.email}</p>
                                </div>
                                <Link
                                    href="/profile"
                                    className="block px-4 py-2 text-sm text-[#5c4a3a] hover:bg-[#faf5f0] transition-colors"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    Profile Settings
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
