/**
 * Test data factories for creating test data
 */

import type { Preset, WordBank, Theme, Settings } from '../../features/store/db';
import type { ImageFile } from '../../features/store/slices';

/**
 * Create a test preset
 */
export function createTestPreset(overrides?: Partial<Preset>): Preset {
  return {
    id: 'test-preset-1',
    name: 'Test Preset',
    template: '{adjective}-{noun}',
    numAdjectives: 1,
    delimiter: '-',
    caseStyle: 'Title',
    prefix: '',
    suffix: '',
    includeDateStamp: false,
    useCounter: false,
    counterStart: 1,
    nsfwFilter: false,
    wordBankIds: {
      adjectives: ['test-adj-bank'],
      nouns: ['test-noun-bank'],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test word bank
 */
export function createTestWordBank(overrides?: Partial<WordBank>): WordBank {
  return {
    id: 'test-wordbank-1',
    name: 'Test Word Bank',
    type: 'adjective',
    locale: 'en',
    words: ['test', 'example', 'sample'],
    themeId: 'test-theme-1',
    ...overrides,
  };
}

/**
 * Create a test theme
 */
export function createTestTheme(overrides?: Partial<Theme>): Theme {
  return {
    id: 'test-theme-1',
    name: 'Test Theme',
    description: 'A test theme',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create test settings
 */
export function createTestSettings(overrides?: Partial<Settings>): Settings {
  return {
    id: 'default',
    theme: 'system',
    locale: 'en',
    maxFilenameLength: 255,
    stripDiacritics: false,
    asciiOnly: false,
    telemetryEnabled: false,
    highContrast: false,
    renameDestinationOption: 'subfolder',
    renameSubfolderName: 'renamed',
    renameSiblingFolderName: 'original',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a test image file
 */
export function createTestImageFile(overrides?: Partial<ImageFile>): ImageFile {
  const file = new File(['test'], 'test-image.png', { type: 'image/png' });
  return {
    id: 'test-image-1',
    file,
    originalName: 'test-image',
    suggestedName: 'test-image',
    currentName: 'test-image',
    extension: '.png',
    path: '/test/test-image.png',
    thumbnailUrl: 'blob:test-thumbnail',
    size: 1024,
    lastModified: Date.now(),
    locked: false,
    ...overrides,
  };
}

/**
 * Create multiple test image files
 */
export function createTestImageFiles(count: number, baseName = 'test-image'): ImageFile[] {
  return Array.from({ length: count }, (_, i) =>
    createTestImageFile({
      id: `${baseName}-${i}`,
      originalName: `${baseName}-${i}`,
      currentName: `${baseName}-${i}`,
      path: `/test/${baseName}-${i}.png`,
    })
  );
}

