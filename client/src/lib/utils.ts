/**
 * Converts a string to Headline Case (Title Case)
 * Capitalizes the first letter of each word
 * Handles hyphens, underscores, and spaces
 */
export function toHeadlineCase(str: string): string {
  if (!str) return '';
  
  return str
    // Split on hyphens, underscores, spaces, and dots
    .split(/[-\s_.]+/)
    // Capitalize first letter of each word, lowercase the rest
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    // Join with spaces (removes hyphens/underscores for cleaner titles)
    .join(' ')
    .trim();
}

