'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './auth.module.css';

function AuthPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/learn';
    const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;

        const supabase = createClient();

        try {
            if (mode === 'signup') {
                if (password.length < 8) {
                    throw new Error('Password must be at least 8 characters');
                }

                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name },
                    },
                });

                if (signUpError) throw signUpError;
                if (data.user) {
                    router.push(redirectTo);
                    router.refresh();
                }
            } else {
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;
                if (data.user) {
                    router.push(redirectTo);
                    router.refresh();
                }
            }
        } catch (err: any) {
            setError(err.message || (mode === 'signup' ? 'Failed to create account' : 'Invalid credentials'));
        } finally {
            setIsLoading(false);
        }
    }

    async function handleMagicLink(email: string) {
        setIsLoading(true);
        setError('');

        const supabase = createClient();

        try {
            const { error: magicLinkError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
                },
            });

            if (magicLinkError) throw magicLinkError;
            setMagicLinkSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send magic link');
        } finally {
            setIsLoading(false);
        }
    }

    if (magicLinkSent) {
        return (
            <main className={styles.main}>
                <div className={styles.card}>
                    <div className={styles.iconLarge}>✉️</div>
                    <h1>Check your email</h1>
                    <p className="text-muted text-center">
                        We've sent you a magic link. Click it to log in.
                    </p>
                    <button
                        className="btn btn-secondary mt-4"
                        onClick={() => setMagicLinkSent(false)}
                    >
                        Try again
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.card}>
                <h1>{mode === 'signup' ? 'Create account' : 'Welcome back'}</h1>
                <p className={styles.subtitle}>
                    {mode === 'signup'
                        ? 'Start your German learning journey'
                        : 'Log in to continue learning'}
                </p>

                {/* Mode Toggle */}
                <div className={styles.modeToggle}>
                    <button
                        type="button"
                        className={`${styles.modeBtn} ${mode === 'login' ? styles.active : ''}`}
                        onClick={() => {
                            setMode('login');
                            setError('');
                        }}
                    >
                        Log in
                    </button>
                    <button
                        type="button"
                        className={`${styles.modeBtn} ${mode === 'signup' ? styles.active : ''}`}
                        onClick={() => {
                            setMode('signup');
                            setError('');
                        }}
                    >
                        Sign up
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {mode === 'signup' && (
                        <div className={styles.field}>
                            <label htmlFor="name" className="label">Name (optional)</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="input"
                                placeholder="Your name"
                            />
                        </div>
                    )}

                    <div className={styles.field}>
                        <label htmlFor="email" className="label">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="input"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password" className="label">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            className="input"
                            placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {isLoading
                            ? (mode === 'signup' ? 'Creating account...' : 'Logging in...')
                            : (mode === 'signup' ? 'Create account' : 'Log in')}
                    </button>
                </form>

                {mode === 'login' && (
                    <div className={styles.divider}>
                        <span>or</span>
                    </div>
                )}

                {mode === 'login' && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                        onClick={() => {
                            const email = (document.getElementById('email') as HTMLInputElement)?.value;
                            if (email) {
                                handleMagicLink(email);
                            } else {
                                setError('Please enter your email first');
                            }
                        }}
                    >
                        Send magic link instead
                    </button>
                )}
            </div>
        </main>
    );
}

export default function AuthPage() {
    return (
        <Suspense>
            <AuthPageContent />
        </Suspense>
    );
}
