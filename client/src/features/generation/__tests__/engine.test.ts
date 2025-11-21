/**
 * Unit tests for name generation engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SeededRNG, normalizeName, validateFilename, generateName } from '../engine';
import type { Preset, WordBank } from '../../store/db';
import { createTestPreset, createTestWordBank } from '../../../test/utils/testData';

describe('SeededRNG', () => {
  it('should generate deterministic sequences with the same seed', () => {
    const rng1 = new SeededRNG(12345);
    const rng2 = new SeededRNG(12345);
    
    const seq1 = [rng1.next(), rng1.next(), rng1.next()];
    const seq2 = [rng2.next(), rng2.next(), rng2.next()];
    
    expect(seq1).toEqual(seq2);
  });

  it('should generate different sequences with different seeds', () => {
    const rng1 = new SeededRNG(12345);
    const rng2 = new SeededRNG(67890);
    
    const seq1 = [rng1.next(), rng1.next(), rng1.next()];
    const seq2 = [rng2.next(), rng2.next(), rng2.next()];
    
    expect(seq1).not.toEqual(seq2);
  });

  it('should generate numbers between 0 and 1', () => {
    const rng = new SeededRNG(12345);
    
    for (let i = 0; i < 100; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('should generate integers within range', () => {
    const rng = new SeededRNG(12345);
    const max = 10;
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(max);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(max);
    }
  });
});

describe('normalizeName', () => {
  it('should apply Title case correctly', () => {
    const result = normalizeName('hello world', 'Title');
    expect(result).toBe('Hello World');
  });

  it('should apply Sentence case correctly', () => {
    const result = normalizeName('hello world', 'Sentence');
    expect(result).toBe('Hello world');
  });

  it('should apply lowercase correctly', () => {
    const result = normalizeName('HELLO WORLD', 'lower');
    expect(result).toBe('hello world');
  });

  it('should apply UPPERCASE correctly', () => {
    const result = normalizeName('hello world', 'UPPER');
    expect(result).toBe('HELLO WORLD');
  });

  it('should handle legacy kebab case style', () => {
    const result = normalizeName('HELLO WORLD', 'kebab');
    expect(result).toBe('hello world');
  });

  it('should handle legacy snake case style', () => {
    const result = normalizeName('HELLO WORLD', 'snake');
    expect(result).toBe('hello world');
  });

  it('should remove invalid characters', () => {
    const result = normalizeName('hello<>world', 'Title');
    expect(result).toBe('Helloworld');
  });

  it('should handle empty strings', () => {
    const result = normalizeName('', 'Title');
    expect(result).toBe('');
  });
});

describe('validateFilename', () => {
  it('should accept valid filenames', () => {
    const validNames = [
      'my-image',
      'test-file-123',
      'photo',
    ];

    validNames.forEach(name => {
      const result = validateFilename(name, '.png', 255);
      expect(result).toBeNull();
    });
  });

  it('should reject reserved Windows names', () => {
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'];

    reservedNames.forEach(name => {
      const result = validateFilename(name, '.png', 255);
      expect(result).toContain('Reserved');
    });
  });

  it('should reject filenames that are too long', () => {
    const longName = 'a'.repeat(300);
    const result = validateFilename(longName, '.png', 255);
    expect(result).toContain('too long');
  });

  it('should reject filenames with invalid characters', () => {
    const invalidNames = [
      'file<>name',
      'file:name',
      'file/name',
      'file\\name',
      'file|name',
      'file?name',
      'file*name',
    ];

    invalidNames.forEach(name => {
      const result = validateFilename(name, '.png', 255);
      expect(result).toContain('invalid characters');
    });
  });

  it('should reject filenames with leading/trailing spaces', () => {
    const result = validateFilename(' file ', '.png', 255);
    expect(result).toContain('leading/trailing');
  });

  it('should reject filenames starting or ending with dots', () => {
    const result1 = validateFilename('.file', '.png', 255);
    const result2 = validateFilename('file.', '.png', 255);
    expect(result1).toContain('leading/trailing');
    expect(result2).toContain('leading/trailing');
  });

  it('should account for extension length', () => {
    const name = 'a'.repeat(250);
    const result = validateFilename(name, '.png', 255);
    expect(result).toContain('too long');
  });
});

describe('generateName', () => {
  let preset: Preset;
  let wordBanks: WordBank[];

  beforeEach(() => {
    preset = createTestPreset({
      template: [
        { id: '1', type: 'adjective' },
        { id: '2', type: 'noun' },
      ],
      numAdjectives: 1,
      delimiter: '-',
      caseStyle: 'Title',
    });

    wordBanks = [
      createTestWordBank({
        id: 'adj-1',
        type: 'adjective',
        words: ['cool', 'awesome', 'great'],
      }),
      createTestWordBank({
        id: 'noun-1',
        type: 'noun',
        words: ['image', 'photo', 'picture'],
      }),
    ];
  });

  it('should generate a name from template', async () => {
    const result = await generateName({
      preset,
      wordBanks,
      usedNames: new Set(),
      extension: '.png',
      maxLength: 255,
    });

    expect(result.name).toBeTruthy();
    expect(result.slug).toBeTruthy();
    expect(result.name.length).toBeGreaterThan(0);
  });

  it('should avoid collisions with used names', async () => {
    const usedNames = new Set(['cool-image.png']);
    
    // Mock the registerName check to simulate collision
    const result = await generateName({
      preset,
      wordBanks,
      usedNames,
      extension: '.png',
      maxLength: 255,
      maxRetries: 10,
    });

    // Should generate a different name
    expect(result.slug).not.toBe('cool-image');
  });

  it('should apply case style correctly', async () => {
    const titlePreset = { ...preset, caseStyle: 'Title' as const };
    const result = await generateName({
      preset: titlePreset,
      wordBanks,
      usedNames: new Set(),
      extension: '.png',
      maxLength: 255,
    });

    // Check that first letter of each word is capitalized
    const words = result.name.split('-');
    words.forEach(word => {
      if (word.length > 0) {
        expect(word[0]).toBe(word[0].toUpperCase());
      }
    });
  });

  it('should use delimiter correctly', async () => {
    const underscorePreset = { ...preset, delimiter: '_' };
    const result = await generateName({
      preset: underscorePreset,
      wordBanks,
      usedNames: new Set(),
      extension: '.png',
      maxLength: 255,
    });

    expect(result.name).toContain('_');
    expect(result.name).not.toContain('-');
  });

  it('should include prefix if specified', async () => {
    const prefixPreset = { ...preset, prefix: 'IMG' };
    const result = await generateName({
      preset: prefixPreset,
      wordBanks,
      usedNames: new Set(),
      extension: '.png',
      maxLength: 255,
    });

    expect(result.name).toMatch(/^IMG/);
  });

  it('should include suffix if specified', async () => {
    const suffixPreset = { ...preset, suffix: 'FINAL' };
    const result = await generateName({
      preset: suffixPreset,
      wordBanks,
      usedNames: new Set(),
      extension: '.png',
      maxLength: 255,
    });

    expect(result.name).toMatch(/FINAL$/);
  });

  it('should throw error if insufficient word banks', async () => {
    const emptyBanks: WordBank[] = [];

    await expect(
      generateName({
        preset,
        wordBanks: emptyBanks,
        usedNames: new Set(),
        extension: '.png',
        maxLength: 255,
      })
    ).rejects.toThrow('Insufficient word banks');
  });

  it('should handle multiple adjectives', async () => {
    const multiAdjPreset = { ...preset, numAdjectives: 2 };
    const result = await generateName({
      preset: multiAdjPreset,
      wordBanks,
      usedNames: new Set(),
      extension: '.png',
      maxLength: 255,
    });

    // Should contain multiple words separated by delimiter
    const parts = result.name.split(preset.delimiter);
    expect(parts.length).toBeGreaterThanOrEqual(3); // 2 adjectives + 1 noun
  });

  it('should respect maxLength constraint', async () => {
    const result = await generateName({
      preset,
      wordBanks,
      usedNames: new Set(),
      extension: '.png',
      maxLength: 10, // Very short limit
    });

    const fullName = result.name + '.png';
    expect(fullName.length).toBeLessThanOrEqual(10);
  });
});

