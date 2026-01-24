'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Don't show anything until mounted (prevents hydration issues)
    // Only show when browser is actually offline (not just API unreachable)
    if (!mounted || isOnline) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white py-2 px-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm font-medium">
                        You&apos;re offline - some features may not work
                    </span>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-1 text-sm hover:underline"
                >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                </button>
            </div>
        </div>
    );
}
