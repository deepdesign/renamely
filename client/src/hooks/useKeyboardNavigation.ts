/**
 * Custom hook for keyboard navigation
 * 
 * Provides keyboard shortcuts and navigation helpers for improved accessibility
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  /** Key combination (e.g., 'Ctrl+K', 'Escape', 'Enter') */
  key: string;
  /** Handler function */
  handler: (event: KeyboardEvent) => void;
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
  /** Whether to stop propagation */
  stopPropagation?: boolean;
  /** Whether the shortcut is enabled */
  enabled?: boolean;
}

export interface UseKeyboardNavigationOptions {
  /** Keyboard shortcuts to register */
  shortcuts?: KeyboardShortcut[];
  /** Whether to enable keyboard navigation (default: true) */
  enabled?: boolean;
  /** Element to attach listeners to (default: document) */
  target?: HTMLElement | null;
}

export interface UseKeyboardNavigationReturn {
  /** Register a new keyboard shortcut */
  registerShortcut: (shortcut: KeyboardShortcut) => () => void;
  /** Unregister all shortcuts */
  unregisterAll: () => void;
}

/**
 * Hook for keyboard navigation and shortcuts
 * 
 * @param options - Configuration options
 * @returns Keyboard navigation utilities
 * 
 * @example
 * ```typescript
 * useKeyboardNavigation({
 *   shortcuts: [
 *     {
 *       key: 'Escape',
 *       handler: () => closeModal(),
 *       preventDefault: true,
 *     },
 *     {
 *       key: 'Ctrl+S',
 *       handler: () => save(),
 *       preventDefault: true,
 *     },
 *   ],
 * });
 * ```
 */
export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions = {}
): UseKeyboardNavigationReturn {
  const { shortcuts = [], enabled = true, target } = options;
  const shortcutsRef = useRef<Map<string, KeyboardShortcut>>(new Map());
  const handlersRef = useRef<Map<string, (event: KeyboardEvent) => void>>(new Map());

  // Parse key combination
  const parseKey = useCallback((key: string): { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } => {
    const parts = key.toLowerCase().split('+').map((p) => p.trim());
    const result: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } = {
      key: parts[parts.length - 1] || '',
    };

    for (let i = 0; i < parts.length - 1; i++) {
      const modifier = parts[i];
      if (modifier === 'ctrl' || modifier === 'control') {
        result.ctrl = true;
      } else if (modifier === 'shift') {
        result.shift = true;
      } else if (modifier === 'alt') {
        result.alt = true;
      } else if (modifier === 'meta' || modifier === 'cmd') {
        result.meta = true;
      }
    }

    return result;
  }, []);

  // Check if key combination matches
  const matchesKey = useCallback(
    (event: KeyboardEvent, parsed: ReturnType<typeof parseKey>): boolean => {
      const eventKey = event.key.toLowerCase();
      const targetKey = parsed.key.toLowerCase();

      // Special key mappings
      const keyMap: Record<string, string> = {
        ' ': 'space',
        'arrowup': 'up',
        'arrowdown': 'down',
        'arrowleft': 'left',
        'arrowright': 'right',
      };

      const normalizedEventKey = keyMap[eventKey] || eventKey;
      const normalizedTargetKey = keyMap[targetKey] || targetKey;

      if (normalizedEventKey !== normalizedTargetKey) {
        return false;
      }

      if (parsed.ctrl && !event.ctrlKey) return false;
      if (parsed.shift && !event.shiftKey) return false;
      if (parsed.alt && !event.altKey) return false;
      if (parsed.meta && !event.metaKey) return false;

      // Check that no unrequested modifiers are pressed
      if (!parsed.ctrl && event.ctrlKey) return false;
      if (!parsed.shift && event.shiftKey) return false;
      if (!parsed.alt && event.altKey) return false;
      if (!parsed.meta && event.metaKey) return false;

      return true;
    },
    []
  );

  // Create handler for a shortcut
  const createHandler = useCallback(
    (shortcut: KeyboardShortcut) => {
      const parsed = parseKey(shortcut.key);
      return (event: KeyboardEvent) => {
        if (!shortcut.enabled !== false && matchesKey(event, parsed)) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          if (shortcut.stopPropagation) {
            event.stopPropagation();
          }
          shortcut.handler(event);
        }
      };
    },
    [parseKey, matchesKey]
  );

  // Register shortcuts
  useEffect(() => {
    if (!enabled) return;

    const element = target || document;
    const registeredHandlers: Array<() => void> = [];

    shortcuts.forEach((shortcut) => {
      const handler = createHandler(shortcut);
      shortcutsRef.current.set(shortcut.key, shortcut);
      handlersRef.current.set(shortcut.key, handler);
      element.addEventListener('keydown', handler);
      registeredHandlers.push(() => {
        element.removeEventListener('keydown', handler);
      });
    });

    return () => {
      registeredHandlers.forEach((unregister) => unregister());
      shortcutsRef.current.clear();
      handlersRef.current.clear();
    };
  }, [shortcuts, enabled, target, createHandler]);

  const registerShortcut = useCallback(
    (shortcut: KeyboardShortcut) => {
      const handler = createHandler(shortcut);
      const element = target || document;
      shortcutsRef.current.set(shortcut.key, shortcut);
      handlersRef.current.set(shortcut.key, handler);
      element.addEventListener('keydown', handler);

      return () => {
        element.removeEventListener('keydown', handler);
        shortcutsRef.current.delete(shortcut.key);
        handlersRef.current.delete(shortcut.key);
      };
    },
    [target, createHandler]
  );

  const unregisterAll = useCallback(() => {
    const element = target || document;
    handlersRef.current.forEach((handler) => {
      element.removeEventListener('keydown', handler);
    });
    shortcutsRef.current.clear();
    handlersRef.current.clear();
  }, [target]);

  return {
    registerShortcut,
    unregisterAll,
  };
}

/**
 * Hook for focus management
 */
export function useFocusManagement() {
  const focusableElementsRef = useRef<HTMLElement[]>([]);

  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(selectors));
  }, []);

  const trapFocus = useCallback(
    (container: HTMLElement, firstElement?: HTMLElement, lastElement?: HTMLElement) => {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const first = firstElement || focusableElements[0];
      const last = lastElement || focusableElements[focusableElements.length - 1];

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      container.addEventListener('keydown', handleTab);
      first.focus();

      return () => {
        container.removeEventListener('keydown', handleTab);
      };
    },
    [getFocusableElements]
  );

  const restoreFocus = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  }, []);

  return {
    trapFocus,
    restoreFocus,
    getFocusableElements,
  };
}

