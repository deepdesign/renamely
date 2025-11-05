import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode =
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('color-theme') === 'dark' ||
        (!('color-theme' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(isDarkMode);
    };

    checkTheme();

    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <footer className="bg-white rounded-lg shadow-sm m-4 dark:bg-gray-900">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo and Strapline */}
          <div>
            <Link to="/" className="flex items-center mb-4">
              <Logo />
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Creative bulk image renaming
            </p>
          </div>

          {/* Other Projects Section */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase dark:text-white">
              Projects
            </h2>
            <ul className="flex flex-wrap gap-4 items-center">
              <li>
                <a
                  href="https://github.com/deepdesign/renamely"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  aria-label="Renamely"
                >
                  <img
                    src={isDark ? '/_other logos/renamely-circle-dark.svg' : '/_other logos/renamely-circle-light.svg'}
                    alt="Renamely"
                    className="h-[40px] w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/deepdesign/podmate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  aria-label="Podmate"
                >
                  <img
                    src={isDark ? '/_other logos/podmate-circle-dark.svg' : '/_other logos/podmate-circle-light.svg'}
                    alt="Podmate"
                    className="h-[40px] w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </a>
              </li>
              <li>
                <a
                  href="https://walljazzle.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  aria-label="Walljazzle"
                >
                  <img
                    src={isDark ? '/_other logos/walljazzle-circle-dark.svg' : '/_other logos/walljazzle-circle-light.svg'}
                    alt="Walljazzle"
                    className="h-[40px] w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </a>
              </li>
              <li>
                <a
                  href="https://www.waxvalue.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  aria-label="Waxvalue"
                >
                  <img
                    src={isDark ? '/_other logos/waxvalue-circle-dark.svg' : '/_other logos/waxvalue-circle-light.svg'}
                    alt="Waxvalue"
                    className="h-[40px] w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase dark:text-white">
              Contact
            </h2>
            <ul className="flex flex-wrap gap-4 items-center">
              <li>
                <a
                  href="https://jamescutts.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  aria-label="JC Logo"
                >
                  <img
                    src={isDark ? '/_other logos/jc-logo-dark.svg' : '/_other logos/jc-logo-light.svg'}
                    alt="JC"
                    className="h-[40px] w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/deepdesign"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <img
                    src={isDark ? '/_other logos/github-mark-dark.svg' : '/_other logos/github-mark-light.svg'}
                    alt="GitHub"
                    className="h-[40px] w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider and Copyright */}
        <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            © {new Date().getFullYear()}{' '}
            <a
              href="https://jamescutts.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Deep Design Pty Ltd
            </a>
            . All Rights Reserved.
          </span>
          <div className="flex mt-4 sm:justify-center sm:mt-0">
            <ul className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              <li>
                <Link to="/settings" className="hover:underline">
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
