import Dexie, { Table } from 'dexie';

// Settings
export interface Settings {
  id: string;
  defaultPresetId?: string;
  visiblePresetIds?: string[]; // Array of preset IDs to show on template selection screen
  theme: 'light' | 'dark' | 'system';
  locale: string;
  maxFilenameLength: number;
  stripDiacritics: boolean;
  asciiOnly: boolean;
  telemetryEnabled: boolean;
  highContrast: boolean;
  renameDestinationOption?: 'subfolder' | 'sibling'; // Default: 'subfolder'
  renameSubfolderName?: string; // Default: 'renamed'
  renameSiblingFolderName?: string; // Default: 'original'
  updatedAt: string;
}

// Themes
export interface Theme {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Presets
export interface Preset {
  id: string;
  name: string;
  template: string; // e.g., "{adjective}-{noun}"
  delimiter: string;
  caseStyle: 'Title' | 'Sentence' | 'lower' | 'UPPER';
  numAdjectives: number;
  prefix?: string;
  suffix?: string;
  includeDateStamp: boolean;
  dateFormat?: string;
  useCounter: boolean;
  counterStart: number;
  nsfwFilter: boolean;
  wordBankIds: {
    adjectives: string[];
    nouns: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Word Banks
export interface WordBank {
  id: string;
  themeId: string; // Theme this word bank belongs to
  type: 'adjective' | 'noun';
  locale: string;
  name: string;
  words: string[];
  category?: string;
  nsfw: boolean;
  createdAt: string;
  updatedAt: string;
}

// Name Ledger (for uniqueness tracking)
export interface NameLedger {
  nameSlug: string; // normalized full name with extension (e.g., "bright-sky.jpg")
  createdAt: string;
  presetId?: string;
  locale?: string;
  released?: boolean; // for undo operations
}

// Audit Logs
export interface AuditEntry {
  oldPath: string;
  oldName: string;
  newPath: string;
  newName: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  timestamp: string;
  fileHash?: string;
}

export interface AuditBatch {
  id: string;
  batchId: string;
  entries: AuditEntry[];
  createdAt: string;
  completedAt?: string;
  status: 'pending' | 'completed' | 'partial' | 'failed';
}

// Last folder selection
export interface LastFolder {
  name: string;
  savedAt: string;
}

class RenamelyDB extends Dexie {
  settings!: Table<Settings>;
  themes!: Table<Theme>;
  presets!: Table<Preset>;
  wordBanks!: Table<WordBank>;
  nameLedger!: Table<NameLedger>;
  audits!: Table<AuditBatch>;
  lastFolders!: Table<LastFolder>;

  constructor() {
    super('RenamelyDB');
    
    this.version(1).stores({
      settings: 'id',
      presets: 'id, createdAt',
      wordBanks: 'id, type, locale',
      nameLedger: 'nameSlug, createdAt, presetId',
      audits: 'id, batchId, createdAt',
    });
    
    this.version(2).stores({
      settings: 'id',
      presets: 'id, createdAt',
      wordBanks: 'id, type, locale',
      nameLedger: 'nameSlug, createdAt, presetId',
      audits: 'id, batchId, createdAt',
      lastFolders: 'name, savedAt',
    });
    
    this.version(3).stores({
      settings: 'id',
      themes: 'id, createdAt',
      presets: 'id, createdAt',
      wordBanks: 'id, themeId, type, locale',
      nameLedger: 'nameSlug, createdAt, presetId',
      audits: 'id, batchId, createdAt',
      lastFolders: 'name, savedAt',
    });
  }
}

export const db = new RenamelyDB();

// Initialize default settings
export async function initializeDB(): Promise<void> {
  try {
    // Ensure database is open (idempotent - safe to call if already open)
    await db.open();
    
    const existingSettings = await db.settings.get('default');
    if (!existingSettings) {
      await db.settings.add({
        id: 'default',
        theme: 'system',
        locale: 'en',
        maxFilenameLength: 255,
        stripDiacritics: false,
        asciiOnly: false,
        telemetryEnabled: false,
        highContrast: false,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    // If there's a database error, try to handle it gracefully
    // For migration errors or corrupted databases, we might need to delete and recreate
    if (error instanceof Error) {
      const errorName = error.name || '';
      // Check for common Dexie errors that might require database reset
      if (errorName.includes('Database') || errorName.includes('Version') || errorName.includes('Constraint')) {
        console.warn('Database error detected, attempting to reset...');
        try {
          await db.delete();
          await db.open();
          // Retry adding default settings
          await db.settings.add({
            id: 'default',
            theme: 'system',
            locale: 'en',
            maxFilenameLength: 255,
            stripDiacritics: false,
            asciiOnly: false,
            telemetryEnabled: false,
            highContrast: false,
            updatedAt: new Date().toISOString(),
          });
          console.log('Database reset successful');
        } catch (retryError) {
          console.error('Failed to reset database:', retryError);
          // Don't throw - allow the app to continue with degraded functionality
        }
      } else {
        // For other errors, rethrow
        throw error;
      }
    } else {
      throw error;
    }
  }
}

