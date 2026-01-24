import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ErrorBoundary } from '@/components/error';
import dynamic from 'next/dynamic';

// Dynamic import to prevent hydration mismatch (uses browser APIs)
const OfflineBanner = dynamic(
    () => import('@/components/error/OfflineBanner').then(mod => ({ default: mod.OfflineBanner })),
    { ssr: false }
);

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Oratoria - Speak German that actually works',
    description: 'Science-first, voice-first learning for busy adults. 30 min/day → fluent conversations.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-[#0A0E1A] text-white`}>
                <ErrorBoundary>
                    <AuthProvider>
                        <OfflineBanner />
                        {children}
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}


