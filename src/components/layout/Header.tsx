'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: '📊' },
        { name: 'Roadmap', href: '/roadmap', icon: '🗺️' },
        { name: 'Practice', href: '/practice', icon: '✍️' },
        { name: 'Profile', href: '/profile', icon: '👤' }
    ];

    const isActive = (href: string) => pathname?.startsWith(href);

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e2d5c7] shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 font-serif text-xl font-bold text-[#2d1b0e]">
                        <span>🎭</span>
                        <span className="hidden sm:inline">Oratoria</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2
                                    ${isActive(item.href)
                                        ? 'bg-[#c17767] text-white font-medium'
                                        : 'text-[#5c4a3a] hover:bg-[#faf5f0]'
                                    }
                                `}
                            >
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-[#5c4a3a] hover:bg-[#faf5f0] rounded-lg"
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-[#e2d5c7] bg-white">
                    <nav className="px-4 py-2 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`
                                    block px-4 py-3 rounded-lg flex items-center gap-2
                                    ${isActive(item.href)
                                        ? 'bg-[#c17767] text-white font-medium'
                                        : 'text-[#5c4a3a] hover:bg-[#faf5f0]'
                                    }
                                `}
                            >
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}
