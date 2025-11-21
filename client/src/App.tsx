import { Routes, Route, Link } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { trackWebVitals } from './lib/performance';
import Home from './pages/Home';
import DarkModeToggle from './components/DarkModeToggle';
import Logo from './components/Logo';
import Footer from './components/Footer';
import { SkipLinks } from './components/SkipLinks';
import { Settings as SettingsIcon, Loader2 } from 'lucide-react';

// Lazy load pages for code splitting
const Settings = lazy(() => import('./pages/Settings'));
const Review = lazy(() => import('./pages/Review'));
const Mapping = lazy(() => import('./pages/Mapping'));
const ColorOptions = lazy(() => import('./pages/ColorOptions'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

function App() {
  // Initialize performance tracking
  useEffect(() => {
    trackWebVitals();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
      <SkipLinks />
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity" 
                aria-label="Renamely Home"
              >
                <Logo />
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/settings"
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                aria-label="Settings"
              >
                <SettingsIcon className="w-5 h-5" />
              </Link>
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </nav>
      
      <main id="main-content" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full flex flex-col min-h-0" tabIndex={-1}>
        <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
            <Route path="/review" element={<Review />} />
            <Route path="/mapping" element={<Mapping />} />
            <Route path="/color-options" element={<ColorOptions />} />
        </Routes>
        </Suspense>
      </main>
      
      <Footer 
        logo={<Logo />}
        strapline="Creative bulk image renaming"
      />
    </div>
  );
}

export default App;

