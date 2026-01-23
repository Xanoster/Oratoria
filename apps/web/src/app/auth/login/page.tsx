'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './login.module.css';

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/learn';

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'password' | 'magic-link'>('password');
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        const supabase = createClient();

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                throw signInError;
            }

            if (data.user) {
                router.push(redirectTo);
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;

        const supabase = createClient();

        try {
            const { error: magicLinkError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
                },
            });

            if (magicLinkError) {
                throw magicLinkError;
            }

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
                    <div className={styles.successIcon}>✉️</div>
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
                <h1>Log in</h1>

                {/* Mode Toggle */}
                <div className={styles.modeToggle}>
                    <button
                        type="button"
                        className={`${styles.modeBtn} ${mode === 'password' ? styles.active : ''}`}
                        onClick={() => setMode('password')}
                    >
                        Password
                    </button>
                    <button
                        type="button"
                        className={`${styles.modeBtn} ${mode === 'magic-link' ? styles.active : ''}`}
                        onClick={() => setMode('magic-link')}
                    >
                        Magic Link
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {mode === 'password' ? (
                    <form onSubmit={handlePasswordLogin} className={styles.form}>
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
                                className="input"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            {isLoading ? 'Logging in...' : 'Log in'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleMagicLink} className={styles.form}>
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

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            {isLoading ? 'Sending...' : 'Send magic link'}
                        </button>
                    </form>
                )}

                <p className={styles.footer}>
                    Don't have an account?{' '}
                    <Link href="/auth/signup">Create one</Link>
                </p>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginPageContent />
        </Suspense>
    );
}
