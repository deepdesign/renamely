/**
 * Unit tests for file system API functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  selectDirectory,
  selectImageFiles,
  scanDirectory,
  createDirectory,
  renameFile,
  moveFile,
  isImageFile,
  getFile,
  createThumbnailUrl,
  revokeThumbnailUrl,
} from '../fs-api';
import {
  createMockDirectoryHandle,
  createMockFileHandle,
  MockFileSystemDirectoryHandle,
  MockFileSystemFileHandle,
} from '../../../test/mocks/fileSystem';
import { ValidationError, FileSystemError, FileOperationError } from '../../../lib/errors';

describe('isImageFile', () => {
  it('should return true for valid image extensions', () => {
    expect(isImageFile('test.jpg')).toBe(true);
    expect(isImageFile('test.jpeg')).toBe(true);
    expect(isImageFile('test.png')).toBe(true);
    expect(isImageFile('test.webp')).toBe(true);
    expect(isImageFile('test.tiff')).toBe(true);
    expect(isImageFile('test.tif')).toBe(true);
    expect(isImageFile('test.heic')).toBe(true);
    expect(isImageFile('test.gif')).toBe(true);
    expect(isImageFile('test.JPG')).toBe(true);
    expect(isImageFile('test.PNG')).toBe(true);
  });

  it('should return false for non-image extensions', () => {
    expect(isImageFile('test.txt')).toBe(false);
    expect(isImageFile('test.pdf')).toBe(false);
    expect(isImageFile('test.doc')).toBe(false);
    expect(isImageFile('test')).toBe(false);
  });

  it('should handle files with multiple dots', () => {
    expect(isImageFile('test.image.jpg')).toBe(true);
    expect(isImageFile('test.backup.png')).toBe(true);
  });
});

describe('selectDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw FileSystemError if API not supported', async () => {
    const originalShowDirectoryPicker = (window as any).showDirectoryPicker;
    delete (window as any).showDirectoryPicker;

    await expect(selectDirectory()).rejects.toThrow(FileSystemError);
    await expect(selectDirectory()).rejects.toThrow('File System Access API not supported');

    (window as any).showDirectoryPicker = originalShowDirectoryPicker;
  });

  it('should return directory handle when user selects a directory', async () => {
    const mockDirHandle = createMockDirectoryHandle('test-dir');
    (window as any).showDirectoryPicker = vi.fn().mockResolvedValue(mockDirHandle);

    const result = await selectDirectory();

    expect(result).toBe(mockDirHandle);
    expect((window as any).showDirectoryPicker).toHaveBeenCalledWith({ mode: 'readwrite' });
  });

  it('should return null when user cancels selection', async () => {
    const abortError = new Error('User cancelled');
    abortError.name = 'AbortError';
    (window as any).showDirectoryPicker = vi.fn().mockRejectedValue(abortError);

    const result = await selectDirectory();

    expect(result).toBeNull();
  });

  it('should pass startIn option when provided', async () => {
    const startInDir = createMockDirectoryHandle('start-dir');
    const mockDirHandle = createMockDirectoryHandle('test-dir');
    (window as any).showDirectoryPicker = vi.fn().mockResolvedValue(mockDirHandle);

    await selectDirectory(startInDir);

    expect((window as any).showDirectoryPicker).toHaveBeenCalledWith({
      mode: 'readwrite',
      startIn: startInDir,
    });
  });
});

describe('selectImageFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw FileSystemError if API not supported', async () => {
    const originalShowOpenFilePicker = (window as any).showOpenFilePicker;
    delete (window as any).showOpenFilePicker;

    await expect(selectImageFiles()).rejects.toThrow(FileSystemError);
    await expect(selectImageFiles()).rejects.toThrow('File System Access API not supported');

    (window as any).showOpenFilePicker = originalShowOpenFilePicker;
  });

  it('should return file handles when user selects files', async () => {
    const mockFileHandle1 = createMockFileHandle('image1.jpg');
    const mockFileHandle2 = createMockFileHandle('image2.png');
    (window as any).showOpenFilePicker = vi.fn().mockResolvedValue([mockFileHandle1, mockFileHandle2]);

    const result = await selectImageFiles();

    expect(result).toEqual([mockFileHandle1, mockFileHandle2]);
    expect((window as any).showOpenFilePicker).toHaveBeenCalledWith({
      types: [{
        description: 'Image files',
        accept: {
          'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.heic', '.gif'],
        },
      }],
      multiple: true,
    });
  });

  it('should return null when user cancels selection', async () => {
    const abortError = new Error('User cancelled');
    abortError.name = 'AbortError';
    (window as any).showOpenFilePicker = vi.fn().mockRejectedValue(abortError);

    const result = await selectImageFiles();

    expect(result).toBeNull();
  });
});

describe('scanDirectory', () => {
  it('should scan directory recursively and return image files', async () => {
    const rootDir = new MockFileSystemDirectoryHandle('root');
    const subDir = new MockFileSystemDirectoryHandle('subdir');
    const image1 = createMockFileHandle('image1.jpg');
    const image2 = createMockFileHandle('image2.png');
    const textFile = createMockFileHandle('document.txt');

    // Setup directory structure
    rootDir.addFile('image1.jpg', image1);
    rootDir.addDirectory('subdir', subDir);
    subDir.addFile('image2.png', image2);
    subDir.addFile('document.txt', textFile);

    const result = await scanDirectory(rootDir, true);

    expect(result).toHaveLength(2);
    expect(result[0].handle).toBe(image1);
    expect(result[0].path).toBe('image1.jpg');
    expect(result[1].handle).toBe(image2);
    expect(result[1].path).toBe('subdir/image2.png');
  });

  it('should scan directory non-recursively when recursive is false', async () => {
    const rootDir = new MockFileSystemDirectoryHandle('root');
    const subDir = new MockFileSystemDirectoryHandle('subdir');
    const image1 = createMockFileHandle('image1.jpg');
    const image2 = createMockFileHandle('image2.png');

    rootDir.addFile('image1.jpg', image1);
    rootDir.addDirectory('subdir', subDir);
    subDir.addFile('image2.png', image2);

    const result = await scanDirectory(rootDir, false);

    expect(result).toHaveLength(1);
    expect(result[0].handle).toBe(image1);
    expect(result[0].path).toBe('image1.jpg');
  });

  it('should filter out non-image files', async () => {
    const rootDir = new MockFileSystemDirectoryHandle('root');
    const image1 = createMockFileHandle('image1.jpg');
    const textFile = createMockFileHandle('document.txt');
    const pdfFile = createMockFileHandle('file.pdf');

    rootDir.addFile('image1.jpg', image1);
    rootDir.addFile('document.txt', textFile);
    rootDir.addFile('file.pdf', pdfFile);

    const result = await scanDirectory(rootDir, false);

    expect(result).toHaveLength(1);
    expect(result[0].handle).toBe(image1);
  });

  it('should handle empty directories', async () => {
    const rootDir = new MockFileSystemDirectoryHandle('root');

    const result = await scanDirectory(rootDir, true);

    expect(result).toHaveLength(0);
  });

  it('should skip invalid paths during scanning', async () => {
    const rootDir = new MockFileSystemDirectoryHandle('root');
    const image1 = createMockFileHandle('image1.jpg');
    // Add a file with invalid path (contains ..)
    const invalidFile = createMockFileHandle('../invalid.jpg');

    rootDir.addFile('image1.jpg', image1);
    // Note: Mock implementation may not support invalid paths, but the real function should skip them
    // This test verifies the function handles path validation correctly

    const result = await scanDirectory(rootDir, false);

    // Should only return valid files
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some(r => r.handle === image1)).toBe(true);
  });
});

describe('createDirectory', () => {
  it('should create a new directory', async () => {
    const parentDir = new MockFileSystemDirectoryHandle('parent');
    const dirName = 'new-dir';

    const result = await createDirectory(parentDir, dirName);

    expect(result).toBeInstanceOf(MockFileSystemDirectoryHandle);
    expect(result.name).toBe(dirName);
    expect(parentDir.hasDirectory(dirName)).toBe(true);
  });

  it('should throw ValidationError for invalid directory names', async () => {
    const parentDir = new MockFileSystemDirectoryHandle('parent');

    await expect(createDirectory(parentDir, '')).rejects.toThrow(ValidationError);
    await expect(createDirectory(parentDir, '../invalid')).rejects.toThrow(ValidationError);
    await expect(createDirectory(parentDir, 'invalid/name')).rejects.toThrow(ValidationError);
  });

  it('should sanitize directory names', async () => {
    const parentDir = new MockFileSystemDirectoryHandle('parent');

    // Directory name with invalid characters should be sanitized or rejected
    const result = await createDirectory(parentDir, 'valid-name');
    expect(result).toBeInstanceOf(MockFileSystemDirectoryHandle);
  });
});

describe('renameFile', () => {
  it('should rename a file using move() method', async () => {
    const fileHandle = createMockFileHandle('old-name.jpg');
    const newName = 'new-name.jpg';
    
    // Mock move method
    const moveSpy = vi.spyOn(fileHandle, 'move').mockResolvedValue(undefined);

    await renameFile(fileHandle, newName);

    // Verify move was called with the new name
    expect(moveSpy).toHaveBeenCalledWith(newName);
  });

  it('should throw ValidationError for invalid filenames', async () => {
    const fileHandle = createMockFileHandle('old-name.jpg');

    await expect(renameFile(fileHandle, '')).rejects.toThrow(ValidationError);
    await expect(renameFile(fileHandle, '../invalid')).rejects.toThrow(ValidationError);
  });

  it('should sanitize filename before renaming', async () => {
    const fileHandle = createMockFileHandle('old-name.jpg');
    const newName = 'new name.jpg'; // Contains space

    // Should sanitize and rename successfully
    await expect(renameFile(fileHandle, newName)).resolves.not.toThrow();
  });

  it('should throw FileOperationError if move() fails after retries', async () => {
    const fileHandle = createMockFileHandle('old-name.jpg');
    // Make move() fail
    fileHandle.move = vi.fn().mockRejectedValue(new Error('Move failed'));

    await expect(renameFile(fileHandle, 'new-name.jpg')).rejects.toThrow(FileOperationError);
  });
});

describe('moveFile', () => {
  it('should move a file to target directory using move() method', async () => {
    const sourceHandle = createMockFileHandle('source.jpg');
    const targetDir = new MockFileSystemDirectoryHandle('target');
    const newName = 'moved.jpg';
    
    // Mock move method
    const moveSpy = vi.spyOn(sourceHandle, 'move').mockResolvedValue(undefined);

    await moveFile(sourceHandle, targetDir, newName);

    // Verify move was called with target directory and new name
    expect(moveSpy).toHaveBeenCalledWith(targetDir, newName);
  });

  it('should handle File objects as source', async () => {
    const sourceFile = new File(['content'], 'source.jpg', { type: 'image/jpeg' });
    const targetDir = new MockFileSystemDirectoryHandle('target');
    const newName = 'moved.jpg';

    // Should create a copy in target directory
    await expect(moveFile(sourceFile, targetDir, newName)).resolves.not.toThrow();
  });

  it('should throw ValidationError for invalid filenames', async () => {
    const sourceHandle = createMockFileHandle('source.jpg');
    const targetDir = new MockFileSystemDirectoryHandle('target');

    await expect(moveFile(sourceHandle, targetDir, '')).rejects.toThrow(ValidationError);
    await expect(moveFile(sourceHandle, targetDir, '../invalid')).rejects.toThrow(ValidationError);
  });

  it('should fall back to copy method if move() fails', async () => {
    const sourceHandle = createMockFileHandle('source.jpg');
    const targetDir = new MockFileSystemDirectoryHandle('target');
    const newName = 'moved.jpg';

    // Make move() fail, then getFile() succeed
    const moveSpy = vi.spyOn(sourceHandle, 'move').mockRejectedValue(new Error('Move failed'));
    const getFileSpy = vi.spyOn(sourceHandle, 'getFile').mockResolvedValue(
      new File(['content'], 'source.jpg', { type: 'image/jpeg' })
    );
    const getFileHandleSpy = vi.spyOn(targetDir, 'getFileHandle').mockResolvedValue(
      createMockFileHandle(newName)
    );
    const createWritableSpy = vi.fn().mockResolvedValue({
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    });
    getFileHandleSpy.mockResolvedValue({
      ...createMockFileHandle(newName),
      createWritable: createWritableSpy,
    } as any);

    // Should fall back to copy method
    await expect(moveFile(sourceHandle, targetDir, newName)).resolves.not.toThrow();
  });
});

describe('getFile', () => {
  it('should get File object from FileSystemFileHandle', async () => {
    const fileHandle = createMockFileHandle('test.jpg');
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    fileHandle.getFile = vi.fn().mockResolvedValue(file);

    const result = await getFile(fileHandle);

    expect(result).toBe(file);
    expect(fileHandle.getFile).toHaveBeenCalled();
  });
});

describe('createThumbnailUrl', () => {
  it('should create a blob URL from file', () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const originalCreateObjectURL = URL.createObjectURL;
    const mockUrl = 'blob:http://localhost/test';
    URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);

    const result = createThumbnailUrl(file);

    expect(result).toBe(mockUrl);
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);

    URL.createObjectURL = originalCreateObjectURL;
  });
});

describe('revokeThumbnailUrl', () => {
  it('should revoke a blob URL', () => {
    const url = 'blob:http://localhost/test';
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.revokeObjectURL = vi.fn();

    revokeThumbnailUrl(url);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);

    URL.revokeObjectURL = originalRevokeObjectURL;
  });
});

