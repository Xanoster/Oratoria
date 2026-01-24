import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '../error/OfflineBanner';

// Mock the hook
vi.mock('@/lib/hooks/useConnectionStatus', () => ({
    useConnectionStatus: vi.fn(),
}));

import { useConnectionStatus } from '@/lib/hooks/useConnectionStatus';

describe('OfflineBanner', () => {
    const mockUseConnectionStatus = useConnectionStatus as ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when online and API is reachable', () => {
        mockUseConnectionStatus.mockReturnValue({
            isOnline: true,
            isApiReachable: true,
            checkNow: vi.fn(),
        });

        const { container } = render(<OfflineBanner />);
        expect(container.firstChild).toBeNull();
    });

    it('should render when offline', () => {
        mockUseConnectionStatus.mockReturnValue({
            isOnline: false,
            isApiReachable: false,
            checkNow: vi.fn(),
        });

        render(<OfflineBanner />);
        expect(screen.getByText("You're offline")).toBeInTheDocument();
    });

    it('should render when API is not reachable', () => {
        mockUseConnectionStatus.mockReturnValue({
            isOnline: true,
            isApiReachable: false,
            checkNow: vi.fn(),
        });

        render(<OfflineBanner />);
        expect(screen.getByText('Unable to connect to server')).toBeInTheDocument();
    });
});
