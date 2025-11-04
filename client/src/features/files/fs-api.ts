// Browser File System Access API implementation

export interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  keys(): AsyncIterableIterator<string>;
  values(): AsyncIterableIterator<FileSystemHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.heic', '.gif',
  '.JPG', '.JPEG', '.PNG', '.WEBP', '.TIFF', '.TIF', '.HEIC', '.GIF',
]);

export function isImageFile(filename: string): boolean {
  const ext = filename.substring(filename.lastIndexOf('.'));
  return IMAGE_EXTENSIONS.has(ext);
}

export async function selectDirectory(startIn?: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | null> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API not supported in this browser');
  }

  try {
    const options: any = {
      mode: 'readwrite',
    };
    
    // Use startIn if provided (helps browser remember last location)
    if (startIn) {
      options.startIn = startIn;
    }
    
    const handle = await (window as any).showDirectoryPicker(options);
    return handle as FileSystemDirectoryHandle;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

export async function selectImageFiles(startIn?: FileSystemDirectoryHandle): Promise<FileSystemFileHandle[] | null> {
  if (!('showOpenFilePicker' in window)) {
    throw new Error('File System Access API not supported in this browser');
  }

  try {
    const options: any = {
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
    
    const handles = await (window as any).showOpenFilePicker(options);
    return handles as FileSystemFileHandle[];
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  recursive: boolean = true
): Promise<Array<{ handle: FileSystemFileHandle; path: string }>> {
  const files: Array<{ handle: FileSystemFileHandle; path: string }> = [];

  async function scan(currentDir: FileSystemDirectoryHandle, currentPath: string = '') {
    for await (const [name, handle] of currentDir.entries()) {
      if (handle.kind === 'file') {
        if (isImageFile(name)) {
          files.push({
            handle: handle as FileSystemFileHandle,
            path: currentPath ? `${currentPath}/${name}` : name,
          });
        }
      } else if (handle.kind === 'directory' && recursive) {
        await scan(handle as FileSystemDirectoryHandle, currentPath ? `${currentPath}/${name}` : name);
      }
    }
  }

  await scan(dirHandle);
  return files;
}

export async function createDirectory(
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  // Sanitize folder name - remove any path separators to prevent nested folder creation
  // Take only the last segment if path separators are present
  const sanitizedName = name.split(/[/\\]/).filter(Boolean).pop() || name;
  
  // Validate folder name is not empty
  if (!sanitizedName || sanitizedName.trim() === '') {
    throw new Error('Invalid folder name: folder name cannot be empty');
  }
  
  // Try to get existing directory first
  try {
    const existingDir = await dirHandle.getDirectoryHandle(sanitizedName);
    return existingDir;
  } catch (err: any) {
    // Directory doesn't exist, create it
    return await dirHandle.getDirectoryHandle(sanitizedName, { create: true });
  }
}

export async function renameFile(
  fileHandle: FileSystemFileHandle,
  newName: string
): Promise<void> {
  // Use handle.move() if available (Chrome 102+)
  // This allows in-place rename when we have the file handle
  if ('move' in fileHandle && typeof (fileHandle as any).move === 'function') {
    try {
      await (fileHandle as any).move(newName);
      return;
    } catch (err: any) {
      // If move fails, fall through to error
      throw new Error(`Failed to rename file: ${err.message}`);
    }
  }
  
  // Fallback: move() not available
  throw new Error('File rename requires browser support for FileSystemHandle.move(). Please use Chrome 102+ or select a destination folder.');
}

export async function moveFile(
  sourceHandle: FileSystemFileHandle | File,
  targetDirHandle: FileSystemDirectoryHandle,
  newName: string
): Promise<void> {
  // Check if sourceHandle is a File object (from file input) or a FileSystemFileHandle
  let file: File;
  if (sourceHandle instanceof File) {
    // It's a regular File object (from file input/drop)
    file = sourceHandle;
  } else {
    // It's a FileSystemFileHandle - try to use move() first
    // Use handle.move() if available (Chrome 102+) - this is the proper way to move files
    // The API signature: fileHandle.move(destinationDirHandle, newName?) for moving to a different directory
    if ('move' in sourceHandle && typeof (sourceHandle as any).move === 'function') {
      try {
        // Move to target directory with new name
        await (sourceHandle as any).move(targetDirHandle, newName);
        return;
      } catch (moveErr: any) {
        // If direct move fails, fall back to copy method
        console.warn('Direct move() failed, falling back to copy method:', moveErr);
        // Don't return - fall through to copy method
      }
    }
    
    // Get file content from FileSystemFileHandle
    file = await sourceHandle.getFile();
  }
  
  // Fallback: copy method (creates new file in target directory)
  // Note: This doesn't delete the original file, but creates a copy in the destination
  try {
    // Get file content
    const content = await file.arrayBuffer();
    
    // Create new file in target directory
    const newFileHandle = await targetDirHandle.getFileHandle(newName, { create: true });
    const writable = await newFileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    
    // Note: Original file remains - we can't delete it without the parent directory handle
  } catch (err: any) {
    throw new Error(`Failed to move file: ${err.message}`);
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

