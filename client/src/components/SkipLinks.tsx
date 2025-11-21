/**
 * Skip links component for accessibility
 * 
 * Provides keyboard-accessible navigation links to skip to main content areas
 */

import { useCallback } from 'react';

interface SkipLink {
  /** Link text */
  label: string;
  /** Target element ID */
  targetId: string;
  /** Optional callback when link is clicked */
  onClick?: () => void;
}

interface SkipLinksProps {
  /** Additional skip links */
  links?: SkipLink[];
}

const DEFAULT_LINKS: SkipLink[] = [
  { label: 'Skip to main content', targetId: 'main-content' },
];

/**
 * SkipLinks component for accessibility
 * 
 * Renders keyboard-accessible skip links that allow users to jump to
 * main content areas, improving navigation for keyboard and screen reader users.
 * 
 * @param props - Component props
 * @returns Skip links element
 * 
 * @example
 * ```tsx
 * <SkipLinks links={[
 *   { label: 'Skip to content', targetId: 'main' },
 *   { label: 'Skip to navigation', targetId: 'nav' }
 * ]} />
 * ```
 */
export function SkipLinks({ links = DEFAULT_LINKS }: SkipLinksProps) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string, onClick?: () => void) => {
    e.preventDefault();
    
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    onClick?.();
  }, []);

  return (
    <div className="sr-only focus-within:not-sr-only">
      {links.map((link) => (
        <a
          key={link.targetId}
          href={`#${link.targetId}`}
          onClick={(e) => handleClick(e, link.targetId, link.onClick)}
          className="absolute top-4 left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded shadow-lg outline-none ring-2 ring-blue-500 ring-offset-2 focus:not-sr-only hover:bg-blue-700 transition-colors"
          aria-label={link.label}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

