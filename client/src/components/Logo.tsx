import { useEffect, useState } from 'react';

export default function Logo() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const isDarkMode =
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('color-theme') === 'dark' ||
        (!('color-theme' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(isDarkMode);
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Listen for storage changes (when theme is toggled)
    const handleStorageChange = () => {
      checkTheme();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <img
      src={isDark ? '/renamely-logo-dark.svg' : '/renamely-logo-light.svg'}
      alt="Renamely - creative bulk image renaming"
      className="h-8 w-auto"
    />
  );
}
