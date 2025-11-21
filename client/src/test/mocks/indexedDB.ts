/**
 * Mock implementations for IndexedDB operations
 * Used in tests to simulate database operations
 */

import type { Settings, Preset, WordBank, Theme, NameLedger, AuditBatch, LastFolder } from '../../features/store/db';

// In-memory storage for mocks
const mockStorage: {
  settings: Map<string, Settings>;
  presets: Map<string, Preset>;
  wordBanks: Map<string, WordBank>;
  themes: Map<string, Theme>;
  nameLedger: Map<string, NameLedger>;
  auditBatches: Map<string, AuditBatch>;
  lastFolders: Map<string, LastFolder>;
} = {
  settings: new Map(),
  presets: new Map(),
  wordBanks: new Map(),
  themes: new Map(),
  nameLedger: new Map(),
  auditBatches: new Map(),
  lastFolders: new Map(),
};

/**
 * Mock Dexie table interface
 */
export class MockTable<T> {
  private storage: Map<string, T>;

  constructor(storage: Map<string, T>) {
    this.storage = storage;
  }

  async get(key: string): Promise<T | undefined> {
    return this.storage.get(key);
  }

  async add(item: T, key?: string): Promise<string> {
    const id = (item as { id: string }).id || key || `mock-${Date.now()}`;
    this.storage.set(id, { ...item, id } as T);
    return id;
  }

  async put(item: T, key?: string): Promise<string> {
    const id = (item as { id: string }).id || key || `mock-${Date.now()}`;
    this.storage.set(id, { ...item, id } as T);
    return id;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async toArray(): Promise<T[]> {
    return Array.from(this.storage.values());
  }

  async bulkAdd(items: T[]): Promise<void> {
    items.forEach(item => {
      const id = (item as { id: string }).id || `mock-${Date.now()}-${Math.random()}`;
      this.storage.set(id, { ...item, id } as T);
    });
  }

  async bulkPut(items: T[]): Promise<void> {
    items.forEach(item => {
      const id = (item as { id: string }).id || `mock-${Date.now()}-${Math.random()}`;
      this.storage.set(id, { ...item, id } as T);
    });
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async count(): Promise<number> {
    return this.storage.size;
  }

  async update(key: string, changes: Partial<T>): Promise<number> {
    const existing = this.storage.get(key);
    if (existing) {
      this.storage.set(key, { ...existing, ...changes } as T);
      return 1;
    }
    return 0;
  }

  orderBy(field: string): {
    reverse: () => {
      toArray: () => Promise<T[]>;
    };
    toArray: () => Promise<T[]>;
  } {
    return {
      reverse: () => ({
        toArray: async () => {
          const items = Array.from(this.storage.values());
          // Sort by the specified field in descending order
          items.sort((a, b) => {
            const aVal = (a as Record<string, unknown>)[field];
            const bVal = (b as Record<string, unknown>)[field];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              return bVal.localeCompare(aVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return bVal - aVal;
            }
            return 0;
          });
          return items;
        },
      }),
      toArray: async () => {
        const items = Array.from(this.storage.values());
        // Sort by the specified field in ascending order
        items.sort((a, b) => {
          const aVal = (a as Record<string, unknown>)[field];
          const bVal = (b as Record<string, unknown>)[field];
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return aVal.localeCompare(bVal);
          }
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return aVal - bVal;
          }
          return 0;
        });
        return items;
      },
    };
  }
}

/**
 * Mock Dexie database
 */
export class MockRenamelyDB {
  settings: MockTable<Settings>;
  presets: MockTable<Preset>;
  wordBanks: MockTable<WordBank>;
  themes: MockTable<Theme>;
  nameLedger: MockTable<NameLedger>;
  audits: MockTable<AuditBatch>;
  lastFolders: MockTable<LastFolder>;

  constructor() {
    this.settings = new MockTable(mockStorage.settings);
    this.presets = new MockTable(mockStorage.presets);
    this.wordBanks = new MockTable(mockStorage.wordBanks);
    this.themes = new MockTable(mockStorage.themes);
    this.nameLedger = new MockTable(mockStorage.nameLedger);
    this.audits = new MockTable(mockStorage.auditBatches);
    this.lastFolders = new MockTable(mockStorage.lastFolders);
  }

  /**
   * Clear all mock data
   */
  clearAll(): void {
    mockStorage.settings.clear();
    mockStorage.presets.clear();
    mockStorage.wordBanks.clear();
    mockStorage.themes.clear();
    mockStorage.nameLedger.clear();
    mockStorage.auditBatches.clear();
    mockStorage.lastFolders.clear();
  }

  /**
   * Initialize with test data
   */
  async initializeTestData(): Promise<void> {
    // Add default settings
    await this.settings.add({
      id: 'default-settings',
      theme: 'system',
      locale: 'en',
      maxFilenameLength: 255,
      stripDiacritics: false,
      asciiOnly: false,
      telemetryEnabled: false,
      highContrast: false,
      renameDestinationOption: 'subfolder',
      renameSubfolderName: 'renamed',
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Create a mock database instance
 */
export function createMockDB(): MockRenamelyDB {
  return new MockRenamelyDB();
}

/**
 * Reset all mock storage
 */
export function resetMockDB(): void {
  mockStorage.settings.clear();
  mockStorage.presets.clear();
  mockStorage.wordBanks.clear();
  mockStorage.themes.clear();
  mockStorage.nameLedger.clear();
  mockStorage.auditBatches.clear();
  mockStorage.lastFolders.clear();
}

