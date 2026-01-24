'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './auth.module.css';

// Dev mode auth - stores user in localStorage
const DEV_MODE = true;

function setDevUser(user: { id: string; email: string; name: string }) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('dev_user', JSON.stringify(user));
        document.cookie = `dev_auth=true; path=/; max-age=604800`; // 7 days
    }
}

function getDevUser() {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('dev_user');
        return user ? JSON.parse(user) : null;
    }
    return null;
}

function AuthPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/learn';
    const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Check if already logged in
    useEffect(() => {
        if (DEV_MODE && getDevUser()) {
            router.push(redirectTo);
        }
    }, [router, redirectTo]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;

        // DEV MODE: Simple validation and immediate login
        if (DEV_MODE) {
            if (!email || !password) {
                setError('Please enter email and password');
                setIsLoading(false);
                return;
            }

            if (password.length < 4) {
                setError('Password must be at least 4 characters');
                setIsLoading(false);
                return;
            }

            // Create dev user
            const devUser = {
                id: `dev_${Date.now()}`,
                email,
                name: name || email.split('@')[0],
            };

            setDevUser(devUser);

            // Small delay for UX
            await new Promise(resolve => setTimeout(resolve, 500));

            router.push(redirectTo);
            router.refresh();
            return;
        }

        setIsLoading(false);
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
