// Name generation engine with templates, RNG, and collision detection

import { db } from '../store/db';
import type { Preset, WordBank } from '../store/db';

export interface NameGenerationOptions {
  preset: Preset;
  wordBanks: WordBank[];
  usedNames: Set<string>;
  usedAdjectives?: Set<string>; // Track adjectives used in current batch to avoid repetition
  usedNouns?: Set<string>; // Track nouns used in current batch to avoid repetition
  extension: string;
  maxLength: number;
  maxRetries?: number;
}

export interface GeneratedName {
  name: string;
  slug: string; // normalized for uniqueness checking
}

// Valid filename characters (Windows-safe)
const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
const INVALID_NAMES = new Set(['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']);

// RNG with seed support
export class SeededRNG {
  private seed: number;

  constructor(seed?: number) {
    // Use a more unique seed if not provided - combine timestamp with random component
    this.seed = seed || Date.now() + Math.random() * 1000000;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

// Normalize string for uniqueness checking
export function normalizeName(name: string, caseStyle: Preset['caseStyle'] | string): string {
  let normalized = name;

  // Handle legacy 'kebab' and 'snake' case styles (treat as 'lower')
  const normalizedCaseStyle = (caseStyle === 'kebab' || caseStyle === 'snake') ? 'lower' : caseStyle;

  // Apply case style
  switch (normalizedCaseStyle) {
    case 'Title':
      normalized = normalized.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
      break;
    case 'Sentence':
      normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
      break;
    case 'lower':
      normalized = normalized.toLowerCase();
      break;
    case 'UPPER':
      normalized = normalized.toUpperCase();
      break;
  }

  // Remove invalid characters
  normalized = normalized.replace(INVALID_CHARS, '');

  return normalized;
}

// Strip diacritics
function stripDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Convert to ASCII-only
function toASCII(str: string): string {
  return str.replace(/[^\x00-\x7F]/g, '');
}

// Validate filename
export function validateFilename(name: string, extension: string, maxLength: number): string | null {
  // Check reserved names
  const baseName = name.substring(0, name.lastIndexOf('.') || name.length);
  if (INVALID_NAMES.has(baseName.toUpperCase())) {
    return 'Reserved Windows filename';
  }

  // Check length
  const fullName = name + extension;
  if (fullName.length > maxLength) {
    return `Filename too long (${fullName.length} > ${maxLength})`;
  }

  // Check for invalid characters
  if (INVALID_CHARS.test(name)) {
    return 'Contains invalid characters';
  }

  // Check for leading/trailing spaces or dots
  if (name.trim() !== name || name.startsWith('.') || name.endsWith('.')) {
    return 'Invalid leading/trailing characters';
  }

  return null;
}

// Generate name from template
export async function generateName(options: NameGenerationOptions): Promise<GeneratedName> {
  const {
    preset,
    wordBanks,
    usedNames,
    extension,
    maxLength,
    maxRetries = 100,
  } = options;

  const rng = new SeededRNG();
  const adjectives = wordBanks.filter((b) => b.type === 'adjective' && (!preset.nsfwFilter || !b.nsfw));
  const nouns = wordBanks.filter((b) => b.type === 'noun' && (!preset.nsfwFilter || !b.nsfw));

  if (adjectives.length === 0 || nouns.length === 0) {
    throw new Error('Insufficient word banks');
  }

  // Get all words from selected banks
  // If word banks have already been filtered by theme, use all of them
  // Otherwise, filter by preset.wordBankIds
  const adjectiveWords: string[] = [];
  const nounWords: string[] = [];

  // Check if word banks have been pre-filtered (e.g., by theme)
  // If the provided word banks are a strict subset of preset's wordBankIds, 
  // it means they've been pre-filtered (e.g., by theme), so use all of them
  // Otherwise, use preset.wordBankIds filtering
  const allPresetAdjIds = new Set(preset.wordBankIds.adjectives);
  const allPresetNounIds = new Set(preset.wordBankIds.nouns);
  const providedAdjIds = new Set(adjectives.map(b => b.id));
  const providedNounIds = new Set(nouns.map(b => b.id));
  
  // If provided word banks are a strict subset of preset's word banks, 
  // they've been pre-filtered (e.g., by theme) - use all provided banks
  // Otherwise, filter by preset.wordBankIds
  const providedIsSubset = 
    [...providedAdjIds].every(id => allPresetAdjIds.has(id)) &&
    [...providedNounIds].every(id => allPresetNounIds.has(id));
  const providedIsStrictSubset = providedIsSubset && 
    (providedAdjIds.size < allPresetAdjIds.size || providedNounIds.size < allPresetNounIds.size);
  
  const usePresetFiltering = !providedIsStrictSubset;

  // When word banks are pre-filtered by theme, use all of them
  // When not pre-filtered, filter by preset.wordBankIds
  if (usePresetFiltering) {
    // Filter by preset.wordBankIds - only use banks that are in the preset's allowed list
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
  } else {
    // Word banks have been pre-filtered (by theme), use all of them
    // This means we should ONLY use words from the provided (theme-filtered) banks
    for (const bank of adjectives) {
      adjectiveWords.push(...bank.words);
    }
    for (const bank of nouns) {
      nounWords.push(...bank.words);
    }
  }

  if (adjectiveWords.length === 0 || nounWords.length === 0) {
    throw new Error('No words available in selected word banks');
  }

  // Generate candidate names
  const usedAdjectives = options.usedAdjectives || new Set<string>();
  const usedNouns = options.usedNouns || new Set<string>();
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Select words - prefer unused adjectives and nouns
    const selectedAdjectives: string[] = [];
    const availableAdjectives = adjectiveWords.filter(adj => !usedAdjectives.has(adj.toLowerCase()));
    
    // If we have enough unused adjectives, use only those; otherwise use all
    const adjectivePool = availableAdjectives.length >= preset.numAdjectives 
      ? availableAdjectives 
      : adjectiveWords;
    
    for (let i = 0; i < preset.numAdjectives; i++) {
      const adjective = adjectivePool[rng.nextInt(adjectivePool.length)];
      selectedAdjectives.push(adjective);
      // Track this adjective as used (will be committed if name generation succeeds)
    }
    
    // Prefer unused nouns
    const availableNouns = nounWords.filter(noun => !usedNouns.has(noun.toLowerCase()));
    const nounPool = availableNouns.length > 0 ? availableNouns : nounWords;
    const selectedNoun = nounPool[rng.nextInt(nounPool.length)];

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

    // Apply transformations
    let processedName = baseName;
    
    // Apply case style
    processedName = normalizeName(processedName, preset.caseStyle);

    // Strip diacritics if enabled
    // Note: This would be from settings, but for now we'll check preset
    // In practice, you'd pass settings to this function
    // if (stripDiacritics) {
    //   processedName = stripDiacritics(processedName);
    // }

    // Convert to ASCII if enabled
    // if (asciiOnly) {
    //   processedName = toASCII(processedName);
    // }

    // Create slug for uniqueness checking
    const slug = processedName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Check for collisions
    const fullSlug = `${slug}${extension}`;
    
    // Check session used names
    if (usedNames.has(fullSlug)) {
      continue; // Collision in current session, try next attempt
    }

    // Check name ledger in IndexedDB (stores with extension for uniqueness)
    const ledgerEntry = await db.nameLedger.get(fullSlug);
    if (ledgerEntry && !ledgerEntry.released) {
      // Collision with previously used name - try counter if enabled
      if (preset.useCounter) {
        for (let counter = preset.counterStart; counter < preset.counterStart + 1000; counter++) {
          const nameWithCounter = `${processedName}${preset.delimiter}${counter}`;
          const slugWithCounter = `${slug}${preset.delimiter}${counter}`;
          const fullSlugWithCounter = `${slugWithCounter}${extension}`;

          // Check session and ledger for counter variant
          if (!usedNames.has(fullSlugWithCounter)) {
            const counterLedgerEntry = await db.nameLedger.get(fullSlugWithCounter);
            if (!counterLedgerEntry || counterLedgerEntry.released) {
              // Validate counter variant
              const validationError = validateFilename(nameWithCounter, extension, maxLength);
              if (!validationError) {
                return {
                  name: nameWithCounter,
                  slug: slugWithCounter,
                };
              }
            }
          }
        }
      }
      continue; // Collision found, counter exhausted or disabled, try next attempt
    }

    // Validate filename
    const validationError = validateFilename(processedName, extension, maxLength);
    if (validationError) {
      // Validation failed - try with counter if enabled
      if (preset.useCounter) {
        for (let counter = preset.counterStart; counter < preset.counterStart + 1000; counter++) {
          const nameWithCounter = `${processedName}${preset.delimiter}${counter}`;
          const slugWithCounter = `${slug}${preset.delimiter}${counter}`;
          const fullSlugWithCounter = `${slugWithCounter}${extension}`;

          // Check session and ledger for counter variant
          if (!usedNames.has(fullSlugWithCounter)) {
            const counterLedgerEntry = await db.nameLedger.get(fullSlugWithCounter);
            if (!counterLedgerEntry || counterLedgerEntry.released) {
              const validationError = validateFilename(nameWithCounter, extension, maxLength);
              if (!validationError) {
                return {
                  name: nameWithCounter,
                  slug: slugWithCounter,
                };
              }
            }
          }
        }
      }
      continue; // Validation failed, counter exhausted or disabled, try next attempt
    }

    // Success! Mark adjectives and noun as used
    selectedAdjectives.forEach(adj => {
      usedAdjectives.add(adj.toLowerCase());
    });
    usedNouns.add(selectedNoun.toLowerCase());
    
    return {
      name: processedName,
      slug,
    };
  }

  // If we get here, all retries failed - use hash fallback that ensures uniqueness
  let attempts = 0;
  while (attempts < 100) {
    const hash = Math.random().toString(36).substring(2, 8);
    const fallbackName = `${preset.prefix || 'image'}${preset.delimiter}${hash}`;
    const fallbackSlug = fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const fallbackFullSlug = `${fallbackSlug}${extension}`;

    // Check session and ledger for fallback name
    if (!usedNames.has(fallbackFullSlug)) {
      const ledgerEntry = await db.nameLedger.get(fallbackFullSlug);
      if (!ledgerEntry || ledgerEntry.released) {
        // Validate fallback name
        const validationError = validateFilename(fallbackName, extension, maxLength);
        if (!validationError) {
          return {
            name: normalizeName(fallbackName, preset.caseStyle),
            slug: fallbackSlug,
          };
        }
      }
    }
    attempts++;
  }

  // Last resort: use timestamp-based fallback with random component (guaranteed unique)
  const timestamp = Date.now().toString(36);
  const randomComponent = Math.random().toString(36).substring(2, 8);
  const lastResortName = `${preset.prefix || 'image'}${preset.delimiter}${timestamp}-${randomComponent}`;
  const lastResortSlug = lastResortName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const lastResortFullSlug = `${lastResortSlug}${extension}`;

  // Double-check it's not in use (shouldn't happen, but be safe)
  if (!usedNames.has(lastResortFullSlug)) {
    const ledgerEntry = await db.nameLedger.get(lastResortFullSlug);
    if (!ledgerEntry || ledgerEntry.released) {
      return {
        name: normalizeName(lastResortName, preset.caseStyle),
        slug: lastResortSlug,
      };
    }
  }

  // Absolute last resort: add microsecond timestamp
  const microTimestamp = `${Date.now()}-${performance.now()}-${Math.random()}`;
  const absoluteLastResortName = `${preset.prefix || 'image'}${preset.delimiter}${microTimestamp.replace(/[^a-z0-9]/gi, '-')}`;
  const absoluteLastResortSlug = absoluteLastResortName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  return {
    name: normalizeName(absoluteLastResortName, preset.caseStyle),
    slug: absoluteLastResortSlug,
  };
}

// Register name in ledger (stores full name with extension for uniqueness)
export async function registerName(name: string, presetId?: string, locale?: string, extension?: string): Promise<void> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  // Store with extension to ensure uniqueness across different file types
  const fullSlug = extension ? `${slug}${extension}` : slug;
  
  try {
    await db.nameLedger.add({
      nameSlug: fullSlug,
      createdAt: new Date().toISOString(),
      presetId,
      locale,
      released: false,
    });
  } catch (err: any) {
    // Ignore duplicate key errors (already registered)
    if (err.name !== 'ConstraintError') {
      throw err;
    }
  }
}

// Release names (for undo)
export async function releaseNames(slugs: string[]): Promise<void> {
  await db.nameLedger.where('nameSlug').anyOf(slugs).modify({ released: true });
}

