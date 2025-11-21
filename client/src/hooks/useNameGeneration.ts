/**
 * Custom hook for name generation
 * 
 * Provides a React-friendly interface for generating unique filenames
 * based on presets, word banks, and collision detection.
 */

import { useState, useCallback, useRef } from 'react';
import { generateName, registerName, releaseNames } from '../features/generation/engine';
import { db } from '../features/store/db';
import { logger } from '../lib/logger';
import { useErrorHandling } from './useErrorHandling';
import type { ImageFile } from '../features/store/slices';
import type { Preset, Theme, WordBank, Settings } from '../features/store/db';

export interface UseNameGenerationReturn {
  /** Whether name generation is in progress */
  isGenerating: boolean;
  /** Error state from name generation */
  error: Error | null;
  /** User-friendly error message */
  errorMessage: string | null;
  /** Generate names for images that don't have names */
  generateNamesForImages: (
    images: ImageFile[],
    theme: Theme | null,
    preset: Preset,
    wordBanks: WordBank[],
    sessionUsedNames: Set<string>,
    settings: Settings | null,
    onProgress?: (processed: number, total: number) => void
  ) => Promise<ImageFile[]>;
  /** Regenerate names for unlocked images */
  regenerateNamesForUnlocked: (
    images: ImageFile[],
    theme: Theme | null,
    preset: Preset,
    wordBanks: WordBank[],
    sessionUsedNames: Set<string>,
    settings: Settings | null,
    addUsedName: (name: string) => void,
    onProgress?: (processed: number, total: number) => void
  ) => Promise<ImageFile[]>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Hook for name generation operations
 * 
 * @returns Name generation state and operations
 * 
 * @example
 * ```typescript
 * const {
 *   isGenerating,
 *   generateNamesForImages,
 *   errorMessage
 * } = useNameGeneration();
 * 
 * const handleGenerate = async () => {
 *   const updated = await generateNamesForImages(
 *     images,
 *     currentTheme,
 *     currentPreset,
 *     wordBanks,
 *     sessionUsedNames,
 *     settings
 *   );
 *   setImages(updated);
 * };
 * ```
 */
export function useNameGeneration(): UseNameGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const { error, errorMessage, handleError, clearError } = useErrorHandling();
  const isGeneratingRef = useRef(false);

  /**
   * Load and filter word banks by theme
   */
  const loadWordBanksForTheme = useCallback(
    async (theme: Theme | null, existingWordBanks: WordBank[]): Promise<WordBank[]> => {
      let allWordBanks =
        existingWordBanks.length > 0 ? existingWordBanks : await db.wordBanks.toArray();

      // Filter by selected theme
      if (theme) {
        const beforeFilter = allWordBanks.length;
        allWordBanks = allWordBanks.filter((b) => b.themeId && b.themeId === theme.id);
        logger.info(`Filtered word banks for theme "${theme.id}"`, {
          before: beforeFilter,
          after: allWordBanks.length,
          themeId: theme.id,
        });

        // Verify all word banks belong to the selected theme
        const wrongThemeBanks = allWordBanks.filter((b) => b.themeId !== theme.id);
        if (wrongThemeBanks.length > 0) {
          logger.error(`Found ${wrongThemeBanks.length} word banks with wrong theme`, {
            wrongBanks: wrongThemeBanks.map((b) => `${b.id} (theme: ${b.themeId})`),
          });
        }
      } else {
        // Even if no theme selected, exclude word banks without themeId
        allWordBanks = allWordBanks.filter((b) => b.themeId);
      }

      if (allWordBanks.length === 0) {
        logger.warn('No word banks available for the selected theme', {
          themeId: theme?.id,
        });
      }

      return allWordBanks;
    },
    []
  );

  const generateNamesForImages = useCallback(
    async (
      images: ImageFile[],
      theme: Theme | null,
      preset: Preset,
      wordBanks: WordBank[],
      sessionUsedNames: Set<string>,
      settings: Settings | null,
      onProgress?: (processed: number, total: number) => void
    ): Promise<ImageFile[]> => {
      // Prevent concurrent runs
      if (isGeneratingRef.current) {
        logger.warn('Name generation already in progress, skipping');
        return images;
      }

      if (!theme || !preset || images.length === 0) {
        return images;
      }

      // Check if any images need names
      const imagesNeedingNames = images.filter(
        (img) => !img.suggestedName || !img.currentName
      );
      if (imagesNeedingNames.length === 0) {
        return images; // All images already have names
      }

      setIsGenerating(true);
      isGeneratingRef.current = true;
      clearError();

      try {
        // Load word banks filtered by selected theme
        const allWordBanks = await loadWordBanksForTheme(theme, wordBanks);

        if (allWordBanks.length === 0) {
          throw new Error('No word banks available for the selected theme');
        }

        const maxLength = settings?.maxFilenameLength || 255;
        const updatedImages: ImageFile[] = [];
        const currentUsedNames = new Set(sessionUsedNames);
        const currentUsedAdjectives = new Set<string>();
        const currentUsedNouns = new Set<string>();

        // Generate names sequentially to ensure uniqueness
        for (let i = 0; i < images.length; i++) {
          const image = images[i];

          // Skip if image already has a name
          if (image.suggestedName && image.currentName) {
            updatedImages.push(image);
            onProgress?.(i + 1, images.length);
            continue;
          }

          try {
            // Generate suggested name
            const generated = await generateName({
              preset,
              wordBanks: allWordBanks,
              usedNames: currentUsedNames,
              usedAdjectives: currentUsedAdjectives,
              usedNouns: currentUsedNouns,
              extension: image.extension,
              maxLength,
            });

            // Final safety check: verify the name is still unique
            const fullSlug = `${generated.slug}${image.extension}`;
            if (currentUsedNames.has(fullSlug)) {
              logger.warn(`Name collision detected for ${fullSlug}, regenerating...`, {
                slug: fullSlug,
              });
              // Regenerate with updated sets
              const regenerated = await generateName({
                preset,
                wordBanks: allWordBanks,
                usedNames: currentUsedNames,
                usedAdjectives: currentUsedAdjectives,
                usedNouns: currentUsedNouns,
                extension: image.extension,
                maxLength,
              });
              const regeneratedSlug = `${regenerated.slug}${image.extension}`;
              currentUsedNames.add(regeneratedSlug);
              await registerName(
                regenerated.name,
                preset.id,
                settings?.locale,
                image.extension
              );
              updatedImages.push({
                ...image,
                suggestedName: regenerated.name,
                currentName: regenerated.name,
              });
            } else {
              // Register name in persistent ledger
              currentUsedNames.add(fullSlug);
              await registerName(generated.name, preset.id, settings?.locale, image.extension);

              updatedImages.push({
                ...image,
                suggestedName: generated.name,
                currentName: generated.name,
              });
            }

            onProgress?.(i + 1, images.length);
          } catch (err: unknown) {
            logger.error(
              'Error generating name for image',
              err instanceof Error ? err : new Error(String(err)),
              { imageId: image.id }
            );
            // Return original image if generation fails
            updatedImages.push(image);
            onProgress?.(i + 1, images.length);
          }
        }

        // Ensure we have the same number of images
        if (updatedImages.length === images.length) {
          return updatedImages;
        } else {
          logger.warn(
            `Image count mismatch: expected ${images.length}, got ${updatedImages.length}`,
            { expected: images.length, actual: updatedImages.length }
          );
          return images; // Return original images if count is wrong
        }
      } catch (err: unknown) {
        handleError(err, { operation: 'generateNamesForImages' });
        return images; // Return original images on error
      } finally {
        setIsGenerating(false);
        isGeneratingRef.current = false;
      }
    },
    [loadWordBanksForTheme, handleError, clearError]
  );

  const regenerateNamesForUnlocked = useCallback(
    async (
      images: ImageFile[],
      theme: Theme | null,
      preset: Preset,
      wordBanks: WordBank[],
      sessionUsedNames: Set<string>,
      settings: Settings | null,
      addUsedName: (name: string) => void,
      onProgress?: (processed: number, total: number) => void
    ): Promise<ImageFile[]> => {
      if (!theme || !preset || images.length === 0) {
        return images;
      }

      setIsGenerating(true);
      clearError();

      try {
        // Load word banks filtered by selected theme
        const allWordBanks = await loadWordBanksForTheme(theme, wordBanks);

        if (allWordBanks.length === 0) {
          throw new Error('No word banks available for the selected theme');
        }

        const maxLength = settings?.maxFilenameLength || 255;

        // Release old names from ledger for unlocked images
        const oldSlugs: string[] = [];
        images.forEach((image) => {
          if (!image.locked && image.currentName) {
            const slug = image.currentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            oldSlugs.push(`${slug}${image.extension}`);
          }
        });
        if (oldSlugs.length > 0) {
          await releaseNames(oldSlugs);
        }

        // Generate new names for unlocked images only
        const updatedImages: ImageFile[] = [];
        const currentUsedNames = new Set(sessionUsedNames);
        const currentUsedAdjectives = new Set<string>();
        const currentUsedNouns = new Set<string>();

        let processed = 0;
        for (const image of images) {
          // Skip locked images
          if (image.locked) {
            updatedImages.push(image);
            processed++;
            onProgress?.(processed, images.length);
            continue;
          }

          try {
            // Generate new suggested name
            const generated = await generateName({
              preset,
              wordBanks: allWordBanks,
              usedNames: currentUsedNames,
              usedAdjectives: currentUsedAdjectives,
              usedNouns: currentUsedNouns,
              extension: image.extension,
              maxLength,
            });

            // Final safety check: verify the name is still unique
            const fullSlug = `${generated.slug}${image.extension}`;
            if (currentUsedNames.has(fullSlug)) {
              logger.warn(`Name collision detected for ${fullSlug}, regenerating...`, {
                slug: fullSlug,
              });
              // Regenerate with updated sets
              const regenerated = await generateName({
                preset,
                wordBanks: allWordBanks,
                usedNames: currentUsedNames,
                usedAdjectives: currentUsedAdjectives,
                usedNouns: currentUsedNouns,
                extension: image.extension,
                maxLength,
              });
              const regeneratedSlug = `${regenerated.slug}${image.extension}`;
              currentUsedNames.add(regeneratedSlug);
              addUsedName(regeneratedSlug);
              await registerName(
                regenerated.name,
                preset.id,
                settings?.locale,
                image.extension
              );
              updatedImages.push({
                ...image,
                suggestedName: regenerated.name,
                currentName: regenerated.name,
              });
            } else {
              // Register new name in both session and persistent ledger
              currentUsedNames.add(fullSlug);
              addUsedName(fullSlug);
              await registerName(generated.name, preset.id, settings?.locale, image.extension);

              updatedImages.push({
                ...image,
                suggestedName: generated.name,
                currentName: generated.name,
              });
            }

            processed++;
            onProgress?.(processed, images.length);
          } catch (err: unknown) {
            logger.error(
              'Error regenerating name for image',
              err instanceof Error ? err : new Error(String(err)),
              { imageId: image.id }
            );
            // Return original image if generation fails
            updatedImages.push(image);
            processed++;
            onProgress?.(processed, images.length);
          }
        }

        // Update images
        if (updatedImages.length === images.length) {
          return updatedImages;
        } else {
          return images; // Return original images if count is wrong
        }
      } catch (err: unknown) {
        handleError(err, { operation: 'regenerateNamesForUnlocked' });
        return images; // Return original images on error
      } finally {
        setIsGenerating(false);
      }
    },
    [loadWordBanksForTheme, handleError, clearError]
  );

  return {
    isGenerating,
    error,
    errorMessage,
    generateNamesForImages,
    regenerateNamesForUnlocked,
    clearError,
  };
}

