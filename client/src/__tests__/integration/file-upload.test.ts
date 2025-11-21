/**
 * Integration tests for file upload and processing flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../../features/store/slices';
import { createMockDB, resetMockDB } from '../../test/mocks/indexedDB';
import { setupFileSystemMocks, createMockFileHandle } from '../../test/mocks/fileSystem';
import { createTestImageFile } from '../../test/utils/testData';

// Mock the db module
vi.mock('../../features/store/db', async () => {
  const mockDB = createMockDB();
  return {
    db: mockDB,
    initializeDB: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock file system API
setupFileSystemMocks();

describe('File Upload Integration', () => {
  beforeEach(() => {
    resetMockDB();
    useAppStore.setState({
      images: [],
      selectedImageIds: new Set(),
    });
  });

  it('should handle file selection and processing', async () => {
    const fileHandle = createMockFileHandle('test.jpg', new Blob(['test']));
    const image = createTestImageFile({
      id: 'test-1',
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      fileHandle,
    });

    useAppStore.getState().setImages([image]);
    expect(useAppStore.getState().images).toHaveLength(1);
    expect(useAppStore.getState().images[0].originalName).toBe('test.jpg');
  });

  it('should handle multiple file selection', async () => {
    const images = [
      createTestImageFile({ id: 'img1', originalName: 'photo1.jpg' }),
      createTestImageFile({ id: 'img2', originalName: 'photo2.jpg' }),
      createTestImageFile({ id: 'img3', originalName: 'photo3.jpg' }),
    ];

    useAppStore.getState().setImages(images);
    expect(useAppStore.getState().images).toHaveLength(3);
  });

  it('should handle image selection and deselection', () => {
    const images = [
      createTestImageFile({ id: 'img1' }),
      createTestImageFile({ id: 'img2' }),
    ];

    useAppStore.getState().setImages(images);
    useAppStore.getState().toggleImageSelection('img1');
    expect(useAppStore.getState().selectedImageIds.has('img1')).toBe(true);

    useAppStore.getState().selectAllImages();
    expect(useAppStore.getState().selectedImageIds.size).toBe(2);

    useAppStore.getState().deselectAllImages();
    expect(useAppStore.getState().selectedImageIds.size).toBe(0);
  });
});

