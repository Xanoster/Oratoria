'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulation of login (MVP)
        setTimeout(() => {
            setIsLoading(false);
            router.push('/dashboard');
        }, 1500);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#faf8f5]">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-[#c17767]/10">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl font-bold text-[#2d1b0e] mb-2">Welcome Back</h1>
                    <p className="text-[#5c4a3a]">Continue your German journey</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={isLoading}
                    >
                        Sign In with Email
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[#8b7355] text-sm">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-[#c17767] font-bold hover:underline">
                            Start Learning
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
