// Built-in word banks for adjectives and nouns

export interface WordBankData {
  id: string;
  type: 'adjective' | 'noun';
  locale: string;
  name: string;
  words: string[];
  category?: string;
  nsfw: boolean;
}

// Large adjective bank
export const ADJECTIVES_EN: WordBankData = {
  id: 'adjectives-en-default',
  type: 'adjective',
  locale: 'en',
  name: 'English Adjectives (Default)',
  words: [
    // Colors
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'silver', 'gold',
    // Sizes
    'large', 'small', 'tiny', 'huge', 'massive', 'mini', 'giant', 'compact', 'vast', 'enormous',
    // Qualities
    'bright', 'dark', 'vivid', 'muted', 'bold', 'subtle', 'sharp', 'soft', 'crisp', 'smooth',
    'clear', 'fuzzy', 'precise', 'rough', 'polished', 'raw', 'refined', 'elegant', 'simple',
    // Moods
    'happy', 'serene', 'dramatic', 'peaceful', 'energetic', 'calm', 'dynamic', 'tranquil', 'vibrant', 'soothing',
    // Nature
    'natural', 'organic', 'wild', 'tamed', 'pristine', 'rustic', 'urban', 'modern', 'classic', 'vintage',
    // Textures
    'smooth', 'rough', 'textured', 'glossy', 'matte', 'satin', 'velvet', 'silk', 'cotton', 'leather',
    // Shapes
    'round', 'square', 'angular', 'curved', 'straight', 'geometric', 'organic', 'symmetrical', 'asymmetrical',
    // Time
    'ancient', 'modern', 'timeless', 'contemporary', 'retro', 'futuristic', 'classic', 'new', 'old', 'fresh',
    // Abstract
    'abstract', 'concrete', 'realistic', 'surreal', 'minimalist', 'maximalist', 'complex', 'simple', 'intricate', 'basic',
    // Additional
    'mysterious', 'enigmatic', 'striking', 'remarkable', 'unique', 'special', 'ordinary', 'extraordinary', 'rare', 'common',
    'beautiful', 'stunning', 'gorgeous', 'magnificent', 'splendid', 'wonderful', 'amazing', 'incredible', 'fantastic', 'marvelous',
  ],
  nsfw: false,
};

// Large noun bank
export const NOUNS_EN: WordBankData = {
  id: 'nouns-en-default',
  type: 'noun',
  locale: 'en',
  name: 'English Nouns (Default)',
  words: [
    // Nature
    'mountain', 'valley', 'river', 'ocean', 'lake', 'forest', 'tree', 'flower', 'leaf', 'stone',
    'cloud', 'sunset', 'sunrise', 'moon', 'star', 'sky', 'earth', 'water', 'fire', 'wind',
    // Animals
    'bird', 'eagle', 'hawk', 'owl', 'swan', 'butterfly', 'dragonfly', 'bee', 'deer', 'fox',
    'wolf', 'bear', 'lion', 'tiger', 'elephant', 'whale', 'dolphin', 'shark', 'fish', 'dolphin',
    // Objects
    'bridge', 'tower', 'castle', 'palace', 'temple', 'church', 'monument', 'statue', 'sculpture', 'artwork',
    // Abstract
    'dream', 'vision', 'memory', 'journey', 'adventure', 'discovery', 'exploration', 'wonder', 'mystery', 'secret',
    'story', 'tale', 'legend', 'myth', 'fable', 'epic', 'saga', 'chronicle', 'narrative', 'account',
    // Emotions
    'joy', 'happiness', 'peace', 'serenity', 'calm', 'tranquility', 'harmony', 'balance', 'zen', 'bliss',
    // Time
    'moment', 'instant', 'second', 'minute', 'hour', 'day', 'night', 'dawn', 'dusk', 'twilight',
    // Places
    'city', 'town', 'village', 'hamlet', 'metropolis', 'capital', 'port', 'harbor', 'bay', 'coast',
    // Art
    'painting', 'portrait', 'landscape', 'still', 'abstract', 'composition', 'study', 'sketch', 'drawing', 'illustration',
    // Music
    'melody', 'harmony', 'rhythm', 'song', 'tune', 'note', 'chord', 'symphony', 'orchestra', 'choir',
    // Additional
    'reflection', 'shadow', 'light', 'beam', 'ray', 'glow', 'sparkle', 'shine', 'glimmer', 'twinkle',
    'pattern', 'design', 'motif', 'theme', 'style', 'form', 'shape', 'structure', 'framework', 'foundation',
  ],
  nsfw: false,
};

// Load default word banks
export async function loadDefaultWordBanks(): Promise<void> {
  const { db } = await import('../store/db');
  
  // These legacy word banks are deprecated - themes now provide word banks
  // We'll remove them if they exist to avoid conflicts with theme-based filtering
  const existingAdj = await db.wordBanks.get(ADJECTIVES_EN.id);
  const existingNoun = await db.wordBanks.get(NOUNS_EN.id);
  
  if (existingAdj) {
    // Remove legacy word bank if it exists (no themeId causes issues with theme filtering)
    await db.wordBanks.delete(ADJECTIVES_EN.id);
  }
  
  if (existingNoun) {
    // Remove legacy word bank if it exists (no themeId causes issues with theme filtering)
    await db.wordBanks.delete(NOUNS_EN.id);
  }
}

// Import word bank from JSON/CSV
export async function importWordBank(
  data: { type: 'adjective' | 'noun'; locale: string; name: string; words: string[]; category?: string; nsfw?: boolean },
  id?: string
): Promise<string> {
  const { db } = await import('../store/db');
  
  const wordBank: WordBankData = {
    id: id || `${data.type}-${data.locale}-${Date.now()}`,
    type: data.type,
    locale: data.locale,
    name: data.name,
    words: [...new Set(data.words)], // Deduplicate
    category: data.category,
    nsfw: data.nsfw || false,
  };
  
  await db.wordBanks.add({
    ...wordBank,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  return wordBank.id;
}

// Export word bank
export async function exportWordBank(id: string): Promise<WordBankData | null> {
  const { db } = await import('../store/db');
  const bank = await db.wordBanks.get(id);
  if (!bank) return null;
  
  return {
    id: bank.id,
    type: bank.type,
    locale: bank.locale,
    name: bank.name,
    words: bank.words,
    category: bank.category,
    nsfw: bank.nsfw,
  };
}

