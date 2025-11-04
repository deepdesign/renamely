// Tauri bridge for file operations (fallback for desktop)

export interface TauriFileHandle {
  path: string;
  name: string;
  size: number;
  lastModified: number;
}

let isTauri = false;

// Check if running in Tauri
if (typeof window !== 'undefined') {
  try {
    isTauri = (window as any).__TAURI__ !== undefined;
  } catch {
    // Not in Tauri
  }
}

export function isTauriEnvironment(): boolean {
  return isTauri;
}

export async function selectDirectoryTauri(): Promise<string | null> {
  if (!isTauri) {
    throw new Error('Not running in Tauri environment');
  }

  const { open } = await import('@tauri-apps/api/dialog');
  const selected = await open({
    directory: true,
    multiple: false,
  });

  if (Array.isArray(selected) || selected === null) {
    return null;
  }

  return selected as string;
}

export async function scanDirectoryTauri(dirPath: string): Promise<TauriFileHandle[]> {
  if (!isTauri) {
    throw new Error('Not running in Tauri environment');
  }

  const { readDir } = await import('@tauri-apps/api/fs');
  const files: TauriFileHandle[] = [];

  async function scan(currentPath: string) {
    const entries = await readDir(currentPath, { recursive: true });
    
    for (const entry of entries) {
      if (entry.children) {
        // It's a directory, recurse
        await scan(entry.path);
      } else if (entry.path) {
        // It's a file
        const ext = entry.path.substring(entry.path.lastIndexOf('.'));
        if (['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.heic', '.gif'].includes(ext.toLowerCase())) {
          files.push({
            path: entry.path,
            name: entry.name || '',
            size: entry.size || 0,
            lastModified: new Date(entry.mtime || Date.now()).getTime(),
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
    throw new Error('Not running in Tauri environment');
  }

  const { renameFile } = await import('@tauri-apps/api/fs');
  await renameFile(oldPath, newPath);
}

export async function createDirectoryTauri(dirPath: string): Promise<void> {
  if (!isTauri) {
    throw new Error('Not running in Tauri environment');
  }

  const { createDir } = await import('@tauri-apps/api/fs');
  await createDir(dirPath, { recursive: true });
}

