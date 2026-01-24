'use client';

import { useState, useEffect, useCallback } from 'react';

interface ConnectionStatus {
    isOnline: boolean;
    isApiReachable: boolean;
    lastChecked: Date | null;
    error: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useConnectionStatus(checkInterval = 30000) {
    const [mounted, setMounted] = useState(false);
    const [status, setStatus] = useState<ConnectionStatus>({
        isOnline: true, // Default to true for SSR
        isApiReachable: true,
        lastChecked: null,
        error: null,
    });

    const checkApiConnection = useCallback(async () => {
        if (typeof window === 'undefined') return;

        try {
            const response = await fetch(`${API_BASE}/api/v1/health`, {
                method: 'GET',
                cache: 'no-store',
            });

            setStatus((prev) => ({
                ...prev,
                isApiReachable: response.ok,
                lastChecked: new Date(),
                error: response.ok ? null : `API returned ${response.status}`,
            }));
        } catch (error) {
            setStatus((prev) => ({
                ...prev,
                isApiReachable: false,
                lastChecked: new Date(),
                error: error instanceof Error ? error.message : 'Connection failed',
            }));
        }
    }, []);

    useEffect(() => {
        setMounted(true);

        // Set initial online status after mount
        setStatus((prev) => ({
            ...prev,
            isOnline: navigator.onLine,
        }));

        // Handle online/offline events
        const handleOnline = () => {
            setStatus((prev) => ({ ...prev, isOnline: true }));
            checkApiConnection();
        };

        const handleOffline = () => {
            setStatus((prev) => ({
                ...prev,
                isOnline: false,
                isApiReachable: false,
            }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        checkApiConnection();

        // Periodic check
        const interval = setInterval(checkApiConnection, checkInterval);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [checkApiConnection, checkInterval]);

    // Return default values if not mounted (SSR)
    if (!mounted) {
        return {
            isOnline: true,
            isApiReachable: true,
            lastChecked: null,
            error: null,
            checkNow: () => { },
        };
    }

    return {
        ...status,
        checkNow: checkApiConnection,
    };
}

