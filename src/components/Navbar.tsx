'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;
    const linkClasses = (path: string) => `
        font-medium text-sm transition-colors py-2 px-3 rounded-lg
        ${isActive(path)
            ? 'bg-[#c17767]/10 text-[#c17767] font-semibold'
            : 'text-[#5c4a3a] hover:text-[#2d1b0e] hover:bg-[#faf5f0]'}
    `;

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
                    <div className="flex items-center">
                        <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-[#faf5f0] transition-colors">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c17767] to-[#8b5e3c] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                HM
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
