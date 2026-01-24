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
                <div className="min-h-screen flex items-center justify-center bg-[#0A0E1A] p-8">
                    <div className="max-w-md w-full bg-[#0F1729] border border-[#1E293B] rounded-2xl p-8 text-center">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-slate-400 mb-6">
                            An unexpected error occurred. Please try again.
                        </p>
                        {this.state.error && (
                            <details className="text-left mb-6">
                                <summary className="text-slate-500 cursor-pointer hover:text-slate-400">
                                    Error details
                                </summary>
                                <pre className="mt-2 p-3 bg-[#0A0E1A] rounded text-xs text-red-400 overflow-auto">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={this.handleRetry}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
