/**
 * Test setup file
 * Runs before all tests
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock File System Access API
// Import mock implementations
import { setupFileSystemMocks } from './mocks/fileSystem';

// Setup file system mocks
setupFileSystemMocks();

// Mock IndexedDB (Dexie) - Note: Actual mocking would require more setup
// For now, tests should use the mock utilities from test/mocks/indexedDB.ts

