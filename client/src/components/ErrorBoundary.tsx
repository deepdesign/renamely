import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError, getUserFriendlyErrorMessage } from '../lib/errors';
import { logger } from '../lib/logger';

interface Props {
  children: ReactNode;
  name?: string; // Name of the error boundary for debugging
  onRetry?: () => void; // Optional retry callback
  fallback?: ReactNode; // Optional custom fallback UI
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context using our error handling utilities
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown',
    });
    
    // Also log to console in development
    if (import.meta.env.DEV) {
      logger.error('ErrorBoundary caught error', error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.props.name,
      });
    }
    
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const userMessage = this.state.error 
        ? getUserFriendlyErrorMessage(this.state.error)
        : 'An unexpected error occurred.';
      
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Something went wrong
            </h1>
            {this.props.name && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Error in: {this.props.name}
              </p>
            )}
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {userMessage}
            </p>
            {this.props.onRetry && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null, errorInfo: null });
                    this.props.onRetry?.();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mr-2"
                >
                  Try Again
                </button>
              </div>
            )}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 mb-4">
                <p className="font-mono text-sm text-red-800 dark:text-red-200 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-red-700 dark:text-red-300">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
