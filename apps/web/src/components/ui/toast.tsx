'use client';

import { Toaster, toast } from 'react-hot-toast';

export { toast };

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#FFFFFF',
                    color: '#1A1F1E',
                    border: '1px solid #E2E8E5',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
                },
                success: {
                    iconTheme: {
                        primary: '#22c55e',
                        secondary: '#fff',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                    duration: 5000,
                },
            }}
        />
    );
}

// Helper functions for common toast patterns
export const showSuccess = (message: string) => toast.success(message);
export const showError = (message: string) => toast.error(message);
export const showLoading = (message: string) => toast.loading(message);
export const dismissToast = (toastId: string) => toast.dismiss(toastId);

// Promise-based toast for async operations
export function showPromise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
): Promise<T> {
    return toast.promise(promise, messages);
}
