import React from 'react';
import ErrorBoundary from './ErrorBoundary';

interface ErrorBoundaryWrapperProps {
  name: string;
  children: React.ReactNode;
  onRetry?: () => void;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component for adding error boundaries to critical sections
 * Provides a simpler API than using ErrorBoundary directly
 */
export function ErrorBoundaryWrapper({ name, children, onRetry, fallback }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary name={name} onRetry={onRetry} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

