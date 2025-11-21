/**
 * Custom hook for template/preset management
 * 
 * Provides a React-friendly interface for CRUD operations on presets
 */

import { useState, useCallback } from 'react';
import { useAppStore } from '../features/store/slices';
import { useErrorHandling } from './useErrorHandling';
import type { Preset } from '../features/store/db';

export interface UseTemplateManagementReturn {
  /** Whether an operation is in progress */
  isProcessing: boolean;
  /** Error state */
  error: Error | null;
  /** User-friendly error message */
  errorMessage: string | null;
  /** Create a new preset */
  createPreset: (preset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Preset | null>;
  /** Update an existing preset */
  updatePreset: (preset: Preset) => Promise<void>;
  /** Delete a preset */
  deletePreset: (id: string) => Promise<void>;
  /** Load all presets */
  loadPresets: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Hook for template/preset management
 * 
 * @returns Template management operations
 * 
 * @example
 * ```typescript
 * const {
 *   createPreset,
 *   updatePreset,
 *   deletePreset,
 *   isProcessing
 * } = useTemplateManagement();
 * 
 * const handleCreate = async () => {
 *   const preset = await createPreset({
 *     name: 'My Preset',
 *     template: '{adjective}-{noun}',
 *     // ... other fields
 *   });
 * };
 * ```
 */
export function useTemplateManagement(): UseTemplateManagementReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const { error, errorMessage, handleError, clearError } = useErrorHandling();
  const { addPreset, updatePreset, deletePreset, setPresets } = useAppStore();

  const createPreset = useCallback(
    async (presetData: Omit<Preset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Preset | null> => {
      setIsProcessing(true);
      clearError();

      try {
        const now = new Date().toISOString();
        const preset: Preset = {
          ...presetData,
          id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        };

        await addPreset(preset);
        return preset;
      } catch (err) {
        handleError(err, { operation: 'createPreset' });
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [addPreset, handleError, clearError]
  );

  const updatePresetHandler = useCallback(
    async (preset: Preset): Promise<void> => {
      setIsProcessing(true);
      clearError();

      try {
        const updatedPreset: Preset = {
          ...preset,
          updatedAt: new Date().toISOString(),
        };
        await updatePreset(updatedPreset);
      } catch (err) {
        handleError(err, { operation: 'updatePreset', presetId: preset.id });
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [updatePreset, handleError, clearError]
  );

  const deletePresetHandler = useCallback(
    async (id: string): Promise<void> => {
      setIsProcessing(true);
      clearError();

      try {
        await deletePreset(id);
      } catch (err) {
        handleError(err, { operation: 'deletePreset', presetId: id });
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [deletePreset, handleError, clearError]
  );

  const loadPresets = useCallback(async (): Promise<void> => {
    setIsProcessing(true);
    clearError();

    try {
      const { db } = await import('../features/store/db');
      const presets = await db.presets.orderBy('createdAt').reverse().toArray();
      setPresets(presets);
    } catch (err) {
      handleError(err, { operation: 'loadPresets' });
    } finally {
      setIsProcessing(false);
    }
  }, [setPresets, handleError, clearError]);

  return {
    isProcessing,
    error,
    errorMessage,
    createPreset,
    updatePreset: updatePresetHandler,
    deletePreset: deletePresetHandler,
    loadPresets,
    clearError,
  };
}

