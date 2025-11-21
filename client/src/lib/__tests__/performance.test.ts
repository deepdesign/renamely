/**
 * Unit tests for performance monitoring utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { performanceMonitor } from '../performance';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  it('should record metrics', () => {
    performanceMonitor.recordMetric({
      name: 'test-metric',
      value: 100,
      unit: 'ms',
      timestamp: Date.now(),
    });

    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('test-metric');
    expect(metrics[0].value).toBe(100);
  });

  it('should get metrics by name', () => {
    performanceMonitor.recordMetric({
      name: 'test-metric',
      value: 100,
      unit: 'ms',
      timestamp: Date.now(),
    });
    performanceMonitor.recordMetric({
      name: 'test-metric',
      value: 200,
      unit: 'ms',
      timestamp: Date.now(),
    });
    performanceMonitor.recordMetric({
      name: 'other-metric',
      value: 50,
      unit: 'ms',
      timestamp: Date.now(),
    });

    const metrics = performanceMonitor.getMetricsByName('test-metric');
    expect(metrics).toHaveLength(2);
    expect(metrics.every((m) => m.name === 'test-metric')).toBe(true);
  });

  it('should calculate average', () => {
    performanceMonitor.recordMetric({
      name: 'test-metric',
      value: 100,
      unit: 'ms',
      timestamp: Date.now(),
    });
    performanceMonitor.recordMetric({
      name: 'test-metric',
      value: 200,
      unit: 'ms',
      timestamp: Date.now(),
    });
    performanceMonitor.recordMetric({
      name: 'test-metric',
      value: 300,
      unit: 'ms',
      timestamp: Date.now(),
    });

    const average = performanceMonitor.getAverage('test-metric');
    expect(average).toBe(200);
  });

  it('should return null for average if no metrics', () => {
    const average = performanceMonitor.getAverage('non-existent');
    expect(average).toBeNull();
  });

  it('should measure function execution time', async () => {
    const result = await performanceMonitor.measure('test-operation', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'test-result';
    });

    expect(result).toBe('test-result');
    const metrics = performanceMonitor.getMetricsByName('test-operation');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].value).toBeGreaterThan(0);
    expect(metrics[0].unit).toBe('ms');
  });

  it('should handle errors in measured functions', async () => {
    await expect(
      performanceMonitor.measure('test-error', async () => {
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');

    const metrics = performanceMonitor.getMetricsByName('test-error (error)');
    expect(metrics).toHaveLength(1);
    expect(metrics[0].context?.error).toBe('Test error');
  });

  it('should generate summary statistics', () => {
    performanceMonitor.recordMetric({
      name: 'test-metric',
      value: 100,
      unit: 'ms',
      timestamp: Date.now(),
    });
    performanceMonitor.recordMetric({
      name: 'test-metric',
      value: 200,
      unit: 'ms',
      timestamp: Date.now(),
    });
    performanceMonitor.recordMetric({
      name: 'test-metric',
      value: 300,
      unit: 'ms',
      timestamp: Date.now(),
    });

    const summary = performanceMonitor.getSummary();
    expect(summary['test-metric']).toBeDefined();
    expect(summary['test-metric'].count).toBe(3);
    expect(summary['test-metric'].average).toBe(200);
    expect(summary['test-metric'].min).toBe(100);
    expect(summary['test-metric'].max).toBe(300);
  });

  it('should limit metrics to maxMetrics', () => {
    const maxMetrics = 1000;
    for (let i = 0; i < maxMetrics + 100; i++) {
      performanceMonitor.recordMetric({
        name: 'test-metric',
        value: i,
        unit: 'ms',
        timestamp: Date.now(),
      });
    }

    const metrics = performanceMonitor.getMetrics();
    expect(metrics.length).toBeLessThanOrEqual(maxMetrics);
  });
});

