// Browser File System Access API implementation

import { logger } from '../../lib/logger';
import { isFileSystemDirectoryHandle, isFileSystemFileHandle } from '../../lib/type-guards';
import { validateFilePath, sanitizeFilename, validateFolderName } from '../../lib/validators';
import { FileSystemError, FileOperationError, ValidationError } from '../../lib/errors';
import { retryFileOperation } from '../../lib/retry';

// Use global types from filesystem.d.ts instead of exporting our own
// This ensures compatibility with browser's native FileSystemHandle types

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.heic', '.gif',
  '.JPG', '.JPEG', '.PNG', '.WEBP', '.TIFF', '.TIF', '.HEIC', '.GIF',
]);

/**
 * Checks if a filename has a valid image extension
 * 
 * @param filename - The filename to check
 * @returns True if the file extension is in the allowed image extensions list
 * 
 * @example
 * ```typescript
 * isImageFile('photo.jpg'); // Returns true
 * isImageFile('document.pdf'); // Returns false
 * ```
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.substring(filename.lastIndexOf('.'));
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Opens a directory picker dialog for the user to select a folder
 * 
 * Uses the File System Access API to allow users to select a directory.
 * Returns null if the user cancels the selection.
 * 
 * @param startIn - Optional directory handle to use as the starting location
 * @returns Promise resolving to the selected directory handle, or null if cancelled
 * @throws {FileSystemError} If the File System Access API is not supported
 * 
 * @example
 * ```typescript
 * const dirHandle = await selectDirectory();
 * if (dirHandle) {
 *   // User selected a directory
 * }
 * ```
 */
export async function selectDirectory(startIn?: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | null> {
  if (!('showDirectoryPicker' in window)) {
    throw new FileSystemError(
      'File System Access API not supported in this browser',
      'selectDirectory'
    );
  }

  try {
    const options: { mode?: 'read' | 'readwrite'; startIn?: FileSystemDirectoryHandle } = {
      mode: 'readwrite',
    };
    
    // Use startIn if provided (helps browser remember last location)
    if (startIn) {
      options.startIn = startIn;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle = await (window as any).showDirectoryPicker(options);
    if (!isFileSystemDirectoryHandle(handle)) {
      throw new FileSystemError(
        'Invalid directory handle returned from showDirectoryPicker',
        'selectDirectory'
      );
    }
    return handle;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

/**
 * Opens a file picker dialog for the user to select image files
 * 
 * Uses the File System Access API with image file filters to allow users
 * to select multiple image files. Returns null if the user cancels.
 * 
 * @param startIn - Optional directory handle to use as the starting location
 * @returns Promise resolving to an array of selected file handles, or null if cancelled
 * @throws {FileSystemError} If the File System Access API is not supported
 * 
 * @example
 * ```typescript
 * const fileHandles = await selectImageFiles();
 * if (fileHandles) {
 *   // User selected image files
 * }
 * ```
 */
export async function selectImageFiles(startIn?: FileSystemDirectoryHandle): Promise<FileSystemFileHandle[] | null> {
  if (!('showOpenFilePicker' in window)) {
    throw new FileSystemError(
      'File System Access API not supported in this browser',
      'selectImageFiles'
    );
  }

  try {
    const options: { multiple?: boolean; types?: Array<{ description: string; accept: Record<string, string[]> }>; excludeAcceptAllOption?: boolean; startIn?: FileSystemDirectoryHandle } = {
      types: [{
        description: 'Image files',
        accept: {
          'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.heic', '.gif'],
        },
      }],
      multiple: true,
    };
    
    // Use startIn if provided (helps browser remember last location)
    if (startIn) {
      options.startIn = startIn;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handles = await (window as any).showOpenFilePicker(options);
    if (!Array.isArray(handles)) {
      throw new FileSystemError(
        'Invalid file handles returned from showOpenFilePicker',
        'selectImageFiles'
      );
    }
    // Validate all handles are FileSystemFileHandle
    for (const handle of handles) {
      if (!isFileSystemFileHandle(handle)) {
        throw new FileSystemError(
          'Invalid file handle in array returned from showOpenFilePicker',
          'selectImageFiles'
        );
      }
    }
    return handles;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

/**
 * Recursively scans a directory for image files
 * 
 * Traverses the directory structure (optionally recursively) and returns
 * all image files found. Validates paths and filenames to prevent directory
 * traversal attacks.
 * 
 * @param dirHandle - The directory handle to scan
 * @param recursive - Whether to scan subdirectories (default: true)
 * @returns Promise resolving to an array of file entries with handles and paths
 * 
 * @example
 * ```typescript
 * const files = await scanDirectory(dirHandle, true);
 * // Returns: [{ handle: FileSystemFileHandle, path: 'folder/image.jpg' }, ...]
 * ```
 */
export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  recursive: boolean = true
): Promise<Array<{ handle: FileSystemFileHandle; path: string }>> {
  const files: Array<{ handle: FileSystemFileHandle; path: string }> = [];

  async function scan(currentDir: FileSystemDirectoryHandle, currentPath: string = '') {
    // Validate current path to prevent directory traversal
    if (currentPath) {
      const pathValidation = validateFilePath(currentPath);
      if (!pathValidation.valid) {
        logger.warn('Invalid path detected in scanDirectory, skipping', { path: currentPath, error: pathValidation.error });
        return; // Skip this directory branch
      }
    }
    
    for await (const [name, handle] of currentDir.entries()) {
      // Validate filename to prevent path traversal
      const nameValidation = validateFilePath(name);
      if (!nameValidation.valid) {
        logger.warn('Invalid filename detected in scanDirectory, skipping', { name, error: nameValidation.error });
        continue; // Skip this file
      }
      
      if (handle.kind === 'file') {
        if (isImageFile(name) && isFileSystemFileHandle(handle)) {
          // Use sanitized name if validation provided one
          const safeName = nameValidation.sanitized || name;
          const safePath = currentPath ? `${currentPath}/${safeName}` : safeName;
          
          files.push({
            handle,
            path: safePath,
          });
        }
      } else if (isFileSystemDirectoryHandle(handle) && recursive) {
        const safeName = nameValidation.sanitized || name;
        const nextPath = currentPath ? `${currentPath}/${safeName}` : safeName;
        await scan(handle, nextPath);
      }
    }
  }

  await scan(dirHandle);
  return files;
}

/**
 * Creates a new directory within the specified parent directory
 * 
 * Validates and sanitizes the directory name before creation to prevent
 * security issues like path traversal.
 * 
 * @param dirHandle - The parent directory handle
 * @param name - The name of the directory to create
 * @returns Promise resolving to the created directory handle
 * @throws {ValidationError} If the directory name is invalid
 * @throws {FileOperationError} If directory creation fails
 * 
 * @example
 * ```typescript
 * const newDir = await createDirectory(parentDir, 'renamed');
 * ```
 */
export async function createDirectory(
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  // Validate and sanitize folder name
  const validation = validateFolderName(name);
  if (!validation.valid) {
    throw new ValidationError(
      validation.error || 'Invalid folder name',
      'folderName',
      name
    );
  }
  
  const sanitizedName = validation.sanitized || name;
  
  // Try to get existing directory first
  try {
    const existingDir = await dirHandle.getDirectoryHandle(sanitizedName);
    return existingDir;
  } catch (err: unknown) {
    // Directory doesn't exist, create it
    return await dirHandle.getDirectoryHandle(sanitizedName, { create: true });
  }
}

/**
 * Renames a file in place using the File System Access API
 * 
 * Uses the `move()` method if available (Chrome 102+) for efficient in-place
 * renaming. Validates and sanitizes the new filename before renaming.
 * Includes retry logic with exponential backoff for transient errors.
 * 
 * @param fileHandle - The file handle to rename
 * @param newName - The new filename (without path)
 * @returns Promise that resolves when the file is renamed
 * @throws {ValidationError} If the new filename is invalid
 * @throws {FileOperationError} If renaming fails after retries
 * 
 * @example
 * ```typescript
 * await renameFile(fileHandle, 'new-name.jpg');
 * ```
 */
export async function renameFile(
  fileHandle: FileSystemFileHandle,
  newName: string
): Promise<void> {
  // Sanitize filename
  const sanitizedName = sanitizeFilename(newName);
  
  // Validate the sanitized name
  if (!sanitizedName || sanitizedName.trim() === '') {
    throw new ValidationError(
      'Filename cannot be empty after sanitization',
      'filename',
      newName
    );
  }
  
  // Use handle.move() if available (Chrome 102+)
  // This allows in-place rename when we have the file handle
  // The browser API supports move(newName: string) for in-place rename
  if ('move' in fileHandle && typeof fileHandle.move === 'function') {
    try {
      // Retry the move operation with exponential backoff
      await retryFileOperation(
        async () => {
      // TypeScript sees move as (newName: string) => Promise<void> from filesystem.d.ts
          await fileHandle.move(sanitizedName);
        },
        'rename',
        sanitizedName,
        { maxAttempts: 3, initialDelayMs: 500 }
      );
      return;
    } catch (err: unknown) {
      // If move fails after retries, fall through to error
      const error = err instanceof Error ? err : new Error(String(err));
      throw new FileOperationError(
        error.message,
        'rename',
        sanitizedName,
        { originalError: error.message }
      );
    }
  }
  
  // Fallback: move() not available
  throw new FileSystemError(
    'File rename requires browser support for FileSystemHandle.move(). Please use Chrome 102+ or select a destination folder.',
    'renameFile'
  );
}

/**
 * Moves a file to a target directory with optional renaming
 * 
 * Attempts to use the `move()` method first for efficiency. Falls back to
 * copy method if move fails. Handles both FileSystemFileHandle and File objects.
 * Includes retry logic with exponential backoff.
 * 
 * @param sourceHandle - The source file handle or File object
 * @param targetDirHandle - The target directory handle
 * @param newName - The new filename in the target directory
 * @returns Promise that resolves when the file is moved
 * @throws {ValidationError} If the new filename is invalid
 * @throws {FileOperationError} If moving fails
 * 
 * @example
 * ```typescript
 * await moveFile(sourceFile, targetDir, 'moved-file.jpg');
 * ```
 */
export async function moveFile(
  sourceHandle: FileSystemFileHandle | File,
  targetDirHandle: FileSystemDirectoryHandle,
  newName: string
): Promise<void> {
  // Sanitize filename
  const sanitizedName = sanitizeFilename(newName);
  
  // Validate the sanitized name
  if (!sanitizedName || sanitizedName.trim() === '') {
    throw new ValidationError(
      'Filename cannot be empty after sanitization',
      'filename',
      newName
    );
  }
  
  // Check if sourceHandle is a File object (from file input) or a FileSystemFileHandle
  let file: File;
  if (sourceHandle instanceof File) {
    // It's a regular File object (from file input/drop)
    file = sourceHandle;
  } else {
    // It's a FileSystemFileHandle - try to use move() first
    // Use handle.move() if available (Chrome 102+) - this is the proper way to move files
    // The API signature: fileHandle.move(destinationDirHandle, newName?) for moving to a different directory
    if ('move' in sourceHandle && typeof sourceHandle.move === 'function') {
      try {
        // Retry the move operation with exponential backoff
        await retryFileOperation(
          async () => {
        // Move to target directory with new name
        // Note: move() can take (destinationDir, newName) but TypeScript types may not reflect this
        // Using type assertion as the API supports this in Chrome 102+
            await (sourceHandle.move as any)(targetDirHandle, sanitizedName);
          },
          'move',
          sanitizedName,
          { maxAttempts: 3, initialDelayMs: 500 }
        );
        return;
      } catch (moveErr: unknown) {
        // If direct move fails after retries, fall back to copy method
        logger.warn('Direct move() failed after retries, falling back to copy method', moveErr instanceof Error ? moveErr : new Error(String(moveErr)), { fileName: sanitizedName });
        // Don't return - fall through to copy method
      }
    }
    
    // Get file content from FileSystemFileHandle
    file = await sourceHandle.getFile();
  }
  
  // Fallback: copy method (creates new file in target directory)
  // Note: This doesn't delete the original file, but creates a copy in the destination
  try {
    // Retry the copy operation with exponential backoff
    await retryFileOperation(
      async () => {
    // Get file content
    const content = await file.arrayBuffer();
    
    // Create new file in target directory
        const newFileHandle = await targetDirHandle.getFileHandle(sanitizedName, { create: true });
    const writable = await newFileHandle.createWritable();
    await writable.write(content);
    await writable.close();
      },
      'move (copy fallback)',
      sanitizedName,
      { maxAttempts: 3, initialDelayMs: 500 }
    );
    
    // Note: Original file remains - we can't delete it without the parent directory handle
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    throw new FileOperationError(
      error.message,
      'move',
      newName,
      { originalError: error.message }
    );
  }
}

export async function getFile(fileHandle: FileSystemFileHandle): Promise<File> {
  return await fileHandle.getFile();
}

// Generate thumbnail URL for an image file
export function createThumbnailUrl(file: File): string {
  return URL.createObjectURL(file);
}

// Revoke thumbnail URL to free memory
export function revokeThumbnailUrl(url: string): void {
  URL.revokeObjectURL(url);
}

