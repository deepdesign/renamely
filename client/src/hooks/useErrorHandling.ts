/**
 * Custom hook for centralized error handling
 * 
 * Provides a consistent interface for handling errors in components,
 * including user-friendly messages, logging, and error state management.
 */

import { useState, useCallback } from 'react';
import { getUserFriendlyErrorMessage, logError, isRetryableError } from '../lib/errors';
import type { RenamelyError } from '../lib/errors';

export interface UseErrorHandlingReturn {
  /** Current error state */
  error: Error | null;
  /** User-friendly error message */
  errorMessage: string | null;
  /** Whether the error is retryable */
  isRetryable: boolean;
  /** Clear the current error */
  clearError: () => void;
  /** Handle an error (sets error state and logs) */
  handleError: (error: unknown, context?: Record<string, unknown>) => void;
  /** Reset error state */
  reset: () => void;
}

/**
 * Hook for centralized error handling
 * 
 * @param options - Configuration options
 * @param options.autoClear - Automatically clear errors after a delay (default: false)
 * @param options.clearDelay - Delay in milliseconds before auto-clearing (default: 5000)
 * @returns Error handling state and functions
 * 
 * @example
 * ```typescript
 * const { error, errorMessage, handleError, clearError } = useErrorHandling();
 * 
 * try {
 *   await someOperation();
 * } catch (err) {
 *   handleError(err, { operation: 'someOperation' });
 * }
 * ```
 */
export function useErrorHandling(options?: {
  autoClear?: boolean;
  clearDelay?: number;
}): UseErrorHandlingReturn {
  const [error, setError] = useState<Error | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetryable, setIsRetryable] = useState(false);

  const handleError = useCallback(
    (err: unknown, context?: Record<string, unknown>) => {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      const userMessage = getUserFriendlyErrorMessage(err);
      const retryable = isRetryableError(err);

      setError(errorObj);
      setErrorMessage(userMessage);
      setIsRetryable(retryable);

      // Log error with context
      logError(err, context);

      // Auto-clear if enabled
      if (options?.autoClear) {
        const delay = options.clearDelay ?? 5000;
        setTimeout(() => {
          setError(null);
          setErrorMessage(null);
          setIsRetryable(false);
        }, delay);
      }
    },
    [options?.autoClear, options?.clearDelay]
  );

  const clearError = useCallback(() => {
    setError(null);
    setErrorMessage(null);
    setIsRetryable(false);
  }, []);

  const reset = useCallback(() => {
    clearError();
  }, [clearError]);

  return {
    error,
    errorMessage,
    isRetryable,
    clearError,
    handleError,
    reset,
  };
}

