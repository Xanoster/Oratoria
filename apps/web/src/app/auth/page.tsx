'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './auth.module.css';

// Real auth
const DEV_MODE = false;

function AuthPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/learn';
    const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;

        try {
            const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/login';
            const body = mode === 'signup'
                ? { email, password, name: name || email.split('@')[0] }
                : { email, password };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include', // Important for setting cookies
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Authentication failed');
            }

            // Success - redirect
            router.push(redirectTo);
            router.refresh(); // Refresh to update AuthProvider state
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setIsLoading(false);
        }
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

                {DEV_MODE && (
                    <div className="text-xs text-green-400 bg-green-900/20 border border-green-600/30 rounded-lg px-3 py-2 mb-4 text-center">
                        🛠️ Dev Mode - Any email/password works
                    </div>
                )}

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
                            defaultValue="dev@example.com"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password" className="label">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={4}
                            className="input"
                            placeholder={mode === 'signup' ? 'At least 4 characters' : '••••••••'}
                            defaultValue="dev123"
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
