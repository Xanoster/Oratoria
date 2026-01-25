/**
 * API Client with error handling, retry logic, and type safety
 */

export interface ApiError {
    statusCode: number;
    message: string;
    errors?: Array<{ field: string; message: string }>;
}

export class ApiClientError extends Error {
    public statusCode: number;
    public errors?: Array<{ field: string; message: string }>;

    constructor(error: ApiError) {
        super(error.message);
        this.name = 'ApiClientError';
        this.statusCode = error.statusCode;
        this.errors = error.errors;
    }
}

interface RequestConfig extends RequestInit {
    retries?: number;
    retryDelay?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (network errors, 5xx errors)
 */
function isRetryable(error: unknown, status?: number): boolean {
    if (error instanceof TypeError) {
        // Network error
        return true;
    }
    if (status && status >= 500 && status < 600) {
        return true;
    }
    return false;
}

/**
 * Main API client function with retry logic
 */
export async function apiClient<T>(
    endpoint: string,
    config: RequestConfig = {}
): Promise<T> {
    const { retries = 3, retryDelay = 1000, ...fetchConfig } = config;

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    // Get auth token from localStorage if available
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
            (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
    }

    const finalConfig: RequestInit = {
        ...fetchConfig,
        headers: {
            ...defaultHeaders,
            ...fetchConfig.headers,
        },
        credentials: 'include',
    };

    let lastError: unknown;
    let lastStatus: number | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, finalConfig);
            lastStatus = response.status;

            if (!response.ok) {
                let errorData: ApiError;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = {
                        statusCode: response.status,
                        message: response.statusText || 'Request failed',
                    };
                }

                // Don't retry client errors (4xx)
                if (response.status >= 400 && response.status < 500) {
                    throw new ApiClientError(errorData);
                }

                // Server error - may retry
                lastError = new ApiClientError(errorData);
            } else {
                // Success
                if (response.status === 204) {
                    return {} as T;
                }
                return await response.json();
            }
        } catch (error) {
            lastError = error;

            // If it's already an ApiClientError with 4xx, don't retry
            if (error instanceof ApiClientError && error.statusCode < 500) {
                throw error;
            }
        }

        // Check if we should retry
        if (attempt < retries && isRetryable(lastError, lastStatus)) {
            console.warn(`API request failed, retrying (${attempt + 1}/${retries})...`);
            await sleep(retryDelay * (attempt + 1)); // Exponential backoff
        }
    }

    // All retries exhausted
    if (lastError instanceof ApiClientError) {
        throw lastError;
    }

    throw new ApiClientError({
        statusCode: 0,
        message: lastError instanceof Error ? lastError.message : 'Network error',
    });
}

/**
 * Convenience methods
 */
export const api = {
    get: <T>(endpoint: string, config?: RequestConfig) =>
        apiClient<T>(endpoint, { ...config, method: 'GET' }),

    post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
        apiClient<T>(endpoint, {
            ...config,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
        apiClient<T>(endpoint, {
            ...config,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        }),

    patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
        apiClient<T>(endpoint, {
            ...config,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: <T>(endpoint: string, config?: RequestConfig) =>
        apiClient<T>(endpoint, { ...config, method: 'DELETE' }),
};

export default api;
