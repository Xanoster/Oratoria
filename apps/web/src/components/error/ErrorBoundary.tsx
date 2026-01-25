'use client';

import { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-[#F0FDF4] p-8">
                    <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-lg">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-gray-500 mb-6">
                            An unexpected error occurred. Please try again.
                        </p>
                        {this.state.error && (
                            <details className="text-left mb-6">
                                <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                                    Error details
                                </summary>
                                <pre className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-600 overflow-auto">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={this.handleRetry}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-500/25"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
