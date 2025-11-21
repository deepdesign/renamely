/**
 * Custom hooks exports
 * 
 * Centralized export point for all custom hooks
 */

export { useErrorHandling } from './useErrorHandling';
export type { UseErrorHandlingReturn } from './useErrorHandling';

export { useFileSystem } from './useFileSystem';
export type { UseFileSystemReturn } from './useFileSystem';

export { useNameGeneration } from './useNameGeneration';
export type { UseNameGenerationReturn } from './useNameGeneration';

export { useKeyboardNavigation, useFocusManagement } from './useKeyboardNavigation';
export type {
  UseKeyboardNavigationReturn,
  KeyboardShortcut,
  UseKeyboardNavigationOptions,
} from './useKeyboardNavigation';

export { useTemplateManagement } from './useTemplateManagement';
export type { UseTemplateManagementReturn } from './useTemplateManagement';

