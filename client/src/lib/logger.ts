/**
 * Centralized logging utility
 * 
 * Provides consistent logging across the application with:
 * - Environment-aware logging (dev vs production)
 * - Structured logging format
 * - Error tracking integration ready
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV ?? import.meta.env.MODE !== 'production';
  // Removed unused isProduction variable

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  log(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('log', message), ...args);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, errorOrContext?: Error | unknown | LogContext, context?: LogContext): void {
    // Warnings should always be shown
    let warnContext: LogContext | undefined;
    
    if (errorOrContext instanceof Error || (errorOrContext && typeof errorOrContext === 'object' && 'message' in errorOrContext && 'stack' in errorOrContext)) {
      // First param is an error
      warnContext = {
        ...context,
        error: errorOrContext instanceof Error ? {
          name: errorOrContext.name,
          message: errorOrContext.message,
          stack: errorOrContext.stack,
        } : errorOrContext,
      };
    } else {
      // First param is context or nothing
      warnContext = (errorOrContext as LogContext | undefined) ?? context;
    }
    
    console.warn(this.formatMessage('warn', message, warnContext));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    // Errors should always be shown
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    console.error(this.formatMessage('error', message, errorContext));
    
    // TODO: Integrate with error tracking service (e.g., Sentry)
    // if (this.isProduction) {
    //   errorTrackingService.captureException(error, { extra: errorContext });
    // }
  }

  debug(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isDevelopment) {
      const debugContext = error ? {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      } : context;
      console.debug(this.formatMessage('debug', message, debugContext));
    }
  }

  /**
   * Logs performance metrics
   */
  performance(label: string, duration: number): void {
    if (this.isDevelopment) {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  }
}

export const logger = new Logger();

