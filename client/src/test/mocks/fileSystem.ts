/**
 * Mock implementations for File System Access API
 * Used in tests to simulate file system operations
 */

export interface MockFileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  getFile?: () => Promise<File>;
  getDirectoryHandle?: (name: string, options?: { create?: boolean }) => Promise<MockFileSystemHandle>;
  getFileHandle?: (name: string, options?: { create?: boolean }) => Promise<MockFileSystemHandle>;
  move?: (target: MockFileSystemHandle | string, newName?: string) => Promise<void>;
  entries?: () => AsyncIterableIterator<[string, MockFileSystemHandle]>;
}

export class MockFileSystemFileHandle implements FileSystemFileHandle {
  kind: FileSystemHandleKind = 'file';
  name: string;
  private file: File;

  constructor(name: string, file: File) {
    this.name = name;
    this.file = file;
  }

  async getFile(): Promise<File> {
    return this.file;
  }

  async move(target: FileSystemDirectoryHandle | string, newName?: string): Promise<void> {
    if (typeof target === 'string') {
      // In-place rename
      this.name = newName || target;
    } else {
      // Move to directory
      this.name = newName || this.name;
    }
  }

  async queryPermission(_descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    return 'granted';
  }

  async requestPermission(_descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    return 'granted';
  }

  isSameEntry(other: FileSystemHandle): boolean {
    return this === other;
  }
}

export class MockFileSystemDirectoryHandle implements FileSystemDirectoryHandle {
  kind: FileSystemHandleKind = 'directory';
  name: string;
  private entries: Map<string, FileSystemHandle> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  // Helper methods for testing
  addFile(name: string, handle: FileSystemFileHandle): void {
    this.entries.set(name, handle);
  }

  addDirectory(name: string, handle: FileSystemDirectoryHandle): void {
    this.entries.set(name, handle);
  }

  hasFile(name: string): boolean {
    const handle = this.entries.get(name);
    return handle?.kind === 'file';
  }

  hasDirectory(name: string): boolean {
    const handle = this.entries.get(name);
    return handle?.kind === 'directory';
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle> {
    const handle = this.entries.get(name);
    if (handle && handle.kind === 'file') {
      return handle as FileSystemFileHandle;
    }
    if (options?.create) {
      const file = new File([], name);
      const fileHandle = new MockFileSystemFileHandle(name, file);
      this.entries.set(name, fileHandle);
      return fileHandle;
    }
    throw new DOMException('File not found', 'NotFoundError');
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle> {
    const handle = this.entries.get(name);
    if (handle && handle.kind === 'directory') {
      return handle as FileSystemDirectoryHandle;
    }
    if (options?.create) {
      const dirHandle = new MockFileSystemDirectoryHandle(name);
      this.entries.set(name, dirHandle);
      return dirHandle;
    }
    throw new DOMException('Directory not found', 'NotFoundError');
  }

  async removeEntry(name: string, options?: { recursive?: boolean }): Promise<void> {
    this.entries.delete(name);
  }

  async resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null> {
    // Simple implementation - could be enhanced
    return null;
  }

  async queryPermission(_descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    return 'granted';
  }

  async requestPermission(_descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState> {
    return 'granted';
  }

  isSameEntry(other: FileSystemHandle): boolean {
    return this === other;
  }

  *keys(): IterableIterator<string> {
    yield* this.entries.keys();
  }

  *values(): IterableIterator<FileSystemHandle> {
    yield* this.entries.values();
  }

  *entries(): IterableIterator<[string, FileSystemHandle]> {
    yield* this.entries.entries();
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]> {
    return this.asyncEntries();
  }

  private async *asyncEntries(): AsyncIterableIterator<[string, FileSystemHandle]> {
    for (const entry of this.entries.entries()) {
      yield entry;
    }
  }
}

/**
 * Create a mock file handle
 */
export function createMockFileHandle(name: string, content: string | Blob = ''): FileSystemFileHandle {
  const file = typeof content === 'string' 
    ? new File([content], name, { type: 'image/png' })
    : new File([content], name);
  return new MockFileSystemFileHandle(name, file);
}

/**
 * Create a mock directory handle
 */
export function createMockDirectoryHandle(name: string): FileSystemDirectoryHandle {
  return new MockFileSystemDirectoryHandle(name);
}

/**
 * Setup global mocks for File System Access API
 */
export function setupFileSystemMocks() {
  // Mock showDirectoryPicker
  global.showDirectoryPicker = async (options?: DirectoryPickerOptions) => {
    const dirHandle = createMockDirectoryHandle('test-directory');
    return dirHandle;
  };

  // Mock showOpenFilePicker
  global.showOpenFilePicker = async (options?: OpenFilePickerOptions) => {
    const fileHandle = createMockFileHandle('test-image.png');
    return [fileHandle];
  };
}

