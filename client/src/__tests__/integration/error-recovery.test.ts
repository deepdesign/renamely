/**
 * Integration tests for error recovery scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../../features/store/slices';
import { createMockDB, resetMockDB } from '../../test/mocks/indexedDB';
import { createTestImageFile } from '../../test/utils/testData';
import { FileOperationError, ValidationError } from '../../lib/errors';

// Mock the db module
vi.mock('../../features/store/db', async () => {
  const mockDB = createMockDB();
  return {
    db: mockDB,
    initializeDB: vi.fn().mockResolvedValue(undefined),
  };
});

describe('Error Recovery Integration', () => {
  beforeEach(() => {
    resetMockDB();
    useAppStore.setState({
      images: [],
      errors: [],
      isProcessing: false,
    });
  });

  it('should handle file operation errors gracefully', () => {
    const error = new FileOperationError(
      'File not found',
      'rename',
      'test.jpg',
      { originalError: 'ENOENT' }
    );

    useAppStore.getState().addError('img1', error.toUserMessage());
    expect(useAppStore.getState().errors).toHaveLength(1);
    expect(useAppStore.getState().errors[0].fileId).toBe('img1');
  });

  it('should handle validation errors', () => {
    const error = new ValidationError(
      'Invalid filename',
      'filename',
      'test<>file.jpg'
    );

    useAppStore.getState().addError('img1', error.toUserMessage());
    expect(useAppStore.getState().errors).toHaveLength(1);
    expect(useAppStore.getState().errors[0].error).toContain('Invalid filename');
  });

  it('should clear errors', () => {
    useAppStore.getState().addError('img1', 'Error 1');
    useAppStore.getState().addError('img2', 'Error 2');

    expect(useAppStore.getState().errors).toHaveLength(2);

    useAppStore.getState().clearErrors();
    expect(useAppStore.getState().errors).toHaveLength(0);
  });

  it('should handle partial success in batch operations', () => {
    const images = [
      createTestImageFile({ id: 'img1' }),
      createTestImageFile({ id: 'img2' }),
      createTestImageFile({ id: 'img3' }),
    ];

    useAppStore.getState().setImages(images);

    // Simulate partial success: some succeed, some fail
    useAppStore.getState().addError('img2', 'Permission denied');

    expect(useAppStore.getState().errors).toHaveLength(1);
    expect(useAppStore.getState().images).toHaveLength(3);
  });

  it('should track processing state during operations', () => {
    expect(useAppStore.getState().isProcessing).toBe(false);

    useAppStore.getState().setProcessing(true);
    expect(useAppStore.getState().isProcessing).toBe(true);

    useAppStore.getState().setProcessing(false);
    expect(useAppStore.getState().isProcessing).toBe(false);
  });

  it('should track progress during batch operations', () => {
    useAppStore.getState().setProgress(5, 10);

    expect(useAppStore.getState().progress).toBe(5);
    expect(useAppStore.getState().totalFiles).toBe(10);
    expect(useAppStore.getState().processedFiles).toBe(5);
  });
});

