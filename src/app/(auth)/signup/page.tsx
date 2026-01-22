'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulation of signup (MVP)
        // In real app, this would call /api/auth/signup
        setTimeout(() => {
            setIsLoading(false);
            router.push('/dashboard');
        }, 1500);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#faf8f5]">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-[#c17767]/10">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl font-bold text-[#2d1b0e] mb-2">Create Account</h1>
                    <p className="text-[#5c4a3a]">Start mastering German today</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-6">
                    <Input
                        label="Your Name"
                        type="text"
                        placeholder="Hans Müller"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={isLoading}
                    >
                        Start Learning
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[#8b7355] text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#c17767] font-bold hover:underline">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
