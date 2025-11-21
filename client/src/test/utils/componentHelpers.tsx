/**
 * Helper functions for component testing
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAppStore } from '../../features/store/slices';

/**
 * Custom render function that includes providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Reset the Zustand store to initial state
 */
export function resetStore() {
  const store = useAppStore.getState();
  // Reset to initial state
  store.setImages([]);
  store.setSelectedDirectory(null);
  store.setCurrentTheme(null);
  store.setCurrentPreset(null);
  store.clearErrors();
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create a mock File object
 */
export function createMockFile(name: string, content: string | Blob = '', type = 'image/png'): File {
  if (typeof content === 'string') {
    return new File([content], name, { type });
  }
  return new File([content], name, { type });
}

/**
 * Create a mock FileList
 */
export function createMockFileList(files: File[]): FileList {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    ...files,
  } as FileList;

  files.forEach((file, index) => {
    fileList[index] = file;
  });

  return fileList;
}

