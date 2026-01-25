'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    action: () => void;
    description: string;
}

/**
 * Hook for adding keyboard shortcuts to any component
 * @param shortcuts Array of keyboard shortcuts to register
 * @param enabled Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
    shortcuts: KeyboardShortcut[],
    enabled: boolean = true
) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            for (const shortcut of shortcuts) {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
                const shiftMatch = !!shortcut.shift === event.shiftKey;
                const altMatch = !!shortcut.alt === event.altKey;

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        },
        [shortcuts, enabled]
    );

    useEffect(() => {
        if (enabled) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [handleKeyDown, enabled]);
}

/**
 * Common shortcuts for the app
 */
export const COMMON_SHORTCUTS = {
    RECORD: { key: ' ', description: 'Start/stop recording' },
    SUBMIT: { key: 'Enter', description: 'Submit' },
    ESCAPE: { key: 'Escape', description: 'Cancel/close' },
    NEXT: { key: 'ArrowRight', description: 'Next item' },
    PREV: { key: 'ArrowLeft', description: 'Previous item' },
    PLAY: { key: 'p', description: 'Play audio' },
    HINT: { key: 'h', description: 'Show hint' },
    EASY: { key: '1', description: 'Mark as easy (SRS)' },
    GOOD: { key: '2', description: 'Mark as good (SRS)' },
    HARD: { key: '3', description: 'Mark as hard (SRS)' },
};

export default useKeyboardShortcuts;
