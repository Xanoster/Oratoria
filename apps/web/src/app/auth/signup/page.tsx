'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './signup.module.css';

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            setIsLoading(false);
            return;
        }

        const supabase = createClient();

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                    },
                },
            });

            if (signUpError) {
                throw signUpError;
            }

            if (data.user) {
                // Redirect to onboarding after account creation
                router.push('/onboarding');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className={styles.main}>
            <div className={styles.card}>
                <h1>Create your account</h1>
                <p className={styles.subtitle}>Start your German learning journey</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSignup} className={styles.form}>
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
                            placeholder="At least 8 characters"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {isLoading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Already have an account?{' '}
                    <Link href="/auth/login">Log in</Link>
                </p>
            </div>
        </main>
    );
}
