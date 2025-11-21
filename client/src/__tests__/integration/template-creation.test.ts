/**
 * Integration tests for template creation and product submission
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../../features/store/slices';
import { createMockDB, resetMockDB } from '../../test/mocks/indexedDB';
import { createTestPreset, createTestTheme, createTestWordBank } from '../../test/utils/testData';

// Mock the db module
vi.mock('../../features/store/db', async () => {
  const mockDB = createMockDB();
  return {
    db: mockDB,
    initializeDB: vi.fn().mockResolvedValue(undefined),
  };
});

describe('Template Creation Integration', () => {
  beforeEach(() => {
    resetMockDB();
    useAppStore.setState({
      themes: [],
      presets: [],
      wordBanks: [],
      currentTheme: null,
      currentPreset: null,
    });
  });

  it('should create and save a preset', async () => {
    const preset = createTestPreset({ id: 'new-preset', name: 'My Custom Preset' });

    await useAppStore.getState().addPreset(preset);
    expect(useAppStore.getState().presets).toContainEqual(preset);

    // Verify persistence
    const { db } = await import('../../features/store/db');
    const saved = await db.presets.get('new-preset');
    expect(saved).toBeDefined();
    expect(saved?.name).toBe('My Custom Preset');
  });

  it('should update a preset', async () => {
    const preset = createTestPreset({ id: 'preset-1', name: 'Original Name' });
    await useAppStore.getState().addPreset(preset);

    const updated = { ...preset, name: 'Updated Name' };
    await useAppStore.getState().updatePreset(updated);

    expect(useAppStore.getState().presets[0].name).toBe('Updated Name');

    // Verify persistence
    const { db } = await import('../../features/store/db');
    const saved = await db.presets.get('preset-1');
    expect(saved?.name).toBe('Updated Name');
  });

  it('should delete a preset', async () => {
    const preset = createTestPreset({ id: 'preset-1' });
    await useAppStore.getState().addPreset(preset);
    useAppStore.getState().setCurrentPreset(preset);

    await useAppStore.getState().deletePreset('preset-1');

    expect(useAppStore.getState().presets).toHaveLength(0);
    expect(useAppStore.getState().currentPreset).toBeNull();

    // Verify deletion
    const { db } = await import('../../features/store/db');
    const saved = await db.presets.get('preset-1');
    expect(saved).toBeUndefined();
  });

  it('should create preset with theme and word banks', async () => {
    const theme = createTestTheme({ id: 'theme-1' });
    const wordBank1 = createTestWordBank({ id: 'wb1', themeId: 'theme-1', type: 'adjective' });
    const wordBank2 = createTestWordBank({ id: 'wb2', themeId: 'theme-1', type: 'noun' });

    await useAppStore.getState().addTheme(theme);
    await useAppStore.getState().addWordBank(wordBank1);
    await useAppStore.getState().addWordBank(wordBank2);

    const preset = createTestPreset({
      id: 'preset-1',
      wordBankIds: {
        adjectives: ['wb1'],
        nouns: ['wb2'],
      },
    });

    await useAppStore.getState().addPreset(preset);
    useAppStore.getState().setCurrentTheme(theme);
    useAppStore.getState().setCurrentPreset(preset);

    expect(useAppStore.getState().currentTheme).toBe(theme);
    expect(useAppStore.getState().currentPreset).toBe(preset);
    expect(useAppStore.getState().wordBanks).toHaveLength(2);
  });
});

