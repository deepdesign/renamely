// Tauri bridge for file operations (fallback for desktop)

import { isTauriFileEntry, isString } from '../../lib/type-guards';
import { validateFilePath } from '../../lib/validators';
import { logger } from '../../lib/logger';
import { FileSystemError, ValidationError, ConfigurationError } from '../../lib/errors';

export interface TauriFileHandle {
  path: string;
  name: string;
  size: number;
  lastModified: number;
}

// Type for Tauri file system entry
interface TauriFileEntry {
  name: string;
  path: string;
  children?: TauriFileEntry[];
  size?: number;
  mtime?: number | string;
}

// Type for window with Tauri
interface WindowWithTauri extends Window {
  __TAURI__?: unknown;
}

let isTauri = false;

// Check if running in Tauri
if (typeof window !== 'undefined') {
  try {
    isTauri = (window as WindowWithTauri).__TAURI__ !== undefined;
  } catch {
    // Not in Tauri
  }
}

export function isTauriEnvironment(): boolean {
  return isTauri;
}

export async function selectDirectoryTauri(): Promise<string | null> {
  if (!isTauri) {
    throw new ConfigurationError(
      'Not running in Tauri environment',
      'tauriEnvironment'
    );
  }

  const { open } = await import('@tauri-apps/api/dialog');
  const selected = await open({
    directory: true,
    multiple: false,
  });

  if (Array.isArray(selected) || selected === null) {
    return null;
  }

  if (!isString(selected)) {
    return null;
  }

  // Validate the path
  const pathValidation = validateFilePath(selected);
  if (!pathValidation.valid) {
    throw new ValidationError(
      pathValidation.error || 'Invalid path selected',
      'path',
      selected
    );
  }

  return selected;
}

export async function scanDirectoryTauri(dirPath: string): Promise<TauriFileHandle[]> {
  if (!isTauri) {
    throw new ConfigurationError(
      'Not running in Tauri environment',
      'tauriEnvironment'
    );
  }

  const { readDir } = await import('@tauri-apps/api/fs');
  const files: TauriFileHandle[] = [];

  async function scan(currentPath: string) {
    // Validate current path
    const pathValidation = validateFilePath(currentPath);
    if (!pathValidation.valid) {
      throw new ValidationError(
        pathValidation.error || 'Invalid directory path',
        'path',
        currentPath
      );
    }

    const entries = await readDir(currentPath, { recursive: true });
    
    if (!Array.isArray(entries)) {
      throw new FileSystemError(
        'Invalid response from readDir: expected array',
        'scanDirectory',
        currentPath
      );
    }
    
    for (const entry of entries) {
      if (!isTauriFileEntry(entry)) {
        logger.warn('Invalid entry in directory scan, skipping', { entry });
        continue;
      }
      if (entry.children) {
        // It's a directory, recurse
        await scan(entry.path);
      } else if (entry.path) {
        // It's a file
        const ext = entry.path.substring(entry.path.lastIndexOf('.'));
        if (['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.heic', '.gif'].includes(ext.toLowerCase())) {
          // Handle mtime as number or string
          let lastModified = Date.now();
          if (entry.mtime !== undefined) {
            if (typeof entry.mtime === 'number') {
              lastModified = entry.mtime;
            } else if (typeof entry.mtime === 'string') {
              lastModified = new Date(entry.mtime).getTime();
            }
          }
          
          files.push({
            path: entry.path,
            name: entry.name || '',
            size: entry.size || 0,
            lastModified,
          });
        }
      }
    }
  }

  await scan(dirPath);
  return files;
}

export async function renameFileTauri(oldPath: string, newPath: string): Promise<void> {
  if (!isTauri) {
    throw new ConfigurationError(
      'Not running in Tauri environment',
      'tauriEnvironment'
    );
  }

  // Validate paths
  const oldPathValidation = validateFilePath(oldPath);
  if (!oldPathValidation.valid) {
    throw new ValidationError(
      oldPathValidation.error || 'Invalid old path',
      'oldPath',
      oldPath
    );
  }

  const newPathValidation = validateFilePath(newPath);
  if (!newPathValidation.valid) {
    throw new ValidationError(
      newPathValidation.error || 'Invalid new path',
      'newPath',
      newPath
    );
  }

  const { renameFile } = await import('@tauri-apps/api/fs');
  await renameFile(oldPath, newPath);
}

export async function createDirectoryTauri(dirPath: string): Promise<void> {
  if (!isTauri) {
    throw new ConfigurationError(
      'Not running in Tauri environment',
      'tauriEnvironment'
    );
  }

  // Validate path
  const pathValidation = validateFilePath(dirPath);
  if (!pathValidation.valid) {
    throw new ValidationError(
      pathValidation.error || 'Invalid directory path',
      'path',
      dirPath
    );
  }

  const { createDir } = await import('@tauri-apps/api/fs');
  await createDir(dirPath, { recursive: true });
}

