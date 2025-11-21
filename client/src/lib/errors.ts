// Custom error classes for better error handling and debugging

import { logger } from './logger';

/**
 * Base error class for Renamely application errors
 */
export class RenamelyError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RenamelyError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RenamelyError);
    }
  }

  /**
   * Convert error to a user-friendly message
   */
  toUserMessage(): string {
    return this.message;
  }

  /**
   * Convert error to JSON for logging/storage
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * Error for file operation failures
 */
export class FileOperationError extends RenamelyError {
  public readonly filePath?: string;
  public readonly operation?: string;

  constructor(
    message: string,
    operation: string,
    filePath?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'FILE_OPERATION_ERROR', { ...context, operation, filePath });
    this.name = 'FileOperationError';
    this.operation = operation;
    this.filePath = filePath;
  }

  toUserMessage(): string {
    const operationName = this.operation || 'process';
    const fileName = this.filePath ? `"${this.filePath}"` : 'the file';
    
    // Map common error messages to user-friendly versions
    const message = this.message.toLowerCase();
    
    if (message.includes('permission') || message.includes('denied')) {
      return `Permission denied: Unable to ${operationName} ${fileName}. Please check file permissions and ensure the file is not open in another program.`;
    }
    
    if (message.includes('not found') || message.includes('does not exist')) {
      return `File not found: ${fileName} no longer exists. Please select the file again.`;
    }
    
    if (message.includes('locked') || message.includes('in use')) {
      return `File is in use: ${fileName} is currently being used by another program. Please close it and try again.`;
    }
    
    if (message.includes('quota') || message.includes('space')) {
      return `Insufficient storage: Not enough space to ${operationName} ${fileName}. Please free up disk space and try again.`;
    }
    
    if (message.includes('invalid') || message.includes('invalid name')) {
      return `Invalid filename: The name "${this.filePath || 'provided'}" contains invalid characters. Please use a different name.`;
    }
    
    if (this.filePath) {
      return `Unable to ${operationName} ${fileName}. ${this.message}`;
    }
    return `File operation failed: ${this.message}`;
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends RenamelyError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', { ...context, field, value });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }

  toUserMessage(): string {
    const message = this.message.toLowerCase();
    
    if (message.includes('empty') || message.includes('required')) {
      if (this.field) {
        return `${this.field} is required. Please provide a value.`;
      }
      return `This field is required. Please provide a value.`;
    }
    
    if (message.includes('too long') || message.includes('exceeds')) {
      if (this.field) {
        return `${this.field} is too long. Please shorten it.`;
      }
      return `The value is too long. Please shorten it.`;
    }
    
    if (message.includes('invalid characters') || message.includes('sanitization')) {
      if (this.field) {
        return `${this.field} contains invalid characters. Please use only letters, numbers, spaces, and common punctuation.`;
      }
      return `Invalid characters detected. Please use only letters, numbers, spaces, and common punctuation.`;
    }
    
    if (message.includes('template') && message.includes('invalid')) {
      return `Invalid template format. Please check your template syntax and try again.`;
    }
    
    if (this.field) {
      return `Invalid ${this.field}: ${this.message}`;
    }

    return `Validation error: ${this.message}`;
  }
}

/**
 * Error for API operation failures
 */
export class APIError extends RenamelyError {
  public readonly statusCode?: number;
  public readonly endpoint?: string;
  public readonly requestBody?: unknown;

  constructor(
    message: string,
    endpoint?: string,
    statusCode?: number,
    requestBody?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, 'API_ERROR', { ...context, endpoint, statusCode, requestBody });
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.requestBody = requestBody;
  }

  toUserMessage(): string {
    if (this.statusCode === 401 || this.statusCode === 403) {
      return 'Authentication failed. Please check your credentials.';
    }
    if (this.statusCode === 404) {
      return 'Resource not found. Please check your request.';
    }
    if (this.statusCode && this.statusCode >= 500) {
      return 'Server error. Please try again later.';
    }
    if (this.endpoint) {
      return `API request failed: ${this.message}`;
    }
    return `API error: ${this.message}`;
  }
}

/**
 * Error for file system access issues
 */
export class FileSystemError extends RenamelyError {
  public readonly path?: string;
  public readonly operation?: string;

  constructor(
    message: string,
    operation: string,
    path?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'FILE_SYSTEM_ERROR', { ...context, operation, path });
    this.name = 'FileSystemError';
    this.operation = operation;
    this.path = path;
  }

  toUserMessage(): string {
    const operationName = this.operation || 'access';
    const pathInfo = this.path ? ` at "${this.path}"` : '';
    const message = this.message.toLowerCase();
    
    if (message.includes('not supported')) {
      return `Browser not supported: Your browser doesn't support the File System Access API. Please use Chrome 102+ or Edge 102+ for full functionality.`;
    }
    
    if (message.includes('permission') || message.includes('denied')) {
      return `Permission denied: Unable to ${operationName}${pathInfo}. Please grant the necessary permissions and try again.`;
    }
    
    if (message.includes('not found')) {
      return `Path not found: The location${pathInfo} doesn't exist. Please select a valid folder.`;
    }
    
    if (this.path) {
      return `File system error (${operationName}): ${this.message}${pathInfo}`;
    }
    return `File system error: ${this.message}`;
  }
}

/**
 * Error for configuration/settings issues
 */
export class ConfigurationError extends RenamelyError {
  public readonly setting?: string;

  constructor(
    message: string,
    setting?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'CONFIGURATION_ERROR', { ...context, setting });
    this.name = 'ConfigurationError';
    this.setting = setting;
  }

  toUserMessage(): string {
    if (this.setting) {
      return `Configuration error for "${this.setting}": ${this.message}`;
    }
    return `Configuration error: ${this.message}`;
  }
}

/**
 * Helper function to create user-friendly error messages
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof RenamelyError) {
    return error.toUserMessage();
  }
  
  if (error instanceof Error) {
    // Map common error messages to user-friendly versions
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
      return 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'Request timeout: The operation took too long. Please try again.';
    }
    
    if (message.includes('permission') || message.includes('denied')) {
      return 'Permission denied: You don\'t have permission to perform this action. Please check your file permissions and try again.';
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'Resource not found: The requested item could not be found. Please check your selection and try again.';
    }
    
    if (message.includes('quota') || message.includes('storage') || message.includes('disk space')) {
      return 'Storage quota exceeded: Not enough storage space available. Please free up space and try again.';
    }
    
    if (message.includes('cors') || message.includes('cross-origin')) {
      return 'Cross-origin error: Unable to access the resource due to browser security restrictions.';
    }
    
    if (message.includes('aborted') || message.includes('cancelled')) {
      return 'Operation cancelled: The operation was cancelled.';
    }
    
    // Return the original message if no mapping found, but make it more user-friendly
    return `An error occurred: ${error.message}`;
  }
  
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Helper function to log errors consistently
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (error instanceof RenamelyError) {
    logger.error('Renamely error', error, { ...error.context, ...context });
  } else if (error instanceof Error) {
    logger.error('Error', error, context);
  } else {
    logger.error('Unknown error', new Error(String(error)), context);
  }
}

/**
 * Helper function to check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    // Retry on 5xx errors and network errors, but not 4xx
    return error.statusCode === undefined || (error.statusCode >= 500 && error.statusCode < 600);
  }
  
  if (error instanceof FileSystemError) {
    // Retry on permission errors (might be temporary)
    const message = error.message.toLowerCase();
    return message.includes('permission') || message.includes('busy') || message.includes('locked');
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Retry on network errors
    return message.includes('network') || message.includes('timeout') || message.includes('connection');
  }
  
  return false;
}

