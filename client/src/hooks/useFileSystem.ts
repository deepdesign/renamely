/**
 * Custom hook for file system operations
 * 
 * Provides a React-friendly interface for file system operations,
 * including directory selection, file scanning, and file operations.
 */

import { useState, useCallback } from 'react';
import {
  selectDirectory as selectDirectoryAPI,
  selectImageFiles as selectImageFilesAPI,
  scanDirectory,
  renameFile,
  moveFile,
  createDirectory,
} from '../features/files/fs-api';
import { useErrorHandling } from './useErrorHandling';
// FileSystem API types are available globally in modern browsers

export interface UseFileSystemReturn {
  /** Currently selected directory handle */
  selectedDirectory: FileSystemDirectoryHandle | null;
  /** Whether a file operation is in progress */
  isProcessing: boolean;
  /** Error state from file operations */
  error: Error | null;
  /** User-friendly error message */
  errorMessage: string | null;
  /** Select a directory */
  selectDirectory: (startIn?: FileSystemDirectoryHandle) => Promise<FileSystemDirectoryHandle | null>;
  /** Select image files */
  selectImageFiles: (startIn?: FileSystemDirectoryHandle) => Promise<FileSystemFileHandle[] | null>;
  /** Scan a directory for image files */
  scanDirectoryForImages: (
    dirHandle: FileSystemDirectoryHandle,
    recursive?: boolean
  ) => Promise<FileSystemFileHandle[]>;
  /** Rename a file */
  renameFileInPlace: (fileHandle: FileSystemFileHandle, newName: string) => Promise<void>;
  /** Move a file to a target directory */
  moveFileToDirectory: (
    sourceHandle: FileSystemFileHandle | File,
    targetDirHandle: FileSystemDirectoryHandle,
    newName: string
  ) => Promise<void>;
  /** Create a directory */
  createDirectoryInPath: (
    dirHandle: FileSystemDirectoryHandle,
    name: string
  ) => Promise<FileSystemDirectoryHandle>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Hook for file system operations
 * 
 * @returns File system state and operations
 * 
 * @example
 * ```typescript
 * const {
 *   selectedDirectory,
 *   selectDirectory,
 *   scanDirectoryForImages,
 *   isProcessing,
 *   errorMessage
 * } = useFileSystem();
 * 
 * const handleSelectDir = async () => {
 *   const dir = await selectDirectory();
 *   if (dir) {
 *     const files = await scanDirectoryForImages(dir, true);
 *   }
 * };
 * ```
 */
export function useFileSystem(): UseFileSystemReturn {
  const [selectedDirectory, setSelectedDirectory] = useState<FileSystemDirectoryHandle | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { error, errorMessage, handleError, clearError } = useErrorHandling();

  const selectDirectory = useCallback(
    async (startIn?: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | null> => {
      setIsProcessing(true);
      clearError();
      try {
        const dir = await selectDirectoryAPI(startIn);
        if (dir) {
          setSelectedDirectory(dir);
        }
        return dir;
      } catch (err) {
        handleError(err, { operation: 'selectDirectory' });
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [handleError, clearError]
  );

  const selectImageFiles = useCallback(
    async (startIn?: FileSystemDirectoryHandle): Promise<FileSystemFileHandle[] | null> => {
      setIsProcessing(true);
      clearError();
      try {
        return await selectImageFilesAPI(startIn);
      } catch (err) {
        handleError(err, { operation: 'selectImageFiles' });
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [handleError, clearError]
  );

  const scanDirectoryForImages = useCallback(
    async (
      dirHandle: FileSystemDirectoryHandle,
      recursive = false
    ): Promise<FileSystemFileHandle[]> => {
      setIsProcessing(true);
      clearError();
      try {
        return await scanDirectory(dirHandle, recursive);
      } catch (err) {
        handleError(err, { operation: 'scanDirectory', recursive });
        return [];
      } finally {
        setIsProcessing(false);
      }
    },
    [handleError, clearError]
  );

  const renameFileInPlace = useCallback(
    async (fileHandle: FileSystemFileHandle, newName: string): Promise<void> => {
      setIsProcessing(true);
      clearError();
      try {
        await renameFile(fileHandle, newName);
      } catch (err) {
        handleError(err, { operation: 'renameFile', fileName: newName });
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [handleError, clearError]
  );

  const moveFileToDirectory = useCallback(
    async (
      sourceHandle: FileSystemFileHandle | File,
      targetDirHandle: FileSystemDirectoryHandle,
      newName: string
    ): Promise<void> => {
      setIsProcessing(true);
      clearError();
      try {
        await moveFile(sourceHandle, targetDirHandle, newName);
      } catch (err) {
        handleError(err, { operation: 'moveFile', fileName: newName });
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [handleError, clearError]
  );

  const createDirectoryInPath = useCallback(
    async (
      dirHandle: FileSystemDirectoryHandle,
      name: string
    ): Promise<FileSystemDirectoryHandle> => {
      setIsProcessing(true);
      clearError();
      try {
        return await createDirectory(dirHandle, name);
      } catch (err) {
        handleError(err, { operation: 'createDirectory', directoryName: name });
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [handleError, clearError]
  );

  return {
    selectedDirectory,
    isProcessing,
    error,
    errorMessage,
    selectDirectory,
    selectImageFiles,
    scanDirectoryForImages,
    renameFileInPlace,
    moveFileToDirectory,
    createDirectoryInPath,
    clearError,
  };
}

