import { describe, it, expect } from 'vitest';
import { createPageUrl } from '../utils';

describe('createPageUrl', () => {
    it('should return correct URL for known pages', () => {
        expect(createPageUrl('Landing')).toBe('/');
        expect(createPageUrl('Learn')).toBe('/learn');
        expect(createPageUrl('Review')).toBe('/review');
        expect(createPageUrl('Settings')).toBe('/settings');
        expect(createPageUrl('Progress')).toBe('/progress');
    });

    it('should return home for unknown pages', () => {
        expect(createPageUrl('CustomPage')).toBe('/');
        expect(createPageUrl('UnknownRoute')).toBe('/');
    });

    it('should handle empty string', () => {
        expect(createPageUrl('')).toBe('/');
    });
});

