'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Dev mode - uses localStorage instead of Supabase
const DEV_MODE = true;

interface DevUser {
    id: string;
    email: string;
    name?: string;
    user_metadata?: {
        name?: string;
    };
}

interface AuthContextType {
    user: DevUser | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
});

function getDevUser(): DevUser | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('dev_user');
    if (user) {
        const parsed = JSON.parse(user);
        return {
            ...parsed,
            user_metadata: { name: parsed.name }
        };
    }
    return null;
}

function clearDevUser() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('dev_user');
    document.cookie = 'dev_auth=; path=/; max-age=0';
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<DevUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (DEV_MODE) {
            // Dev mode - check localStorage
            const devUser = getDevUser();
            setUser(devUser);
            setLoading(false);

            // Listen for storage changes (login/logout in other tabs)
            const handleStorage = () => {
                setUser(getDevUser());
            };
            window.addEventListener('storage', handleStorage);
            return () => window.removeEventListener('storage', handleStorage);
        }

        setLoading(false);
    }, []);

    async function signOut() {
        if (DEV_MODE) {
            clearDevUser();
            setUser(null);
            router.push('/');
            return;
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
