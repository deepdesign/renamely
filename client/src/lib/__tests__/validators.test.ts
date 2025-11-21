/**
 * Unit tests for validation functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateFileSize,
  validateBatchSize,
  validateTemplate,
  validateFilePath,
  sanitizeFilename,
  validateFolderName,
  sanitizeText,
  validateWordBankEntry,
  validateMetadataField,
  validateFilenameForAPI,
  validateProductCreation,
  checkImageResolution,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_MAX_BATCH_SIZE,
} from '../validators';
import type { CreateFromTemplateBody, TemplateVariant } from '../types';

describe('validateFileSize', () => {
  it('should accept files within the size limit', () => {
    const result = validateFileSize(10 * 1024 * 1024); // 10MB
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject files exceeding the size limit', () => {
    const result = validateFileSize(100 * 1024 * 1024); // 100MB
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds');
  });

  it('should use default max size when not specified', () => {
    const result = validateFileSize(DEFAULT_MAX_FILE_SIZE + 1);
    expect(result.valid).toBe(false);
  });

  it('should accept files at exactly the limit', () => {
    const result = validateFileSize(DEFAULT_MAX_FILE_SIZE);
    expect(result.valid).toBe(true);
  });
});

describe('validateBatchSize', () => {
  it('should accept batches within the size limit', () => {
    const files = [
      { size: 10 * 1024 * 1024 },
      { size: 20 * 1024 * 1024 },
    ];
    const result = validateBatchSize(files);
    expect(result.valid).toBe(true);
  });

  it('should reject batches exceeding the size limit', () => {
    const files = Array.from({ length: 20 }, () => ({
      size: 30 * 1024 * 1024, // 30MB each
    }));
    const result = validateBatchSize(files);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds');
  });

  it('should calculate total size correctly', () => {
    const files = [
      { size: 10 * 1024 * 1024 },
      { size: 20 * 1024 * 1024 },
    ];
    const result = validateBatchSize(files);
    expect(result.totalSize).toBe(30 * 1024 * 1024);
  });
});

describe('validateTemplate', () => {
  it('should accept valid template strings', () => {
    const validTemplates = [
      '{adjective}-{noun}',
      '{adjective}-{noun}-{counter}',
      '{prefix}-{adjective}-{noun}',
    ];

    validTemplates.forEach(template => {
      const result = validateTemplate(template);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject templates with invalid placeholders', () => {
    const invalidTemplates = [
      '{invalid}',
      '{adjective}-{invalid}-{noun}',
      '{script}',
    ];

    invalidTemplates.forEach(template => {
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('placeholder');
    });
  });

  it('should reject templates that are too long', () => {
    const longTemplate = '{adjective}-'.repeat(100) + '{noun}';
    const result = validateTemplate(longTemplate);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('length');
  });

  it('should reject templates with potential code injection', () => {
    const dangerousTemplates = [
      '{adjective}<script>alert("xss")</script>',
      '{noun}${eval("malicious")}',
    ];

    dangerousTemplates.forEach(template => {
      const result = validateTemplate(template);
      expect(result.valid).toBe(false);
    });
  });
});

describe('validateFilePath', () => {
  it('should accept valid file paths', () => {
    const validPaths = [
      'folder/file.png',
      'path/to/image.jpg',
      'image.png',
    ];

    validPaths.forEach(path => {
      const result = validateFilePath(path);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject paths with directory traversal', () => {
    const dangerousPaths = [
      '../etc/passwd',
      '../../secret',
      'folder/../../../etc',
      '..\\windows\\system32',
    ];

    dangerousPaths.forEach(path => {
      const result = validateFilePath(path);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('traversal');
    });
  });

  it('should reject absolute paths', () => {
    const absolutePaths = [
      '/etc/passwd',
      'C:\\Windows\\System32',
      '/usr/local/bin',
    ];

    absolutePaths.forEach(path => {
      const result = validateFilePath(path);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('absolute');
    });
  });
});

describe('sanitizeFilename', () => {
  it('should remove dangerous characters', () => {
    const dangerous = '../file.png';
    const sanitized = sanitizeFilename(dangerous);
    expect(sanitized).not.toContain('..');
    expect(sanitized).not.toContain('/');
  });

  it('should preserve valid characters', () => {
    const valid = 'my-image-file.png';
    const sanitized = sanitizeFilename(valid);
    expect(sanitized).toBe(valid);
  });

  it('should handle special characters', () => {
    const withSpecial = 'file<>:"|?*.png';
    const sanitized = sanitizeFilename(withSpecial);
    expect(sanitized).not.toMatch(/[<>:"|?*]/);
  });

  it('should trim whitespace', () => {
    const withSpaces = '  file.png  ';
    const sanitized = sanitizeFilename(withSpaces);
    expect(sanitized).toBe('file.png');
  });
});

describe('validateFolderName', () => {
  it('should accept valid folder names', () => {
    const validNames = [
      'my-folder',
      'folder_name',
      'Folder123',
    ];

    validNames.forEach(name => {
      const result = validateFolderName(name);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject reserved names', () => {
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'LPT1',
    ];

    reservedNames.forEach(name => {
      const result = validateFolderName(name);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('reserved');
    });
  });

  it('should reject names that are too long', () => {
    const longName = 'a'.repeat(300);
    const result = validateFolderName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('length');
  });

  it('should sanitize invalid characters', () => {
    const invalid = 'folder<>:"|?*';
    const result = validateFolderName(invalid);
    if (result.valid) {
      expect(result.sanitized).not.toMatch(/[<>:"|?*]/);
    }
  });
});

describe('sanitizeText', () => {
  it('should remove HTML tags', () => {
    const withHtml = '<script>alert("xss")</script>Hello';
    const sanitized = sanitizeText(withHtml);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
    expect(sanitized).toContain('Hello');
  });

  it('should preserve plain text', () => {
    const plain = 'This is plain text';
    const sanitized = sanitizeText(plain);
    expect(sanitized).toBe(plain);
  });

  it('should handle empty strings', () => {
    const sanitized = sanitizeText('');
    expect(sanitized).toBe('');
  });
});

describe('validateWordBankEntry', () => {
  it('should accept valid words', () => {
    const validWords = ['cool', 'awesome', 'great'];
    validWords.forEach(word => {
      const result = validateWordBankEntry(word);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject words that are too long', () => {
    const longWord = 'a'.repeat(100);
    const result = validateWordBankEntry(longWord);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('length');
  });

  it('should sanitize words with invalid characters', () => {
    const withInvalid = 'word<script>';
    const result = validateWordBankEntry(withInvalid);
    if (result.valid && result.sanitized) {
      expect(result.sanitized).not.toContain('<script>');
    }
  });
});

describe('validateMetadataField', () => {
  it('should accept valid metadata', () => {
    const result = validateMetadataField('My Product Title', 'Title', 200);
    expect(result.valid).toBe(true);
  });

  it('should reject fields that are too long', () => {
    const longTitle = 'a'.repeat(300);
    const result = validateMetadataField(longTitle, 'Title', 200);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('length');
  });

  it('should sanitize HTML content', () => {
    const withHtml = '<script>alert("xss")</script>Title';
    const result = validateMetadataField(withHtml, 'Title', 200);
    if (result.valid && result.sanitized) {
      expect(result.sanitized).not.toContain('<script>');
    }
  });

  it('should handle empty strings', () => {
    const result = validateMetadataField('', 'Title', 200);
    expect(result.valid).toBe(true);
  });
});

describe('validateFilenameForAPI', () => {
  it('should accept valid filenames', () => {
    const result = validateFilenameForAPI('my-image.png');
    expect(result.valid).toBe(true);
  });

  it('should sanitize dangerous characters', () => {
    const dangerous = '../file.png';
    const result = validateFilenameForAPI(dangerous);
    if (result.valid && result.sanitized) {
      expect(result.sanitized).not.toContain('..');
      expect(result.sanitized).not.toContain('/');
    }
  });

  it('should enforce length limits', () => {
    const longName = 'a'.repeat(300) + '.png';
    const result = validateFilenameForAPI(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('length');
  });
});

describe('validateProductCreation', () => {
  const mockVariants: TemplateVariant[] = [
    {
      id: 'variant-1',
      name: 'Variant 1',
      placeholders: [
        { name: 'front', size: { width: 100, height: 150, unit: 'mm' } },
        { name: 'back', size: { width: 100, height: 150, unit: 'mm' } },
      ],
    },
    {
      id: 'variant-2',
      name: 'Variant 2',
      placeholders: [
        { name: 'cover', size: { width: 200, height: 300, unit: 'mm' } },
      ],
    },
  ];

  it('should accept valid product creation body', () => {
    const body: CreateFromTemplateBody = {
      templateId: 'template-1',
      title: 'My Product',
      description: 'Product description',
      variants: [
        {
          templateVariantId: 'variant-1',
          imagePlaceholders: [
            { name: 'front', fileUrl: 'https://example.com/front.jpg' },
            { name: 'back', fileUrl: 'https://example.com/back.jpg' },
          ],
        },
      ],
    };

    const result = validateProductCreation(body, mockVariants);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing template ID', () => {
    const body: CreateFromTemplateBody = {
      templateId: '',
      title: 'My Product',
      description: 'Product description',
      variants: [],
    };

    const result = validateProductCreation(body, mockVariants);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Template ID is required');
  });

  it('should reject missing title', () => {
    const body: CreateFromTemplateBody = {
      templateId: 'template-1',
      title: '',
      description: 'Product description',
      variants: [],
    };

    const result = validateProductCreation(body, mockVariants);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Title is required');
  });

  it('should reject missing description', () => {
    const body: CreateFromTemplateBody = {
      templateId: 'template-1',
      title: 'My Product',
      description: '',
      variants: [],
    };

    const result = validateProductCreation(body, mockVariants);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Description is required');
  });

  it('should reject empty variants array', () => {
    const body: CreateFromTemplateBody = {
      templateId: 'template-1',
      title: 'My Product',
      description: 'Product description',
      variants: [],
    };

    const result = validateProductCreation(body, mockVariants);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('At least one variant must be selected');
  });

  it('should reject variant not found in template', () => {
    const body: CreateFromTemplateBody = {
      templateId: 'template-1',
      title: 'My Product',
      description: 'Product description',
      variants: [
        {
          templateVariantId: 'non-existent',
          imagePlaceholders: [],
        },
      ],
    };

    const result = validateProductCreation(body, mockVariants);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('not found in template'))).toBe(true);
  });

  it('should reject missing placeholder assignments', () => {
    const body: CreateFromTemplateBody = {
      templateId: 'template-1',
      title: 'My Product',
      description: 'Product description',
      variants: [
        {
          templateVariantId: 'variant-1',
          imagePlaceholders: [
            { name: 'front', fileUrl: 'https://example.com/front.jpg' },
            // Missing 'back' placeholder
          ],
        },
      ],
    };

    const result = validateProductCreation(body, mockVariants);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('missing image for placeholder'))).toBe(true);
  });

  it('should reject placeholder assignment without fileUrl', () => {
    const body: CreateFromTemplateBody = {
      templateId: 'template-1',
      title: 'My Product',
      description: 'Product description',
      variants: [
        {
          templateVariantId: 'variant-1',
          imagePlaceholders: [
            { name: 'front', fileUrl: 'https://example.com/front.jpg' },
            { name: 'back', fileUrl: '' }, // Empty fileUrl
          ],
        },
      ],
    };

    const result = validateProductCreation(body, mockVariants);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('missing image for placeholder'))).toBe(true);
  });

  it('should validate multiple variants', () => {
    const body: CreateFromTemplateBody = {
      templateId: 'template-1',
      title: 'My Product',
      description: 'Product description',
      variants: [
        {
          templateVariantId: 'variant-1',
          imagePlaceholders: [
            { name: 'front', fileUrl: 'https://example.com/front.jpg' },
            { name: 'back', fileUrl: 'https://example.com/back.jpg' },
          ],
        },
        {
          templateVariantId: 'variant-2',
          imagePlaceholders: [
            { name: 'cover', fileUrl: 'https://example.com/cover.jpg' },
          ],
        },
      ],
    };

    const result = validateProductCreation(body, mockVariants);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('checkImageResolution', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should return sufficient when placeholder dimensions are not provided', async () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await checkImageResolution(file);
    expect(result.sufficient).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('should return sufficient when image meets resolution requirements', async () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const mockUrl = 'blob:http://localhost/test';
    URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
    URL.revokeObjectURL = vi.fn();

    // Create a mock image that loads successfully
    const mockImage = {
      width: 3000,
      height: 4000,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
    };

    // Mock Image constructor
    global.Image = vi.fn().mockImplementation(() => mockImage) as any;

    const checkPromise = checkImageResolution(file, 100, 150, 300);
    
    // Simulate image load
    setTimeout(() => {
      if (mockImage.onload) {
        mockImage.onload();
      }
    }, 0);

    const result = await checkPromise;
    expect(result.sufficient).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('should return insufficient when image is below resolution requirements', async () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const mockUrl = 'blob:http://localhost/test';
    URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
    URL.revokeObjectURL = vi.fn();

    // Create a mock image with insufficient resolution
    const mockImage = {
      width: 500,
      height: 600,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
    };

    global.Image = vi.fn().mockImplementation(() => mockImage) as any;

    const checkPromise = checkImageResolution(file, 100, 150, 300);
    
    // Simulate image load
    setTimeout(() => {
      if (mockImage.onload) {
        mockImage.onload();
      }
    }, 0);

    const result = await checkPromise;
    expect(result.sufficient).toBe(false);
    expect(result.warning).toContain('may be below recommended resolution');
  });

  it('should handle image load errors gracefully', async () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const mockUrl = 'blob:http://localhost/test';
    URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
    URL.revokeObjectURL = vi.fn();

    // Create a mock image that fails to load
    const mockImage = {
      width: 0,
      height: 0,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
    };

    global.Image = vi.fn().mockImplementation(() => mockImage) as any;

    const checkPromise = checkImageResolution(file, 100, 150, 300);
    
    // Simulate image error
    setTimeout(() => {
      if (mockImage.onerror) {
        mockImage.onerror();
      }
    }, 0);

    const result = await checkPromise;
    // Should not block on decode errors
    expect(result.sufficient).toBe(true);
  });

  it('should calculate required resolution correctly at different DPI', async () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const mockUrl = 'blob:http://localhost/test';
    URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
    URL.revokeObjectURL = vi.fn();

    // 100mm x 150mm at 300 DPI = ~1181 x 1772 pixels
    // 100mm x 150mm at 150 DPI = ~591 x 886 pixels
    const mockImage = {
      width: 600,
      height: 900,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
    };

    global.Image = vi.fn().mockImplementation(() => mockImage) as any;

    // At 300 DPI, should be insufficient
    const checkPromise300 = checkImageResolution(file, 100, 150, 300);
    setTimeout(() => {
      if (mockImage.onload) {
        mockImage.onload();
      }
    }, 0);
    const result300 = await checkPromise300;
    expect(result300.sufficient).toBe(false);

    // At 150 DPI, should be sufficient
    const mockImage150 = {
      ...mockImage,
      onload: null as (() => void) | null,
    };
    global.Image = vi.fn().mockImplementation(() => mockImage150) as any;
    const checkPromise150 = checkImageResolution(file, 100, 150, 150);
    setTimeout(() => {
      if (mockImage150.onload) {
        mockImage150.onload();
      }
    }, 0);
    const result150 = await checkPromise150;
    expect(result150.sufficient).toBe(true);
  });
});

