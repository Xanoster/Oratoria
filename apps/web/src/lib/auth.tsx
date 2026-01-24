'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Real Auth
const DEV_MODE = false;

interface User {
    id: string; // mapped from userId
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser({
                        id: data.userId,
                        email: data.email,
                        name: data.email.split('@')[0], // Fallback name
                    });
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    async function signOut() {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            setUser(null);
            router.push('/auth');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

// Helper to generate avatar URL based on email or user ID
export function getAvatarUrl(identifier: string): string {
    const encodedId = encodeURIComponent(identifier);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedId}&backgroundColor=0A0E1A`;
}
