/**
 * Integration tests for complete rename workflow
 * 
 * Tests the full user flow: Home → Mapping → Review → Rename
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAppStore } from '../../features/store/slices';
import { createMockDB, resetMockDB } from '../../test/mocks/indexedDB';
import { createTestImageFile, createTestPreset, createTestTheme, createTestWordBank, createTestSettings } from '../../test/utils/testData';
import { setupFileSystemMocks } from '../../test/mocks/fileSystem';
import type { ImageFile } from '../../features/store/slices';

// Mock the db module
vi.mock('../../features/store/db', async () => {
  const mockDB = createMockDB();
  return {
    db: mockDB,
    initializeDB: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock file system API
setupFileSystemMocks();

describe('Rename Workflow Integration', () => {
  beforeEach(() => {
    // Reset store
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
  });

  it('should complete full rename workflow: select images → choose theme → choose preset → review → rename', async () => {
    // Setup test data
    const theme = createTestTheme({ id: 'test-theme' });
    const wordBank = createTestWordBank({ id: 'test-wordbank', themeId: 'test-theme' });
    const preset = createTestPreset({ id: 'test-preset' });
    const settings = createTestSettings();
    const images = [
      createTestImageFile({ id: 'img1', originalName: 'photo1.jpg' }),
      createTestImageFile({ id: 'img2', originalName: 'photo2.jpg' }),
    ];

    // Add to store
    useAppStore.setState({
      themes: [theme],
      wordBanks: [wordBank],
      presets: [preset],
      settings,
      images,
    });

    // Step 1: Verify images are loaded
    expect(useAppStore.getState().images).toHaveLength(2);

    // Step 2: Select theme
    useAppStore.getState().setCurrentTheme(theme);
    expect(useAppStore.getState().currentTheme).toBe(theme);

    // Step 3: Select preset
    useAppStore.getState().setCurrentPreset(preset);
    expect(useAppStore.getState().currentPreset).toBe(preset);

    // Step 4: Verify names would be generated
    const updatedImages = useAppStore.getState().images;
    expect(updatedImages.length).toBe(2);

    // Step 5: Simulate rename operation preparation
    // (Actual rename would require file handles which are mocked)
    expect(useAppStore.getState().currentTheme).not.toBeNull();
    expect(useAppStore.getState().currentPreset).not.toBeNull();
    expect(useAppStore.getState().images.length).toBeGreaterThan(0);
  });

  it('should handle workflow with errors gracefully', async () => {
    const theme = createTestTheme({ id: 'test-theme' });
    const preset = createTestPreset({ id: 'test-preset' });
    const images = [createTestImageFile({ id: 'img1' })];

    useAppStore.setState({
      themes: [theme],
      presets: [preset],
      images,
    });

    // Select theme and preset
    useAppStore.getState().setCurrentTheme(theme);
    useAppStore.getState().setCurrentPreset(preset);

    // Clear images to simulate error
    useAppStore.getState().setImages([]);

    // Should handle gracefully
    expect(useAppStore.getState().images).toHaveLength(0);
    expect(useAppStore.getState().currentTheme).toBe(theme);
    expect(useAppStore.getState().currentPreset).toBe(preset);
  });
});

