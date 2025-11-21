/**
 * Validation and sanitization utilities
 * 
 * This module provides comprehensive validation and sanitization functions
 * for user inputs, file operations, and API payloads to ensure security
 * and data integrity.
 */

import type { CreateFromTemplateBody, TemplateVariant } from './types';

/**
 * Validates a product creation request body before API submission
 * 
 * Checks that all required fields are present and that each variant
 * has all required placeholder images assigned. This prevents invalid
 * API requests and provides clear error messages.
 * 
 * @param body - The product creation request body to validate
 * @param variants - Available template variants for validation
 * @returns Object with `valid` boolean and array of error messages
 * 
 * @example
 * ```typescript
 * const result = validateProductCreation(requestBody, templateVariants);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateProductCreation(
  body: CreateFromTemplateBody,
  variants: TemplateVariant[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.templateId) {
    errors.push('Template ID is required');
  }

  if (!body.title || body.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!body.description || body.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!body.variants || body.variants.length === 0) {
    errors.push('At least one variant must be selected');
  }

  // Validate each variant has all required placeholders
  for (const variant of body.variants) {
    const templateVariant = variants.find(v => v.id === variant.templateVariantId);
    if (!templateVariant) {
      errors.push(`Variant ${variant.templateVariantId} not found in template`);
      continue;
    }

    for (const placeholder of templateVariant.placeholders) {
      const assignment = variant.imagePlaceholders.find(
        p => p.name === placeholder.name
      );
      if (!assignment || !assignment.fileUrl) {
        errors.push(
          `Variant ${templateVariant.name || variant.templateVariantId} missing image for placeholder "${placeholder.name}"`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if an image file meets the required resolution for a placeholder
 * 
 * Loads the image and compares its dimensions against the required resolution
 * at the specified DPI. Converts placeholder dimensions from millimeters to
 * pixels for comparison.
 * 
 * @param file - The image file to check
 * @param placeholderWidth - Required width in millimeters (optional)
 * @param placeholderHeight - Required height in millimeters (optional)
 * @param dpi - Dots per inch for resolution calculation (default: 300)
 * @returns Promise resolving to object with `sufficient` boolean and optional warning message
 * 
 * @example
 * ```typescript
 * const result = await checkImageResolution(imageFile, 100, 150, 300);
 * if (!result.sufficient) {
 *   console.warn(result.warning); // "Image (500x600px) may be below recommended resolution..."
 * }
 * ```
 */
export async function checkImageResolution(
  file: File,
  placeholderWidth?: number,
  placeholderHeight?: number,
  dpi: number = 300
): Promise<{ sufficient: boolean; warning?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      if (!placeholderWidth || !placeholderHeight) {
        resolve({ sufficient: true });
        return;
      }

      // Convert placeholder size to pixels at specified DPI
      const requiredWidth = Math.ceil((placeholderWidth / 25.4) * dpi); // mm to inches, then DPI
      const requiredHeight = Math.ceil((placeholderHeight / 25.4) * dpi);

      const sufficient = img.width >= requiredWidth && img.height >= requiredHeight;
      
      if (!sufficient) {
        resolve({
          sufficient: false,
          warning: `Image (${img.width}x${img.height}px) may be below recommended resolution (${requiredWidth}x${requiredHeight}px at ${dpi} DPI)`,
        });
      } else {
        resolve({ sufficient: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ sufficient: true }); // Don't block on decode errors
    };

    img.src = url;
  });
}

export function generateCSV(results: Array<{
  templateId: string;
  status: string;
  productId?: string;
  previewUrl?: string;
  adminUrl?: string;
  error?: string;
}>): string {
  const headers = ['Template ID', 'Status', 'Product ID', 'Preview URL', 'Admin URL', 'Error'];
  const rows = results.map(r => [
    r.templateId,
    r.status,
    r.productId || '',
    r.previewUrl || '',
    r.adminUrl || '',
    r.error || '',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csv;
}

export function downloadCSV(csv: string, filename: string = 'gelato-upload-results.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// File size validation constants
export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
export const DEFAULT_MAX_BATCH_SIZE = 500 * 1024 * 1024; // 500MB in bytes

/**
 * Validate file size against limits
 */
export function validateFileSize(
  file: File,
  maxSize: number = DEFAULT_MAX_FILE_SIZE
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File "${file.name}" is too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB.`,
    };
  }
  
  if (file.size === 0) {
    return {
      valid: false,
      error: `File "${file.name}" is empty.`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate total batch size
 */
export function validateBatchSize(
  files: File[],
  maxBatchSize: number = DEFAULT_MAX_BATCH_SIZE
): { valid: boolean; error?: string; totalSize: number } {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  
  if (totalSize > maxBatchSize) {
    const maxBatchSizeMB = (maxBatchSize / (1024 * 1024)).toFixed(1);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Total batch size (${totalSizeMB}MB) exceeds maximum (${maxBatchSizeMB}MB). Please reduce the number of files.`,
      totalSize,
    };
  }
  
  return { valid: true, totalSize };
}

/**
 * Validate template string for placeholder syntax and security
 */
export function validateTemplate(template: string): { valid: boolean; error?: string } {
  if (!template || typeof template !== 'string') {
    return { valid: false, error: 'Template must be a non-empty string' };
  }
  
  // Check length limit (prevent extremely long templates)
  const MAX_TEMPLATE_LENGTH = 1000;
  if (template.length > MAX_TEMPLATE_LENGTH) {
    return {
      valid: false,
      error: `Template is too long (${template.length} characters). Maximum length is ${MAX_TEMPLATE_LENGTH} characters.`,
    };
  }
  
  // Check for valid placeholder syntax: {placeholderName}
  // Allow only alphanumeric characters and underscores in placeholder names
  const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;
  const invalidPlaceholderRegex = /\{[^}]+\}/g;
  
  // Find all placeholders
  const matches = template.match(placeholderRegex);
  const invalidMatches = template.match(invalidPlaceholderRegex);
  
  // Check if there are any invalid placeholders (with special characters)
  if (invalidMatches && invalidMatches.length > 0) {
    const invalidPlaceholders = invalidMatches.filter(m => !placeholderRegex.test(m));
    if (invalidPlaceholders.length > 0) {
      return {
        valid: false,
        error: `Invalid placeholder syntax: ${invalidPlaceholders.join(', ')}. Placeholders must match {placeholderName} format with only letters, numbers, and underscores.`,
      };
    }
  }
  
  // Check for potential code injection patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /eval\s*\(/i,
    /function\s*\(/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(template)) {
      return {
        valid: false,
        error: 'Template contains potentially dangerous content. Please use only safe placeholder syntax.',
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validate file path to prevent directory traversal attacks
 */
export function validateFilePath(path: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'Path must be a non-empty string' };
  }
  
  // Check for directory traversal patterns
  const traversalPatterns = [
    /\.\.\//g,  // ../
    /\.\.\\/g,  // ..\
    /\.\./g,    // .. (in any context)
  ];
  
  for (const pattern of traversalPatterns) {
    if (pattern.test(path)) {
      return {
        valid: false,
        error: 'Path contains directory traversal patterns (../). This is not allowed for security reasons.',
      };
    }
  }
  
  // Check for absolute paths (Windows and Unix)
  if (path.startsWith('/') || /^[A-Za-z]:\\/.test(path)) {
    return {
      valid: false,
      error: 'Absolute paths are not allowed. Please use relative paths only.',
    };
  }
  
  // Check for null bytes (potential path injection)
  if (path.includes('\0')) {
    return {
      valid: false,
      error: 'Path contains invalid characters (null bytes).',
    };
  }
  
  // Sanitize: remove leading/trailing slashes and normalize separators
  let sanitized = path
    .replace(/^[/\\]+|[/\\]+$/g, '') // Remove leading/trailing slashes
    .replace(/[/\\]+/g, '/') // Normalize separators to forward slashes
    .trim();
  
  // Validate path components
  const components = sanitized.split('/');
  for (const component of components) {
    if (component === '' || component === '.') {
      continue; // Allow empty components and current directory
    }
    
    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reservedNames.includes(component.toUpperCase())) {
      return {
        valid: false,
        error: `Path contains reserved name: ${component}`,
      };
    }
    
    // Check for invalid characters in path components
    const invalidChars = /[<>:"|?*\x00-\x1F]/;
    if (invalidChars.test(component)) {
      return {
        valid: false,
        error: `Path component "${component}" contains invalid characters.`,
      };
    }
  }
  
  return { valid: true, sanitized };
}

/**
 * Sanitize filename to remove dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }
  
  // Remove or replace dangerous characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .trim();
  
  // Ensure it's not empty after sanitization
  if (!sanitized) {
    sanitized = 'unnamed';
  }
  
  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const baseName = sanitized.split('.')[0].toUpperCase();
  if (reservedNames.includes(baseName)) {
    sanitized = `_${sanitized}`;
  }
  
  return sanitized;
}

/**
 * Validate and sanitize folder name
 */
export function validateFolderName(name: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Folder name must be a non-empty string' };
  }
  
  // Remove path separators (take only the last segment if present)
  const sanitized = name.split(/[/\\]/).filter(Boolean).pop() || name;
  
  if (!sanitized || sanitized.trim() === '') {
    return { valid: false, error: 'Folder name cannot be empty' };
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
  if (invalidChars.test(sanitized)) {
    return {
      valid: false,
      error: 'Folder name contains invalid characters',
    };
  }
  
  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(sanitized.toUpperCase())) {
    return {
      valid: false,
      error: `"${sanitized}" is a reserved name and cannot be used as a folder name`,
    };
  }
  
  // Check length (Windows max path component is 255 characters)
  if (sanitized.length > 255) {
    return {
      valid: false,
      error: `Folder name is too long (${sanitized.length} characters). Maximum length is 255 characters.`,
    };
  }
  
  return { valid: true, sanitized };
}

/**
 * Sanitize text input to prevent XSS
 */
export function sanitizeText(text: string, maxLength?: number): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous HTML/script tags
  let sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick=, etc.)
    .trim();
  
  // Apply length limit if provided
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validate word bank entry
 */
export function validateWordBankEntry(word: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!word || typeof word !== 'string') {
    return { valid: false, error: 'Word must be a non-empty string' };
  }
  
  // Sanitize the word
  const sanitized = sanitizeText(word, 100); // Max 100 characters per word
  
  if (!sanitized || sanitized.trim().length === 0) {
    return { valid: false, error: 'Word cannot be empty after sanitization' };
  }
  
  // Check for only whitespace
  if (sanitized.trim().length === 0) {
    return { valid: false, error: 'Word cannot be only whitespace' };
  }
  
  // Check length (reasonable limit for a single word)
  if (sanitized.length > 100) {
    return { valid: false, error: 'Word is too long (maximum 100 characters)' };
  }
  
  // Check for invalid characters (allow letters, numbers, spaces, hyphens, apostrophes)
  const validWordPattern = /^[a-zA-Z0-9\s\-']+$/;
  if (!validWordPattern.test(sanitized)) {
    return { valid: false, error: 'Word contains invalid characters. Only letters, numbers, spaces, hyphens, and apostrophes are allowed.' };
  }
  
  return { valid: true, sanitized };
}

/**
 * Validate metadata fields (title, description)
 */
export function validateMetadataField(
  field: string,
  fieldName: string,
  maxLength: number = 1000
): { valid: boolean; error?: string; sanitized?: string } {
  if (typeof field !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  
  // Sanitize the field
  const sanitized = sanitizeText(field, maxLength);
  
  // Check length
  if (sanitized.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} is too long (maximum ${maxLength} characters)`,
    };
  }
  
  return { valid: true, sanitized };
}

/**
 * Valid image MIME types
 */
const VALID_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/tiff',
  'image/gif',
  'image/heic',
  'image/heif',
]);

/**
 * Validate file type by MIME type (more secure than extension check alone)
 */
export function validateFileType(file: File): { valid: boolean; error?: string } {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'Invalid file object' };
  }
  
  // Check MIME type first (more reliable)
  if (file.type) {
    const mimeType = file.type.toLowerCase();
    if (VALID_IMAGE_MIME_TYPES.has(mimeType)) {
      return { valid: true };
    }
    
    // Some browsers may not report MIME type correctly, so we also check extension
    // But if MIME type is present and doesn't match, that's suspicious
    if (mimeType && !mimeType.startsWith('image/')) {
      return {
        valid: false,
        error: `File "${file.name}" has invalid MIME type: ${mimeType}. Expected an image file.`,
      };
    }
  }
  
  // Fallback: check extension if MIME type is not available
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.heic', '.gif'];
  
  if (!validExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File "${file.name}" has invalid extension: ${ext}. Expected an image file.`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate filename before API submission
 */
export function validateFilenameForAPI(filename: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Filename must be a non-empty string' };
  }
  
  // Sanitize the filename
  const sanitized = sanitizeFilename(filename);
  
  // Check length (reasonable limit for API)
  if (sanitized.length > 255) {
    return {
      valid: false,
      error: `Filename is too long (${sanitized.length} characters). Maximum length is 255 characters.`,
    };
  }
  
  // Check for empty filename after sanitization
  if (!sanitized || sanitized.trim().length === 0) {
    return {
      valid: false,
      error: 'Filename cannot be empty after sanitization',
    };
  }
  
  return { valid: true, sanitized };
}
