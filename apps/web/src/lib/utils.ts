import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function createPageUrl(page: string) {
    const routes: Record<string, string> = {
        Landing: '/',
        OnboardingGoals: '/onboarding',
        Login: '/auth',
        Signup: '/auth?mode=signup',
        Learn: '/learn',
        Progress: '/progress',
        Review: '/review',
        Settings: '/settings',
    };
    return routes[page] || '/';
}
