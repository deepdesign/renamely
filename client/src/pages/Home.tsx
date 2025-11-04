import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../features/store/slices';
import { FilePicker, type FilePickerRef } from '../components/FilePicker';
import { ImageGrid } from '../components/ImageGrid';
import Stepper from '../components/Stepper';
import { Button } from '../components/ui/Button';
import { ChevronRight, ChevronLeft, Loader2, Check, Plus, RotateCw, CheckCircle, AlertCircle, Settings, Info } from 'lucide-react';
import { initializeDB, db } from '../features/store/db';
import { loadDefaultWordBanks } from '../features/generation/wordBanks';
import { loadDefaultThemes, loadDefaultPresets } from '../features/generation/themes';
import { normalizeName, generateName, registerName, releaseNames } from '../features/generation/engine';
import { createDirectory, moveFile, renameFile, selectDirectory } from '../features/files/fs-api';
import type { Preset, WordBank, Theme, AuditEntry, AuditBatch } from '../features/store/db';

const STEPS = [
  { id: 1, name: 'Select images', description: 'Choose images to rename' },
  { id: 2, name: 'Select theme', description: 'Choose a theme for word banks' },
  { id: 3, name: 'Select template', description: 'Choose or create naming template' },
  { id: 4, name: 'Review & edit', description: 'Preview and adjust names' },
  { id: 5, name: 'Rename', description: 'Execute batch rename' },
];

// Map caseStyle for display (handles legacy 'kebab' and 'snake' values)
function getCaseStyleDisplay(caseStyle: string): string {
  if (caseStyle === 'kebab' || caseStyle === 'snake') {
    return 'lowercase';
  }
  const styleMap: Record<string, string> = {
    'Title': 'Title Case',
    'Sentence': 'Sentence case',
    'lower': 'lowercase',
    'UPPER': 'UPPERCASE',
  };
  return styleMap[caseStyle] || caseStyle;
}

// Get delimiter display (show space as 'space' for clarity)
function getDelimiterDisplay(delimiter: string): string {
  if (delimiter === ' ') {
    return 'space';
  }
  return delimiter;
}

// Extract pattern from template string (e.g., "{adjective}-{adjective}-{noun}" -> "Adjective-Adjective-Noun")
function getTemplatePattern(template: string): string {
  const partMap: Record<string, string> = {
    'adjective': 'Adjective',
    'noun': 'Noun',
    'prefix': 'Prefix',
    'suffix': 'Suffix',
    'date': 'Date',
    'counter': 'Counter',
  };
  
  // Extract all {placeholder} patterns from the template
  const placeholderRegex = /\{([^}]+)\}/g;
  const matches = template.matchAll(placeholderRegex);
  const patternParts: string[] = [];
  
  for (const match of matches) {
    const key = match[1].toLowerCase();
    if (key in partMap) {
      patternParts.push(partMap[key]);
    } else {
      // Handle unknown placeholders - capitalize first letter
      patternParts.push(key.charAt(0).toUpperCase() + key.slice(1));
    }
  }
  
  // If we couldn't parse it, return the template as-is
  if (patternParts.length === 0) {
    return template;
  }
  
  return patternParts.join('-');
}

// Generate example name for a theme (adjective-adjective-noun format)
function generateThemeExampleName(theme: Theme, wordBanks: WordBank[]): string {
  try {
    // Filter word banks by theme
    const themeWordBanks = wordBanks.filter(b => b.themeId === theme.id);
    
    const adjectives = themeWordBanks.filter(b => b.type === 'adjective');
    const nouns = themeWordBanks.filter(b => b.type === 'noun');

    if (adjectives.length === 0 || nouns.length === 0) {
      return 'example-name';
    }

    // Get all words from theme's word banks
    const adjectiveWords: string[] = [];
    const nounWords: string[] = [];

    for (const bank of adjectives) {
      adjectiveWords.push(...bank.words);
    }

    for (const bank of nouns) {
      nounWords.push(...bank.words);
    }

    if (adjectiveWords.length === 0 || nounWords.length === 0) {
      return 'example-name';
    }

    // Select words deterministically (using theme id as seed)
    const seed = theme.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let rngState = seed;
    const rng = () => {
      rngState = (rngState * 9301 + 49297) % 233280;
      return rngState / 233280;
    };

    // Select 2 adjectives and 1 noun
    const selectedAdjectives: string[] = [];
    for (let i = 0; i < 2; i++) {
      selectedAdjectives.push(adjectiveWords[Math.floor(rng() * adjectiveWords.length)]);
    }
    const selectedNoun = nounWords[Math.floor(rng() * nounWords.length)];

    // Build name: adjective-adjective-noun
    const parts = [...selectedAdjectives, selectedNoun];
    return parts.join('-').toLowerCase();
  } catch (err) {
    return 'example-name';
  }
}

// Generate example name for a preset
function generateExampleName(preset: Preset, wordBanks: WordBank[], currentTheme: Theme | null): string {
  try {
    // Filter word banks by selected theme if one is selected
    let filteredWordBanks = wordBanks;
    if (currentTheme) {
      filteredWordBanks = wordBanks.filter(b => b.themeId === currentTheme.id);
    }
    
    const adjectives = filteredWordBanks.filter((b) => b.type === 'adjective' && (!preset.nsfwFilter || !b.nsfw));
    const nouns = filteredWordBanks.filter((b) => b.type === 'noun' && (!preset.nsfwFilter || !b.nsfw));

    if (adjectives.length === 0 || nouns.length === 0) {
      return 'example-name';
    }

    // Get all words from selected banks
    const adjectiveWords: string[] = [];
    const nounWords: string[] = [];

    for (const bank of adjectives) {
      if (preset.wordBankIds.adjectives.includes(bank.id)) {
        adjectiveWords.push(...bank.words);
      }
    }

    for (const bank of nouns) {
      if (preset.wordBankIds.nouns.includes(bank.id)) {
        nounWords.push(...bank.words);
      }
    }

    if (adjectiveWords.length === 0 || nounWords.length === 0) {
      return 'example-name';
    }

    // Select words deterministically (using preset id as seed)
    const seed = preset.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let rngState = seed;
    const rng = () => {
      rngState = (rngState * 9301 + 49297) % 233280;
      return rngState / 233280;
    };

    const selectedAdjectives: string[] = [];
    for (let i = 0; i < preset.numAdjectives; i++) {
      selectedAdjectives.push(adjectiveWords[Math.floor(rng() * adjectiveWords.length)]);
    }
    const selectedNoun = nounWords[Math.floor(rng() * nounWords.length)];

    // Build base name
    let parts: string[] = [];
    if (preset.prefix) {
      parts.push(preset.prefix);
    }
    parts.push(...selectedAdjectives, selectedNoun);
    if (preset.suffix) {
      parts.push(preset.suffix);
    }

    let baseName = parts.join(preset.delimiter);

    // Add date stamp if enabled
    if (preset.includeDateStamp) {
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      baseName = `${baseName}${preset.delimiter}${dateStr}`;
    }

    // Add counter if enabled
    if (preset.useCounter) {
      baseName = `${baseName}${preset.delimiter}${preset.counterStart}`;
    }

    // Apply case style
    return normalizeName(baseName, preset.caseStyle);
    } catch (err) {
    return 'example-name';
  }
}

export default function Home() {
  const {
    currentTheme,
    setCurrentTheme,
    themes,
    setThemes,
    currentPreset,
    setCurrentPreset,
    presets,
    setPresets,
    images,
    setImages,
    loadSettings,
    wordBanks,
    setWordBanks,
    sessionUsedNames,
    addUsedName,
    settings,
    selectedDirectory,
    setSelectedDirectory,
    isProcessing,
    setProcessing,
    progress,
    totalFiles,
    setProgress,
    addError,
    clearErrors,
    addAuditBatch,
    setLastBatchId,
    errors,
  } = useAppStore();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize step from URL or default to 1
  const urlStep = searchParams.get('step');
  const initialStep = urlStep ? parseInt(urlStep, 10) : 1;
  const [currentStep, setCurrentStep] = useState(initialStep);
  
  // Update URL when step changes
  useEffect(() => {
    if (currentStep !== initialStep || urlStep !== String(currentStep)) {
      setSearchParams({ step: String(currentStep) }, { replace: true });
    }
  }, [currentStep]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const filePickerRef = useRef<FilePickerRef>(null);
  const [selectedImageCount, setSelectedImageCount] = useState(0);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [renameResult, setRenameResult] = useState<{ successCount: number; errorCount: number; batchId: string | null } | null>(null);
  const isGeneratingNamesRef = useRef(false);

  // Initialize database and load defaults
  useEffect(() => {
    async function init() {
      try {
        await initializeDB();
        await loadSettings();
        await loadDefaultThemes();
        await loadDefaultWordBanks();
        await loadDefaultPresets();
        
        // Load themes
        const allThemes = await db.themes.toArray();
        setThemes(allThemes);
        
        // Load word banks
        const allWordBanks = await db.wordBanks.toArray();
        setWordBanks(allWordBanks);
        
        // Load presets (default presets should have been created by loadDefaultPresets)
        const allPresets = await db.presets.toArray();
        setPresets(allPresets);
        
        // Set default theme if none selected (prefer 'universal' theme)
        if (!currentTheme && allThemes.length > 0) {
          const universalTheme = allThemes.find(t => t.id === 'universal') || allThemes[0];
          setCurrentTheme(universalTheme);
        }
        
        // Set default preset if no current preset (templates are theme-agnostic)
        // Prefer 'default-adjective-noun' as the default, otherwise use first preset
        if (!currentPreset && allPresets.length > 0) {
          const defaultPreset = allPresets.find(p => p.id === 'default-adjective-noun') || allPresets[0];
          setCurrentPreset(defaultPreset);
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Initialization error:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setInitError(`Failed to initialize: ${errorMessage}. Please check the browser console for more details.`);
        setIsInitialized(true); // Still allow app to render so user can see the error
      }
    }
    
    init();
  }, []);

  // Reload presets when entering step 3 or returning from settings
  useEffect(() => {
    async function reloadPresets() {
      if (currentStep === 3) {
        const allPresets = await db.presets.toArray();
        setPresets(allPresets);
      }
    }
    reloadPresets();
  }, [currentStep, setPresets]);

  // Also reload when returning from settings (check for returnTo param)
  useEffect(() => {
    async function reloadFromSettings() {
      const returnTo = searchParams.get('returnTo');
      const step = searchParams.get('step');
      if (returnTo === 'home' && step === '3') {
        const allPresets = await db.presets.toArray();
        setPresets(allPresets);
        // Clear the returnTo param to avoid reloading on every render
        setSearchParams({ step: '3' }, { replace: true });
      }
    }
    reloadFromSettings();
  }, [searchParams, setPresets, setSearchParams]);

  // Generate names when theme and preset are selected and we have images
  useEffect(() => {
    async function generateImageNames() {
      // Prevent concurrent runs
      if (isGeneratingNamesRef.current) {
        return;
      }
      
      // Get current state values
      const currentImages = images;
      const currentThemeValue = currentTheme;
      const currentPresetValue = currentPreset;
      
      if (!currentThemeValue || !currentPresetValue || currentImages.length === 0) {
        return;
      }

      // Check if any images need names
      const imagesNeedingNames = currentImages.filter(img => !img.suggestedName || !img.currentName);
      if (imagesNeedingNames.length === 0) {
        return; // All images already have names
      }

      console.log(`Generating names for ${imagesNeedingNames.length} images...`);
      isGeneratingNamesRef.current = true;

      try {
        // Load word banks filtered by selected theme
        let allWordBanks = wordBanks.length > 0 
          ? wordBanks 
          : await db.wordBanks.toArray();

        // Filter by selected theme (exclude word banks without themeId)
        if (currentThemeValue) {
          const beforeFilter = allWordBanks.length;
          allWordBanks = allWordBanks.filter(b => b.themeId && b.themeId === currentThemeValue.id);
          console.log(`Filtered word banks for theme "${currentThemeValue.id}": ${beforeFilter} -> ${allWordBanks.length}`);
          console.log(`Word bank IDs: ${allWordBanks.map(b => `${b.id} (${b.themeId})`).join(', ')}`);
          
          // Verify all word banks belong to the selected theme
          const wrongThemeBanks = allWordBanks.filter(b => b.themeId !== currentThemeValue.id);
          if (wrongThemeBanks.length > 0) {
            console.error(`Found ${wrongThemeBanks.length} word banks with wrong theme:`, wrongThemeBanks.map(b => `${b.id} (theme: ${b.themeId})`));
          }
        } else {
          // Even if no theme selected, exclude word banks without themeId
          allWordBanks = allWordBanks.filter(b => b.themeId);
        }

        if (allWordBanks.length === 0) {
          console.warn('No word banks available for the selected theme');
          return;
        }
    
        const maxLength = settings?.maxFilenameLength || 255;
        // Generate names sequentially to ensure uniqueness and avoid adjective/noun repetition
        const updatedImages: typeof images = [];
        const currentUsedNames = new Set(sessionUsedNames);
        const currentUsedAdjectives = new Set<string>(); // Track adjectives used in this batch
        const currentUsedNouns = new Set<string>(); // Track nouns used in this batch
        
        // Re-check images haven't been cleared while we were processing
        const imagesToProcess = images;
        if (imagesToProcess.length === 0) {
          console.warn('Images were cleared during name generation');
          return;
        }
        
        for (const image of imagesToProcess) {
          // Skip if image already has a name
          if (image.suggestedName && image.currentName) {
            updatedImages.push(image);
            continue;
          }
          
          try {
            // Generate suggested name - pass current usedNames, usedAdjectives, and usedNouns sets which get updated as we go
            const generated = await generateName({
              preset: currentPresetValue,
              wordBanks: allWordBanks,
              usedNames: currentUsedNames,
              usedAdjectives: currentUsedAdjectives,
              usedNouns: currentUsedNouns,
              extension: image.extension,
              maxLength,
            });

            // Final safety check: verify the name is still unique before committing
            const fullSlug = `${generated.slug}${image.extension}`;
            if (currentUsedNames.has(fullSlug)) {
              // This should never happen with sequential processing, but be safe
              console.warn(`Name collision detected for ${fullSlug}, regenerating...`);
              // Regenerate with updated usedNames, usedAdjectives, and usedNouns sets
              const regenerated = await generateName({
                preset: currentPresetValue,
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
              await registerName(regenerated.name, currentPresetValue.id, settings?.locale, image.extension);
              updatedImages.push({
                ...image,
                suggestedName: regenerated.name,
                currentName: regenerated.name,
              });
              continue;
            }

            // Register name in both session and persistent ledger
            // Update both the local set and the store
            currentUsedNames.add(fullSlug);
            addUsedName(fullSlug);
            await registerName(generated.name, currentPresetValue.id, settings?.locale, image.extension);

            updatedImages.push({
              ...image,
              suggestedName: generated.name,
              currentName: generated.name,
            });
          } catch (err: any) {
            console.error('Error generating name for image:', err);
            // Return original image if generation fails
            updatedImages.push(image);
          }
        }

        // Final check: ensure images haven't been cleared
        const finalImages = images;
        if (finalImages.length === 0) {
          console.warn('Images were cleared before updating - aborting update');
          return;
        }

        // Ensure we have the same number of images (safety check)
        if (updatedImages.length === finalImages.length) {
          setImages(updatedImages);
        } else {
          console.warn(`Image count mismatch: expected ${finalImages.length}, got ${updatedImages.length}`);
          // Only update if we have some valid images - don't clear images if count is wrong
          if (updatedImages.length > 0 && updatedImages.length === finalImages.length) {
            setImages(updatedImages);
          } else {
            // If count is wrong, something went wrong - keep original images
            console.error(`Image count mismatch during name generation - keeping original ${finalImages.length} images`);
          }
        }
      } catch (err: any) {
        console.error('Error generating image names:', err);
        // Don't clear images on error - keep existing images
      } finally {
        isGeneratingNamesRef.current = false;
      }
    }

    // Only generate names if we have images without names
    // Generate names when we have theme, preset, and images - regardless of step
    // (names can be generated on step 2 if user goes back, or step 3 when template is selected)
    const imagesNeedNames = images.length > 0 && images.some(img => !img.suggestedName || !img.currentName);
    if (imagesNeedNames && currentTheme && currentPreset) {
      generateImageNames();
    }
  }, [currentTheme?.id, currentPreset?.id, images, currentStep, wordBanks, sessionUsedNames, settings, addUsedName, setImages]);

    // Regenerate names for unlocked images
    const handleRegenerateNames = async () => {
      if (!currentTheme || !currentPreset || images.length === 0) {
        return;
      }

      try {
        // Load word banks filtered by selected theme
        let allWordBanks = wordBanks.length > 0 
          ? wordBanks 
          : await db.wordBanks.toArray();

        // Filter by selected theme (exclude word banks without themeId)
        if (currentTheme) {
          allWordBanks = allWordBanks.filter(b => b.themeId && b.themeId === currentTheme.id);
        } else {
          // Even if no theme selected, exclude word banks without themeId
          allWordBanks = allWordBanks.filter(b => b.themeId);
        }

        if (allWordBanks.length === 0) {
          console.warn('No word banks available for the selected theme');
          return;
        }

        const maxLength = settings?.maxFilenameLength || 255;
        
        // Release old names from ledger for unlocked images
        const oldSlugs: string[] = [];
        images.forEach(image => {
          if (!image.locked && image.currentName) {
            const slug = image.currentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            oldSlugs.push(`${slug}${image.extension}`);
          }
        });
        if (oldSlugs.length > 0) {
          await releaseNames(oldSlugs);
        }

        // Generate new names for unlocked images only - process sequentially to ensure unique names and avoid adjective/noun repetition
        const updatedImages: typeof images = [];
        const currentUsedNames = new Set(sessionUsedNames);
        const currentUsedAdjectives = new Set<string>(); // Track adjectives used in this regeneration
        const currentUsedNouns = new Set<string>(); // Track nouns used in this regeneration
        
        for (const image of images) {
          // Skip locked images
          if (image.locked) {
            updatedImages.push(image);
            continue;
          }
          
          try {
            // Generate new suggested name - pass current usedNames, usedAdjectives, and usedNouns sets which get updated as we go
            const generated = await generateName({
              preset: currentPreset,
              wordBanks: allWordBanks,
              usedNames: currentUsedNames,
              usedAdjectives: currentUsedAdjectives,
              usedNouns: currentUsedNouns,
              extension: image.extension,
              maxLength,
            });

            // Final safety check: verify the name is still unique before committing
            const fullSlug = `${generated.slug}${image.extension}`;
            if (currentUsedNames.has(fullSlug)) {
              // This should never happen with sequential processing, but be safe
              console.warn(`Name collision detected for ${fullSlug}, regenerating...`);
              // Regenerate with updated usedNames, usedAdjectives, and usedNouns sets
              const regenerated = await generateName({
                preset: currentPreset,
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
              await registerName(regenerated.name, currentPreset.id, settings?.locale, image.extension);
              updatedImages.push({
                ...image,
                suggestedName: regenerated.name,
                currentName: regenerated.name,
              });
              continue;
            }

            // Register new name in both session and persistent ledger
            // Update both the local set and the store
            currentUsedNames.add(fullSlug);
            addUsedName(fullSlug);
            await registerName(generated.name, currentPreset.id, settings?.locale, image.extension);

            updatedImages.push({
              ...image,
              suggestedName: generated.name,
              currentName: generated.name,
            });
          } catch (err: any) {
            console.error('Error regenerating name for image:', err);
            // Return original image if generation fails
            updatedImages.push(image);
          }
        }

        // Update images
        if (updatedImages.length === images.length) {
          setImages(updatedImages);
        }
      } catch (err: any) {
        console.error('Error regenerating image names:', err);
      }
    };

  // Handle rename operation
  const handleRenameFiles = useCallback(async () => {
    if (images.length === 0) {
      addError('', 'No images selected. Please go back to step 1 to select images.');
      return;
    }

    // Check if images have current names
    const imagesWithoutNames = images.filter(img => !img.currentName);
    if (imagesWithoutNames.length > 0) {
      addError('', `${imagesWithoutNames.length} image(s) have no generated name. Please generate names first.`);
      return;
    }

    // Check if we can rename in place (have file handles with move() support)
    const hasFileHandles = images.every(img => img.fileHandle);
    const canRenameInPlace = hasFileHandles && images.some(img => img.fileHandle && 'move' in img.fileHandle);
    
    // Determine if we need a destination directory
    let workingDirectory: FileSystemDirectoryHandle | null = selectedDirectory;
    let userSelectedFolder = false; // Track if user just selected a folder via picker
    
    // If no directory is selected but we need one, prompt user
    if (!selectedDirectory && !canRenameInPlace) {
      try {
        setProcessing(true);
        clearErrors();
        const destDir = await selectDirectory();
        if (!destDir) {
          addError('', 'Destination folder selection cancelled. Please select a folder to rename files.');
          setProcessing(false);
          return;
        }
        workingDirectory = destDir;
        setSelectedDirectory(destDir);
        userSelectedFolder = true; // User explicitly selected this folder - use it directly
      } catch (err: any) {
        addError('', `Failed to select destination folder: ${err.message}`);
        setProcessing(false);
        return;
      }
    }

    try {
      setProcessing(true);
      clearErrors();
      setRenameResult(null);

      const batchId = `batch-${Date.now()}`;
      const entries: AuditEntry[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Get destination settings (used for both subfolder creation and path tracking)
      const destinationOption = settings?.renameDestinationOption || 'subfolder';
      const subfolderName = settings?.renameSubfolderName || 'renamed';
      const siblingFolderName = settings?.renameSiblingFolderName || 'original';

      // Determine destination directory and track folder name for path construction
      let destinationDir: FileSystemDirectoryHandle | null = null;
      let destinationFolderName: string = ''; // Track the folder name for path construction
      
      if (workingDirectory) {
        if (userSelectedFolder) {
          // User explicitly selected a folder via picker - use it directly
          destinationDir = workingDirectory;
          destinationFolderName = workingDirectory.name; // Use the selected folder's name
        } else {
          // Files were dropped from a folder - create subfolder based on settings
          const folderName = destinationOption === 'subfolder' ? subfolderName : siblingFolderName;
          // Sanitize folder name to prevent path separator issues
          const sanitizedFolderName = folderName.split(/[/\\]/).filter(Boolean).pop() || folderName;
          destinationDir = await createDirectory(workingDirectory, sanitizedFolderName);
          destinationFolderName = sanitizedFolderName; // Use the created subfolder name
        }
      }

      // Process each image
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setProgress(i + 1, images.length);

        // Skip locked files - they keep their original name
        if (image.locked) {
          entries.push({
            oldPath: image.path,
            oldName: image.originalName,
            newPath: image.path,
            newName: image.originalName,
            status: 'success',
            timestamp: new Date().toISOString(),
          });
          successCount++;
          continue;
        }

        try {
          if (!image.currentName) {
            throw new Error(`Image "${image.originalName}" has no generated name.`);
          }

          const newName = `${image.currentName}${image.extension}`;
          const oldPath = image.path;
          let newPath = oldPath;

          // Register name in both session and persistent ledger
          const fullSlug = `${image.currentName}${image.extension}`;
          addUsedName(fullSlug);
          await registerName(image.currentName, undefined, undefined, image.extension);

          // Check if fileHandle is a real FileSystemFileHandle or just a File object
          const isRealFileHandle = image.fileHandle && !(image.fileHandle instanceof File) && 'getFile' in image.fileHandle;
          
          // If we have a file handle with move() support and no destination directory, rename in place
          if (isRealFileHandle && !destinationDir && 'move' in image.fileHandle) {
            await renameFile(image.fileHandle as FileSystemFileHandle, newName);
            newPath = image.path.replace(image.originalName, newName);
          } else if (destinationDir && image.fileHandle) {
            // Move to destination directory (works with both FileSystemFileHandle and File objects)
            try {
              await moveFile(image.fileHandle as any, destinationDir, newName);
              // Use the tracked destination folder name for path construction
              newPath = destinationFolderName ? `${destinationFolderName}/${newName}` : newName;
            } catch (moveErr: any) {
              console.error('Error moving file:', moveErr);
              throw new Error(`Failed to move file to destination: ${moveErr.message}`);
            }
          } else if (!image.fileHandle) {
            throw new Error('Files selected via file input require a destination folder. Please select a folder first.');
          } else {
            throw new Error('Unable to rename file. Please ensure a destination folder is selected.');
          }

          entries.push({
            oldPath,
            oldName: image.originalName,
            newPath,
            newName,
            status: 'success',
            timestamp: new Date().toISOString(),
          });

          successCount++;
        } catch (err: any) {
          const errorMsg = err.message || 'Unknown error';
          console.error(`Error processing image ${image.originalName}:`, err);
          addError(image.id, errorMsg);
          
          entries.push({
            oldPath: image.path,
            oldName: image.originalName,
            newPath: '',
            newName: '',
            status: 'error',
            error: errorMsg,
            timestamp: new Date().toISOString(),
          });

          errorCount++;
        }
      }

      // Save audit log
      const auditBatch: AuditBatch = {
        id: `audit-${Date.now()}`,
        batchId,
        entries,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: errorCount === 0 ? 'completed' : errorCount === images.length ? 'failed' : 'partial',
      };

      await addAuditBatch(auditBatch);
      setLastBatchId(batchId);
      setRenameResult({ successCount, errorCount, batchId });

      // Move to step 5 to show success summary
      setCurrentStep(5);
    } catch (err: any) {
      console.error('Batch rename error:', err);
      const errorMsg = err.message || 'An unexpected error occurred during rename';
      addError('', errorMsg);
    } finally {
      setProcessing(false);
    }
  }, [
    images,
    selectedDirectory,
    setSelectedDirectory,
    settings,
    setProcessing,
    setProgress,
    addError,
    clearErrors,
    addAuditBatch,
    setLastBatchId,
    addUsedName,
  ]);

  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const canProceedToStep2 = images.length > 0 || selectedImageCount > 0;
  const canProceedToStep3 = currentTheme !== null;
  const canProceedToStep4 = currentPreset !== null;
  const canProceedToStep5 = images.length > 0;

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Initialization Error
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {initError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

            return (
    <div className="flex flex-col h-full min-h-0 space-y-6">
      {/* Main Layout: Stepper on left, Content on right */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
        {/* Left Sidebar - Stepper (hidden on mobile, shown on lg+) */}
        <div className="hidden lg:block w-64 xl:w-80 flex-shrink-0">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            isCurrentStepComplete={
              (currentStep === 1 && canProceedToStep2) ||
              (currentStep === 2 && canProceedToStep3) ||
              (currentStep === 3 && canProceedToStep4) ||
              (currentStep === 4 && canProceedToStep5)
            }
          />
        </div>

        {/* Mobile Step Indicator (shown only on mobile) */}
        <div className="lg:hidden mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {STEPS[currentStep - 1]?.name}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 dark:bg-blue-500"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Side - Main Content */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
                      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col min-h-[472px] max-h-[calc(100vh-12rem)] overflow-hidden`}>
              {/* Content Area */}
              <div className={`p-6 flex flex-col ${
                currentStep === 1 ? 'flex-1 min-h-0' : currentStep === 2 || currentStep === 3 || currentStep === 4 ? 'flex-1 min-h-0' : 'flex-1 min-h-0'
              }`}>
              {currentStep === 1 && (
                <div className="space-y-4 flex flex-col min-w-0 min-h-0 flex-1">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 flex-shrink-0">Select images</h2>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <FilePicker 
                      ref={filePickerRef} 
                      onSelectionChange={(selectedCount, scannedCount) => {
                        setSelectedImageCount(selectedCount);
                      }}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 flex flex-col min-w-0 min-h-0 flex-1">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Select theme</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/settings?tab=themes&returnTo=home&step=2`)}
                      className="inline-flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create theme
                    </Button>
                  </div>
                  {themes.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No themes available. Create your first theme to get started.
                      </p>
                      <Button onClick={() => navigate(`/settings?tab=themes&returnTo=home&step=2`)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create theme
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <div className="flex flex-col gap-3">
                      {themes
                        .sort((a, b) => {
                          // Put 'universal' theme first
                          if (a.id === 'universal') return -1;
                          if (b.id === 'universal') return 1;
                          return a.name.localeCompare(b.name);
                        })
                        .map((theme) => (
                        <div
                          key={theme.id}
                          onClick={() => setCurrentTheme(theme)}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors w-full ${
                            currentTheme?.id === theme.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{theme.name}</h3>
                              {theme.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{theme.description}</p>
                              )}
                              <p className="text-sm font-mono italic text-gray-500 dark:text-gray-400">
                                e.g. {generateThemeExampleName(theme, wordBanks || [])}
                              </p>
                </div>
                            {currentTheme?.id === theme.id && (
                              <div className="ml-4 flex-shrink-0">
                                <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
              </div>
                    </div>
                  )}
                </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 flex flex-col min-w-0 min-h-0 flex-1">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Select template</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/settings?tab=templates&returnTo=home&step=3`)}
                      className="inline-flex items-center"
                    >
                                              <Plus className="w-4 h-4 mr-2" />
                        Create template
                      </Button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                    {(() => {
                      // Filter templates based on visibility settings
                      // If visiblePresetIds is undefined/null/empty, show all templates
                      // Otherwise, show only templates in the visiblePresetIds array
                      let filteredPresets = presets;
                      if (settings?.visiblePresetIds && Array.isArray(settings.visiblePresetIds) && settings.visiblePresetIds.length > 0) {
                        filteredPresets = presets.filter(p => settings.visiblePresetIds!.includes(p.id));
                      }
                      
                      // Sort templates logically: basic patterns first, then variations
                      const getPresetOrder = (preset: Preset): number => {
                        // Default presets get priority ordering
                        const orderMap: Record<string, number> = {
                          'default-adjective-noun': 1,
                          'default-adjective-adjective-noun': 2,
                          'default-adjective-adjective-adjective-noun': 3,
                          'default-adjective-noun-counter': 4,
                          'default-adjective-noun-date': 5,
                          'default-adjective-noun-date-counter': 6,
                          'default-date-adjective-noun': 7,
                          'default-prefix-adjective-noun': 8,
                          'default-prefix-adjective-adjective-noun': 9,
                          'default-adjective-noun-suffix': 10,
                          'default-adjective-noun-suffix-counter': 11,
                          'default-noun-adjective': 12,
                        };
                        
                        // If it's a default preset, use the order map
                        if (preset.id in orderMap) {
                          return orderMap[preset.id];
                        }
                        
                        // For custom presets, sort by number of adjectives first, then alphabetically
                        // Put them after all defaults (starting at 100)
                        return 100 + (preset.numAdjectives * 10) + (preset.name.charCodeAt(0) || 0);
                      };
                      
                      const availablePresets = [...filteredPresets].sort((a, b) => {
                        const orderA = getPresetOrder(a);
                        const orderB = getPresetOrder(b);
                        if (orderA !== orderB) {
                          return orderA - orderB;
                        }
                        // If same order, sort alphabetically by name
                        return a.name.localeCompare(b.name);
                      });
                      return availablePresets.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          No templates available. Create your first template to get started.
                        </p>
                        <Button onClick={() => navigate(`/settings?tab=templates&returnTo=home&step=3`)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Template
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 pr-2">
                        {availablePresets.map((preset) => (
                          <div
                            key={preset.id}
                            className={`p-6 border rounded-lg transition-colors w-full flex-shrink-0 relative ${
                              currentPreset?.id === preset.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            {currentPreset?.id === preset.id && (
                              <div className="absolute top-4 right-4">
                                <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                            <div className="flex items-start justify-between">
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => setCurrentPreset(preset)}
                              >
                                <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{preset.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  {getTemplatePattern(preset.template)}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-500 mb-2">
                                  Case: {getCaseStyleDisplay(preset.caseStyle)} | Delimiter: {getDelimiterDisplay(preset.delimiter)}
                                </p>
                                <p className="text-sm font-mono italic text-gray-500 dark:text-gray-400">
                                  e.g. {generateExampleName(preset, wordBanks || [], currentTheme)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
              </div>
            );
                  })()}
                    </div>
                </div>
              )}

                                                         {currentStep === 4 && (
                   <div className="space-y-4 flex flex-col min-w-0 min-h-0 flex-1">
                     <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                               <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Review & edit</h2>
                       <Button
                         variant="outline"
                         onClick={handleRegenerateNames}
                         disabled={!currentTheme || !currentPreset || images.length === 0 || isProcessing}
                         className="flex items-center"
                       >
                         <RotateCw className="w-4 h-4 mr-2" />
                         Regenerate
                       </Button>
                     </div>
                     {/* Info message about destination settings - only show if user selected a folder */}
                     {selectedDirectory && (
                       <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3 flex-shrink-0">
                         <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                         <div className="flex-1 min-w-0">
                           <p className="text-sm text-blue-800 dark:text-blue-200">
                             Renamed files will be saved to a subfolder. To change the destination or folder name, go to{' '}
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => navigate('/settings?tab=general')}
                               className="inline-flex items-center gap-1 text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100 p-0 h-auto font-medium underline"
                             >
                               Settings
                               <Settings className="w-4 h-4" />
                             </Button>
                             .
                           </p>
                         </div>
                       </div>
                     )}
                     <div className="flex-1 min-h-0 overflow-y-auto">
                       <ImageGrid />
                     </div>
                     {errors.length > 0 && (
                       <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex-shrink-0">
                         <div className="space-y-2">
                           {errors.map((err, index) => (
                             <p key={index} className="text-sm text-red-700 dark:text-red-300">
                               {err.error}
                             </p>
                           ))}
                         </div>
                       </div>
                     )}
                     {isProcessing && (
                       <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex-shrink-0">
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Processing...</span>
                           <span className="text-sm text-gray-600 dark:text-gray-400">
                             {images.length} files
                           </span>
                         </div>
                         <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                           <div
                             className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                             style={{ width: totalFiles > 0 ? `${(progress / totalFiles) * 100}%` : '0%' }}
                           />
                         </div>
                       </div>
                     )}
                   </div>
                     )}

                              {currentStep === 5 && renameResult && (
                  <div className="space-y-4 flex flex-col min-w-0 min-h-0 flex-1">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 flex-shrink-0">Rename complete</h2>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                        {renameResult.errorCount === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              Successfully renamed {renameResult.successCount} file{renameResult.successCount !== 1 ? 's' : ''}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              All files have been renamed and moved to the destination folder.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="text-center py-4">
                              {renameResult.successCount > 0 && (
                                <div className="mb-4">
                                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Successfully renamed {renameResult.successCount} file{renameResult.successCount !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              )}
                              {renameResult.errorCount > 0 && (
                                <div>
                                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Failed to rename {renameResult.errorCount} file{renameResult.errorCount !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              )}
                            </div>
                            {errors.length > 0 && (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="space-y-2">
                                  {errors.map((err, index) => (
                                    <p key={index} className="text-sm text-red-700 dark:text-red-300">
                                      {err.error}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                      )}
                </div>

            {/* Bottom Navigation */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0 mt-auto">
              <div className="flex-1">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                )}
                                        </div>
              <div className="flex-1 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Step {currentStep} of {STEPS.length}
                                          </span>
                                        </div>
              <div className="flex-1 flex justify-end">
                {currentStep === 1 && (
                  <Button
                    onClick={async () => {
                      if (filePickerRef.current && selectedImageCount > 0) {
                        setIsProcessingImages(true);
                        try {
                          await filePickerRef.current.handleConfirmSelection();
                          // Move to step 2 (Select Theme) after confirming images
                          setCurrentStep(2);
                        } finally {
                          setIsProcessingImages(false);
                        }
                      }
                    }}
                    disabled={selectedImageCount === 0 || isProcessingImages || (filePickerRef.current?.isLoading ?? false)}
                  >
                    {isProcessingImages || filePickerRef.current?.isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : selectedImageCount > 0 ? (
                      <>
                        Continue with {selectedImageCount} image{selectedImageCount !== 1 ? 's' : ''}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
                {currentStep === 2 && (
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!canProceedToStep3}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {currentStep === 3 && (
                  <Button
                    onClick={() => setCurrentStep(4)}
                    disabled={!canProceedToStep4}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {currentStep === 4 && (
                  <Button
                    onClick={handleRenameFiles}
                    disabled={!currentTheme || !currentPreset || images.length === 0 || isProcessing}
                    className="flex items-center"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Rename {images.length} file{images.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                )}
                {currentStep === 5 && renameResult && (
                  <Button
                    onClick={() => {
                      setRenameResult(null);
                      clearErrors();
                      // Don't clear images - let user keep them if they want to start over
                      setCurrentStep(1);
                    }}
                  >
                    Start over
                  </Button>
                )}
                </div>
              </div>
        </div>
        </div>
      </div>
    </div>
  );
}
