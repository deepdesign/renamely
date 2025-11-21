/**
 * Unit tests for Zustand store operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../slices';
import { createMockDB, resetMockDB } from '../../../test/mocks/indexedDB';
import { createTestPreset, createTestTheme, createTestWordBank, createTestSettings, createTestImageFile } from '../../../test/utils/testData';
import type { Preset, Theme, WordBank, Settings, AuditBatch } from '../db';
import type { ImageFile } from '../slices';

// Create a shared mock DB instance
const mockDB = createMockDB();

// Mock the db module
vi.mock('../db', async () => {
  return {
    db: mockDB,
    initializeDB: vi.fn().mockResolvedValue(undefined),
  };
});

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
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
      isDarkMode: false,
      showSettings: false,
      showPresets: false,
      showAudit: false,
    });
    
    // Reset mock DB
    resetMockDB();
    
    // Reset localStorage
    localStorage.clear();
  });

  describe('File Operations', () => {
    it('should set selected directory', () => {
      const mockDir = {} as FileSystemDirectoryHandle;
      useAppStore.getState().setSelectedDirectory(mockDir);
      expect(useAppStore.getState().selectedDirectory).toBe(mockDir);
    });

    it('should set images', () => {
      const images = [createTestImageFile({ id: 'img1' }), createTestImageFile({ id: 'img2' })];
      useAppStore.getState().setImages(images);
      expect(useAppStore.getState().images).toEqual(images);
    });

    it('should update image', () => {
      const image = createTestImageFile({ id: 'img1', currentName: 'old-name' });
      useAppStore.getState().setImages([image]);
      useAppStore.getState().updateImage('img1', { currentName: 'new-name' });
      expect(useAppStore.getState().images[0].currentName).toBe('new-name');
    });

    it('should update image name', () => {
      const image = createTestImageFile({ id: 'img1', currentName: 'old-name' });
      useAppStore.getState().setImages([image]);
      useAppStore.getState().updateImageName('img1', 'new-name');
      expect(useAppStore.getState().images[0].currentName).toBe('new-name');
    });

    it('should toggle image selection', () => {
      const image = createTestImageFile({ id: 'img1' });
      useAppStore.getState().setImages([image]);
      
      // Select
      useAppStore.getState().toggleImageSelection('img1');
      expect(useAppStore.getState().selectedImageIds.has('img1')).toBe(true);
      
      // Deselect
      useAppStore.getState().toggleImageSelection('img1');
      expect(useAppStore.getState().selectedImageIds.has('img1')).toBe(false);
    });

    it('should select all images', () => {
      const images = [
        createTestImageFile({ id: 'img1' }),
        createTestImageFile({ id: 'img2' }),
        createTestImageFile({ id: 'img3' }),
      ];
      useAppStore.getState().setImages(images);
      useAppStore.getState().selectAllImages();
      expect(useAppStore.getState().selectedImageIds.size).toBe(3);
      expect(useAppStore.getState().selectedImageIds.has('img1')).toBe(true);
      expect(useAppStore.getState().selectedImageIds.has('img2')).toBe(true);
      expect(useAppStore.getState().selectedImageIds.has('img3')).toBe(true);
    });

    it('should deselect all images', () => {
      const images = [createTestImageFile({ id: 'img1' })];
      useAppStore.getState().setImages(images);
      useAppStore.getState().selectAllImages();
      useAppStore.getState().deselectAllImages();
      expect(useAppStore.getState().selectedImageIds.size).toBe(0);
    });

    it('should lock image', () => {
      const image = createTestImageFile({ id: 'img1', locked: false });
      useAppStore.getState().setImages([image]);
      useAppStore.getState().lockImage('img1');
      expect(useAppStore.getState().images[0].locked).toBe(true);
    });

    it('should unlock image', () => {
      const image = createTestImageFile({ id: 'img1', locked: true });
      useAppStore.getState().setImages([image]);
      useAppStore.getState().unlockImage('img1');
      expect(useAppStore.getState().images[0].locked).toBe(false);
    });
  });

  describe('Theme Operations', () => {
    it('should set current theme', () => {
      const theme = createTestTheme({ id: 'theme1' });
      useAppStore.getState().setCurrentTheme(theme);
      expect(useAppStore.getState().currentTheme).toBe(theme);
    });

    it('should set themes', () => {
      const themes = [createTestTheme({ id: 'theme1' }), createTestTheme({ id: 'theme2' })];
      useAppStore.getState().setThemes(themes);
      expect(useAppStore.getState().themes).toEqual(themes);
    });

    it('should add theme and persist to IndexedDB', async () => {
      const theme = createTestTheme({ id: 'theme1' });
      await useAppStore.getState().addTheme(theme);
      
      expect(useAppStore.getState().themes).toContainEqual(theme);
      // Verify IndexedDB persistence
      const savedTheme = await mockDB.themes.get('theme1');
      expect(savedTheme).toBeDefined();
    });

    it('should update theme and persist to IndexedDB', async () => {
      const theme = createTestTheme({ id: 'theme1', name: 'Original Name' });
      await useAppStore.getState().addTheme(theme);
      
      const updatedTheme = { ...theme, name: 'Updated Name' };
      await useAppStore.getState().updateTheme(updatedTheme);
      
      expect(useAppStore.getState().themes[0].name).toBe('Updated Name');
      // Verify IndexedDB persistence
      const savedTheme = await mockDB.themes.get('theme1');
      expect(savedTheme?.name).toBe('Updated Name');
    });

    it('should update current theme when updating active theme', async () => {
      const theme = createTestTheme({ id: 'theme1' });
      await useAppStore.getState().addTheme(theme);
      useAppStore.getState().setCurrentTheme(theme);
      
      const updatedTheme = { ...theme, name: 'Updated Name' };
      await useAppStore.getState().updateTheme(updatedTheme);
      
      expect(useAppStore.getState().currentTheme?.name).toBe('Updated Name');
    });

    it('should delete theme and persist to IndexedDB', async () => {
      const theme = createTestTheme({ id: 'theme1' });
      await useAppStore.getState().addTheme(theme);
      useAppStore.getState().setCurrentTheme(theme);
      
      await useAppStore.getState().deleteTheme('theme1');
      
      expect(useAppStore.getState().themes.length).toBe(0);
      expect(useAppStore.getState().currentTheme).toBeNull();
      // Verify IndexedDB persistence
      const savedTheme = await mockDB.themes.get('theme1');
      expect(savedTheme).toBeUndefined();
    });
  });

  describe('Preset Operations', () => {
    it('should set current preset', () => {
      const preset = createTestPreset({ id: 'preset1' });
      useAppStore.getState().setCurrentPreset(preset);
      expect(useAppStore.getState().currentPreset).toBe(preset);
    });

    it('should set presets', () => {
      const presets = [createTestPreset({ id: 'preset1' }), createTestPreset({ id: 'preset2' })];
      useAppStore.getState().setPresets(presets);
      expect(useAppStore.getState().presets).toEqual(presets);
    });

    it('should add preset and persist to IndexedDB', async () => {
      const preset = createTestPreset({ id: 'preset1' });
      await useAppStore.getState().addPreset(preset);
      
      expect(useAppStore.getState().presets).toContainEqual(preset);
      // Verify IndexedDB persistence
      const savedPreset = await mockDB.presets.get('preset1');
      expect(savedPreset).toBeDefined();
    });

    it('should update preset and persist to IndexedDB', async () => {
      const preset = createTestPreset({ id: 'preset1', name: 'Original Name' });
      await useAppStore.getState().addPreset(preset);
      
      const updatedPreset = { ...preset, name: 'Updated Name' };
      await useAppStore.getState().updatePreset(updatedPreset);
      
      expect(useAppStore.getState().presets[0].name).toBe('Updated Name');
      // Verify IndexedDB persistence
      const savedPreset = await mockDB.presets.get('preset1');
      expect(savedPreset?.name).toBe('Updated Name');
    });

    it('should update current preset when updating active preset', async () => {
      const preset = createTestPreset({ id: 'preset1' });
      await useAppStore.getState().addPreset(preset);
      useAppStore.getState().setCurrentPreset(preset);
      
      const updatedPreset = { ...preset, name: 'Updated Name' };
      await useAppStore.getState().updatePreset(updatedPreset);
      
      expect(useAppStore.getState().currentPreset?.name).toBe('Updated Name');
    });

    it('should delete preset and persist to IndexedDB', async () => {
      const preset = createTestPreset({ id: 'preset1' });
      await useAppStore.getState().addPreset(preset);
      useAppStore.getState().setCurrentPreset(preset);
      
      await useAppStore.getState().deletePreset('preset1');
      
      expect(useAppStore.getState().presets.length).toBe(0);
      expect(useAppStore.getState().currentPreset).toBeNull();
      // Verify IndexedDB persistence
      const savedPreset = await mockDB.presets.get('preset1');
      expect(savedPreset).toBeUndefined();
    });
  });

  describe('Settings Operations', () => {
    it('should set settings and persist to IndexedDB', async () => {
      const settings = createTestSettings({ id: 'default' });
      await useAppStore.getState().setSettings(settings);
      
      expect(useAppStore.getState().settings).toEqual(settings);
      // Verify IndexedDB persistence
      const savedSettings = await mockDB.settings.get('default');
      expect(savedSettings).toBeDefined();
    });

    it('should load settings from IndexedDB', async () => {
      const settings = createTestSettings({ id: 'default' });
      await mockDB.settings.put(settings);
      
      await useAppStore.getState().loadSettings();
      
      expect(useAppStore.getState().settings).toEqual(settings);
    });

    it('should handle missing settings gracefully', async () => {
      await useAppStore.getState().loadSettings();
      expect(useAppStore.getState().settings).toBeNull();
    });
  });

  describe('Word Bank Operations', () => {
    it('should set word banks', () => {
      const banks = [
        createTestWordBank({ id: 'bank1' }),
        createTestWordBank({ id: 'bank2' }),
      ];
      useAppStore.getState().setWordBanks(banks);
      expect(useAppStore.getState().wordBanks).toEqual(banks);
    });

    it('should add word bank and persist to IndexedDB', async () => {
      const bank = createTestWordBank({ id: 'bank1' });
      await useAppStore.getState().addWordBank(bank);
      
      expect(useAppStore.getState().wordBanks).toContainEqual(bank);
      // Verify IndexedDB persistence
      const savedBank = await mockDB.wordBanks.get('bank1');
      expect(savedBank).toBeDefined();
    });

    it('should update word bank and persist to IndexedDB', async () => {
      const bank = createTestWordBank({ id: 'bank1', name: 'Original Name' });
      await useAppStore.getState().addWordBank(bank);
      
      const updatedBank = { ...bank, name: 'Updated Name' };
      await useAppStore.getState().updateWordBank(updatedBank);
      
      expect(useAppStore.getState().wordBanks[0].name).toBe('Updated Name');
      // Verify IndexedDB persistence
      const savedBank = await mockDB.wordBanks.get('bank1');
      expect(savedBank?.name).toBe('Updated Name');
    });

    it('should delete word bank and persist to IndexedDB', async () => {
      const bank = createTestWordBank({ id: 'bank1' });
      await useAppStore.getState().addWordBank(bank);
      
      await useAppStore.getState().deleteWordBank('bank1');
      
      expect(useAppStore.getState().wordBanks.length).toBe(0);
      // Verify IndexedDB persistence
      const savedBank = await mockDB.wordBanks.get('bank1');
      expect(savedBank).toBeUndefined();
    });
  });

  describe('Batch Operations', () => {
    it('should set processing state', () => {
      useAppStore.getState().setProcessing(true);
      expect(useAppStore.getState().isProcessing).toBe(true);
      
      useAppStore.getState().setProcessing(false);
      expect(useAppStore.getState().isProcessing).toBe(false);
    });

    it('should set progress', () => {
      useAppStore.getState().setProgress(5, 10);
      expect(useAppStore.getState().progress).toBe(5);
      expect(useAppStore.getState().totalFiles).toBe(10);
      expect(useAppStore.getState().processedFiles).toBe(5);
    });

    it('should add error', () => {
      useAppStore.getState().addError('file1', 'Error message');
      expect(useAppStore.getState().errors).toHaveLength(1);
      expect(useAppStore.getState().errors[0]).toEqual({ fileId: 'file1', error: 'Error message' });
    });

    it('should clear errors', () => {
      useAppStore.getState().addError('file1', 'Error 1');
      useAppStore.getState().addError('file2', 'Error 2');
      useAppStore.getState().clearErrors();
      expect(useAppStore.getState().errors).toHaveLength(0);
    });
  });

  describe('Audit Operations', () => {
    it('should set last batch ID', () => {
      useAppStore.getState().setLastBatchId('batch1');
      expect(useAppStore.getState().lastBatchId).toBe('batch1');
    });

    it('should add audit batch and persist to IndexedDB', async () => {
      const batch: AuditBatch = {
        id: 'audit1',
        batchId: 'batch1',
        entries: [],
        createdAt: new Date().toISOString(),
        status: 'completed',
      };
      
      await useAppStore.getState().addAuditBatch(batch);
      
      expect(useAppStore.getState().auditHistory).toContainEqual(batch);
      expect(useAppStore.getState().lastBatchId).toBe('batch1');
      // Verify IndexedDB persistence
      const savedBatch = await mockDB.audits.get('audit1');
      expect(savedBatch).toBeDefined();
    });

    it('should load audit history from IndexedDB', async () => {
      const batch1: AuditBatch = {
        id: 'audit1',
        batchId: 'batch1',
        entries: [],
        createdAt: new Date(Date.now() - 1000).toISOString(),
        status: 'completed',
      };
      const batch2: AuditBatch = {
        id: 'audit2',
        batchId: 'batch2',
        entries: [],
        createdAt: new Date().toISOString(),
        status: 'completed',
      };
      
      await mockDB.audits.add(batch1);
      await mockDB.audits.add(batch2);
      
      await useAppStore.getState().loadAuditHistory();
      
      // Should be in reverse chronological order (newest first)
      expect(useAppStore.getState().auditHistory.length).toBe(2);
      expect(useAppStore.getState().auditHistory[0].id).toBe('audit2');
      expect(useAppStore.getState().auditHistory[1].id).toBe('audit1');
    });
  });

  describe('Session Operations', () => {
    it('should add used name', () => {
      useAppStore.getState().addUsedName('test-name');
      expect(useAppStore.getState().sessionUsedNames.has('test-name')).toBe(true);
    });

    it('should clear session used names', () => {
      useAppStore.getState().addUsedName('name1');
      useAppStore.getState().addUsedName('name2');
      useAppStore.getState().clearSessionUsedNames();
      expect(useAppStore.getState().sessionUsedNames.size).toBe(0);
    });
  });

  describe('UI Operations', () => {
    beforeEach(() => {
      // Mock localStorage
      vi.spyOn(Storage.prototype, 'setItem');
      vi.spyOn(Storage.prototype, 'getItem');
      // Mock document.documentElement.classList
      document.documentElement.classList.remove = vi.fn();
      document.documentElement.classList.add = vi.fn();
    });

    it('should toggle dark mode', () => {
      const initialState = useAppStore.getState().isDarkMode;
      useAppStore.getState().toggleDarkMode();
      expect(useAppStore.getState().isDarkMode).toBe(!initialState);
    });

    it('should update localStorage when toggling dark mode', () => {
      useAppStore.getState().toggleDarkMode();
      expect(localStorage.setItem).toHaveBeenCalledWith('color-theme', expect.any(String));
    });

    it('should set show settings', () => {
      useAppStore.getState().setShowSettings(true);
      expect(useAppStore.getState().showSettings).toBe(true);
      
      useAppStore.getState().setShowSettings(false);
      expect(useAppStore.getState().showSettings).toBe(false);
    });

    it('should set show presets', () => {
      useAppStore.getState().setShowPresets(true);
      expect(useAppStore.getState().showPresets).toBe(true);
      
      useAppStore.getState().setShowPresets(false);
      expect(useAppStore.getState().showPresets).toBe(false);
    });

    it('should set show audit', () => {
      useAppStore.getState().setShowAudit(true);
      expect(useAppStore.getState().showAudit).toBe(true);
      
      useAppStore.getState().setShowAudit(false);
      expect(useAppStore.getState().showAudit).toBe(false);
    });
  });

  describe('State Updates and Side Effects', () => {
    it('should maintain immutability when updating images', () => {
      const image1 = createTestImageFile({ id: 'img1' });
      const image2 = createTestImageFile({ id: 'img2' });
      useAppStore.getState().setImages([image1, image2]);
      
      const originalImages = useAppStore.getState().images;
      useAppStore.getState().updateImage('img1', { currentName: 'new-name' });
      
      // Original array should not be mutated
      expect(originalImages[0].currentName).not.toBe('new-name');
      expect(useAppStore.getState().images[0].currentName).toBe('new-name');
    });

    it('should maintain immutability when updating selected image IDs', () => {
      const image = createTestImageFile({ id: 'img1' });
      useAppStore.getState().setImages([image]);
      useAppStore.getState().selectAllImages();
      
      const originalSet = useAppStore.getState().selectedImageIds;
      useAppStore.getState().deselectAllImages();
      
      // Original Set should not be mutated
      expect(originalSet.size).toBe(1);
      expect(useAppStore.getState().selectedImageIds.size).toBe(0);
    });
  });
});

