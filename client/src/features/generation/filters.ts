// Filters for word processing: NSFW, diacritics, slug generation

// NSFW word list (basic - can be expanded)
const NSFW_WORDS = new Set([
  // Add your NSFW word list here
  // This is a placeholder - you'd want a comprehensive list
]);

export function isNSFW(word: string): boolean {
  return NSFW_WORDS.has(word.toLowerCase());
}

export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function toASCIIOnly(text: string): string {
  return text.replace(/[^\x00-\x7F]/g, '');
}

export function toSlug(text: string, delimiter: string = '-'): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, delimiter)
    .replace(/^-+|-+$/g, '');
}

export function normalizeUnicode(text: string): string {
  return text.normalize('NFC');
}

