import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
});

// Mock SpeechRecognition
const mockSpeechRecognition = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
}));

Object.defineProperty(window, 'SpeechRecognition', {
    writable: true,
    value: mockSpeechRecognition,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
    writable: true,
    value: mockSpeechRecognition,
});
