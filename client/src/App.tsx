import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Settings from './pages/Settings';
import DarkModeToggle from './components/DarkModeToggle';
import Logo from './components/Logo';
import { Settings as SettingsIcon } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 min-h-[calc(100vh-4rem)] flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

