import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Preset, Settings, WordBank, AuditBatch, Theme } from './db';

// File representation
export interface ImageFile {
  id: string;
  file: File;
  fileHandle?: FileSystemFileHandle; // Track file handle for renaming
  path: string;
  originalName: string;
  suggestedName: string;
  currentName: string; // editable
  extension: string;
  thumbnailUrl: string;
  size: number;
  lastModified: number;
  locked: boolean; // prevent regeneration
  error?: string;
}

// App state
interface AppState {
  // Files
  selectedDirectory: FileSystemDirectoryHandle | null;
  images: ImageFile[];
  selectedImageIds: Set<string>;
  
  // Current theme and preset
  currentTheme: Theme | null;
  themes: Theme[];
  currentPreset: Preset | null;
  presets: Preset[];
  
  // Settings
  settings: Settings | null;
  
  // Word banks
  wordBanks: WordBank[];
  
  // Batch operations
  isProcessing: boolean;
  progress: number;
  totalFiles: number;
  processedFiles: number;
  errors: Array<{ fileId: string; error: string }>;
  
  // Audit
  lastBatchId: string | null;
  auditHistory: AuditBatch[];
  
  // Session state
  sessionUsedNames: Set<string>;
  
  // UI state
  isDarkMode: boolean;
  showSettings: boolean;
  showPresets: boolean;
  showAudit: boolean;
}

interface AppActions {
  // Files
  setSelectedDirectory: (dir: FileSystemDirectoryHandle | null) => void;
  setImages: (images: ImageFile[]) => void;
  updateImage: (id: string, updates: Partial<ImageFile>) => void;
  updateImageName: (id: string, name: string) => void;
  toggleImageSelection: (id: string) => void;
  selectAllImages: () => void;
  deselectAllImages: () => void;
  lockImage: (id: string) => void;
  unlockImage: (id: string) => void;
  
  // Themes
  setCurrentTheme: (theme: Theme | null) => void;
  setThemes: (themes: Theme[]) => void;
  addTheme: (theme: Theme) => Promise<void>;
  updateTheme: (theme: Theme) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;
  
  // Presets
  setCurrentPreset: (preset: Preset | null) => void;
  setPresets: (presets: Preset[]) => void;
  addPreset: (preset: Preset) => Promise<void>;
  updatePreset: (preset: Preset) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  
  // Settings
  setSettings: (settings: Settings) => Promise<void>;
  loadSettings: () => Promise<void>;
  
  // Word banks
  setWordBanks: (banks: WordBank[]) => void;
  addWordBank: (bank: WordBank) => Promise<void>;
  updateWordBank: (bank: WordBank) => Promise<void>;
  deleteWordBank: (id: string) => Promise<void>;
  
  // Batch operations
  setProcessing: (processing: boolean) => void;
  setProgress: (progress: number, total: number) => void;
  addError: (fileId: string, error: string) => void;
  clearErrors: () => void;
  
  // Audit
  setLastBatchId: (batchId: string | null) => void;
  addAuditBatch: (batch: AuditBatch) => Promise<void>;
  loadAuditHistory: () => Promise<void>;
  
  // Session
  addUsedName: (name: string) => void;
  clearSessionUsedNames: () => void;
  
  // UI
  toggleDarkMode: () => void;
  setShowSettings: (show: boolean) => void;
  setShowPresets: (show: boolean) => void;
  setShowAudit: (show: boolean) => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  devtools(
      (set) => {
        // Initialize dark mode from localStorage
        const savedTheme = localStorage.getItem('color-theme');
        const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
        
        return {
        // Initial state
        selectedDirectory: null,
        images: [],
        selectedImageIds: new Set(),
        currentTheme: null,
        themes: [],
        currentPreset: null,
        presets: [],
        settings: null,
        wordBanks: [],
        isProcessing: false,
        progress: 0,
        totalFiles: 0,
        processedFiles: 0,
        errors: [],
        lastBatchId: null,
        auditHistory: [],
        sessionUsedNames: new Set(),
        isDarkMode: initialDarkMode,
        showSettings: false,
        showPresets: false,
        showAudit: false,

        // File actions
        setSelectedDirectory: (dir) => set({ selectedDirectory: dir }),
        setImages: (images) => set({ images }),
        updateImage: (id, updates) =>
          set((state) => ({
            images: state.images.map((img) =>
              img.id === id ? { ...img, ...updates } : img
            ),
          })),
        updateImageName: (id, name) =>
          set((state) => ({
            images: state.images.map((img) =>
              img.id === id ? { ...img, currentName: name } : img
            ),
          })),
        toggleImageSelection: (id) =>
          set((state) => {
            const newSet = new Set(state.selectedImageIds);
            if (newSet.has(id)) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            return { selectedImageIds: newSet };
          }),
        selectAllImages: () =>
          set((state) => ({
            selectedImageIds: new Set(state.images.map((img) => img.id)),
          })),
        deselectAllImages: () => set({ selectedImageIds: new Set() }),
        lockImage: (id) =>
          set((state) => ({
            images: state.images.map((img) =>
              img.id === id ? { ...img, locked: true } : img
            ),
          })),
        unlockImage: (id) =>
          set((state) => ({
            images: state.images.map((img) =>
              img.id === id ? { ...img, locked: false } : img
            ),
          })),

        // Theme actions
        setCurrentTheme: (theme) => set({ currentTheme: theme }),
        setThemes: (themes) => set({ themes }),
        addTheme: async (theme) => {
          const { db } = await import('./db');
          await db.themes.add(theme);
          set((state) => ({ themes: [...state.themes, theme] }));
        },
        updateTheme: async (theme) => {
          const { db } = await import('./db');
          await db.themes.update(theme.id, theme);
          set((state) => ({
            themes: state.themes.map((t) => (t.id === theme.id ? theme : t)),
            currentTheme: state.currentTheme?.id === theme.id ? theme : state.currentTheme,
          }));
        },
        deleteTheme: async (id) => {
          const { db } = await import('./db');
          await db.themes.delete(id);
          set((state) => ({
            themes: state.themes.filter((t) => t.id !== id),
            currentTheme: state.currentTheme?.id === id ? null : state.currentTheme,
          }));
        },
        
        // Preset actions
        setCurrentPreset: (preset) => set({ currentPreset: preset }),
        setPresets: (presets) => set({ presets }),
        addPreset: async (preset) => {
          const { db } = await import('./db');
          await db.presets.add(preset);
          set((state) => ({ presets: [...state.presets, preset] }));
        },
        updatePreset: async (preset) => {
          const { db } = await import('./db');
          await db.presets.update(preset.id, preset);
          set((state) => ({
            presets: state.presets.map((p) => (p.id === preset.id ? preset : p)),
            currentPreset:
              state.currentPreset?.id === preset.id ? preset : state.currentPreset,
          }));
        },
        deletePreset: async (id) => {
          const { db } = await import('./db');
          await db.presets.delete(id);
          set((state) => ({
            presets: state.presets.filter((p) => p.id !== id),
            currentPreset:
              state.currentPreset?.id === id ? null : state.currentPreset,
          }));
        },

        // Settings actions
        setSettings: async (settings) => {
          const { db } = await import('./db');
          await db.settings.put(settings);
          set({ settings });
        },
        loadSettings: async () => {
          const { db } = await import('./db');
          const settings = await db.settings.get('default');
          set({ settings: settings || null });
        },

        // Word bank actions
        setWordBanks: (banks) => set({ wordBanks: banks }),
        addWordBank: async (bank) => {
          const { db } = await import('./db');
          await db.wordBanks.add(bank);
          set((state) => ({ wordBanks: [...state.wordBanks, bank] }));
        },
        updateWordBank: async (bank) => {
          const { db } = await import('./db');
          await db.wordBanks.update(bank.id, bank);
          set((state) => ({
            wordBanks: state.wordBanks.map((b) => (b.id === bank.id ? bank : b)),
          }));
        },
        deleteWordBank: async (id) => {
          const { db } = await import('./db');
          await db.wordBanks.delete(id);
          set((state) => ({
            wordBanks: state.wordBanks.filter((b) => b.id !== id),
          }));
        },

        // Batch operation actions
        setProcessing: (processing) => set({ isProcessing: processing }),
        setProgress: (progress, total) =>
          set({
            progress,
            totalFiles: total,
            processedFiles: progress,
          }),
        addError: (fileId, error) =>
          set((state) => ({
            errors: [...state.errors, { fileId, error }],
          })),
        clearErrors: () => set({ errors: [] }),

        // Audit actions
        setLastBatchId: (batchId) => set({ lastBatchId: batchId }),
        addAuditBatch: async (batch) => {
          const { db } = await import('./db');
          await db.audits.add(batch);
          set((state) => ({
            auditHistory: [batch, ...state.auditHistory],
            lastBatchId: batch.batchId,
          }));
        },
        loadAuditHistory: async () => {
          const { db } = await import('./db');
          const audits = await db.audits.orderBy('createdAt').reverse().toArray();
          set({ auditHistory: audits });
        },

        // Session actions
        addUsedName: (name) =>
          set((state) => {
            const newSet = new Set(state.sessionUsedNames);
            newSet.add(name);
            return { sessionUsedNames: newSet };
          }),
        clearSessionUsedNames: () => set({ sessionUsedNames: new Set() }),

        // UI actions
        toggleDarkMode: () =>
          set((state) => {
            const newMode = !state.isDarkMode;
            // Update DOM and localStorage
            if (newMode) {
              document.documentElement.classList.add('dark');
              localStorage.setItem('color-theme', 'dark');
            } else {
              document.documentElement.classList.remove('dark');
              localStorage.setItem('color-theme', 'light');
            }
            return { isDarkMode: newMode };
          }),
        setShowSettings: (show) => set({ showSettings: show }),
        setShowPresets: (show) => set({ showPresets: show }),
        setShowAudit: (show) => set({ showAudit: show }),
        };
      },
    { name: 'RenamelyStore' }
  )
);

