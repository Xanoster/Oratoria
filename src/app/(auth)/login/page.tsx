'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
                setIsLoading(false);
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('An error occurred during login');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#faf8f5]">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-[#c17767]/10">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl font-bold text-[#2d1b0e] mb-2">Welcome Back</h1>
                    <p className="text-[#5c4a3a]">Continue your German journey</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={isLoading}
                    >
                        Sign In
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
