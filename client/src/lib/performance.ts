/**
 * Performance monitoring utilities
 * 
 * Provides utilities for tracking performance metrics, render times,
 * and bundle size monitoring.
 */

import { logger } from './logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  context?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;

  /**
   * Measure execution time of a function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T> | T,
    context?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        context,
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric({
        name: `${name} (error)`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        context: { ...context, error: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log in development
    if (import.meta.env.DEV) {
      logger.debug(`Performance: ${metric.name} = ${metric.value}${metric.unit}`, metric.context);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average value for a metric name
   */
  getAverage(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get summary statistics
   */
  getSummary(): Record<string, { count: number; average: number; min: number; max: number }> {
    const summary: Record<string, { count: number; average: number; min: number; max: number }> = {};

    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(grouped).forEach(([name, values]) => {
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const average = sum / count;
      const min = Math.min(...values);
      const max = Math.max(...values);

      summary[name] = { count, average, min, max };
    });

    return summary;
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render time
 */
export function useRenderTime(componentName: string): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useEffect, useRef } = require('react');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const renderStartRef = useRef<number | null>(null);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      renderStartRef.current = performance.now();

      return () => {
        if (renderStartRef.current !== null) {
          const renderTime = performance.now() - renderStartRef.current;
          performanceMonitor.recordMetric({
            name: `render:${componentName}`,
            value: renderTime,
            unit: 'ms',
            timestamp: Date.now(),
          });
        }
      };
    });
  }
}

/**
 * Measure bundle size
 */
export function measureBundleSize(): void {
  if (typeof window === 'undefined') return;

  try {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

    let totalSize = 0;

    scripts.forEach((script) => {
      const src = script.getAttribute('src');
      if (src) {
        // Try to get size from performance API
        const resource = performance.getEntriesByName(src, 'resource')[0] as PerformanceResourceTiming | undefined;
        if (resource && resource.transferSize) {
          totalSize += resource.transferSize;
        }
      }
    });

    stylesheets.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        const resource = performance.getEntriesByName(href, 'resource')[0] as PerformanceResourceTiming | undefined;
        if (resource && resource.transferSize) {
          totalSize += resource.transferSize;
        }
      }
    });

    performanceMonitor.recordMetric({
      name: 'bundle:total-size',
      value: totalSize,
      unit: 'bytes',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.warn('Failed to measure bundle size', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Track Core Web Vitals
 */
export function trackWebVitals(): void {
  if (typeof window === 'undefined') return;

  try {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
      const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
      performanceMonitor.recordMetric({
        name: 'web-vital:lcp',
        value: lcp,
        unit: 'ms',
        timestamp: Date.now(),
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
        performanceMonitor.recordMetric({
          name: 'web-vital:fid',
          value: fid,
          unit: 'ms',
          timestamp: Date.now(),
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as LayoutShift).hadRecentInput) {
          clsValue += (entry as LayoutShift).value;
        }
      });
      performanceMonitor.recordMetric({
        name: 'web-vital:cls',
        value: clsValue,
        unit: 'count',
        timestamp: Date.now(),
      });
    }).observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    logger.warn('Failed to track web vitals', error instanceof Error ? error : new Error(String(error)));
  }
}

// Initialize web vitals tracking in browser
if (typeof window !== 'undefined') {
  // Track on page load
  if (document.readyState === 'complete') {
    measureBundleSize();
    trackWebVitals();
  } else {
    window.addEventListener('load', () => {
      measureBundleSize();
      trackWebVitals();
    });
  }
}

