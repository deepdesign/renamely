/**
 * Retry utility functions for handling transient failures
 */

import { logger } from './logger';
import { isRetryableError } from './errors';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  onRetry: () => {},
};

/**
 * Calculate delay for retry attempt with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry configuration options
 * @returns Result of the function call
 * @throws Last error if all retries fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        logger.debug('Error is not retryable', error, { attempt });
        throw error;
      }

      // Don't retry on last attempt
      if (attempt >= config.maxAttempts) {
        logger.warn('Max retry attempts reached', error, { 
          attempt, 
          maxAttempts: config.maxAttempts 
        });
        break;
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt, config);
      logger.info(`Retrying operation (attempt ${attempt + 1}/${config.maxAttempts})`, {
        attempt,
        delay,
        error: error instanceof Error ? error.message : String(error),
      });

      if (config.onRetry) {
        config.onRetry(attempt, error);
      }

      await sleep(delay);
    }
  }

  // All retries exhausted, throw last error
  throw lastError;
}

/**
 * Retry a file operation with exponential backoff
 * Specialized version for file operations with file-specific logging
 */
export async function retryFileOperation<T>(
  fn: () => Promise<T>,
  operation: string,
  filePath?: string,
  options: RetryOptions = {}
): Promise<T> {
  return retry(fn, {
    ...options,
    onRetry: (attempt, error) => {
      logger.warn(`Retrying file operation: ${operation}`, error instanceof Error ? error : new Error(String(error)), {
        attempt,
        operation,
        filePath,
      });
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
    },
  });
}

/**
 * Retry an API call with exponential backoff
 * Specialized version for API calls with endpoint-specific logging
 */
export async function retryApiCall<T>(
  fn: () => Promise<T>,
  endpoint: string,
  options: RetryOptions = {}
): Promise<T> {
  return retry(fn, {
    ...options,
    onRetry: (attempt, error) => {
      logger.warn(`Retrying API call: ${endpoint}`, error instanceof Error ? error : new Error(String(error)), {
        attempt,
        endpoint,
      });
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
    },
  });
}

