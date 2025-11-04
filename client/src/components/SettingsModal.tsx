import React from 'react';
import { useAppStore } from '../features/store/slices';
import Settings from '../pages/Settings';
import { X } from 'lucide-react';
import { Button } from './ui/Button';

export function SettingsModal() {
  const { showSettings, setShowSettings } = useAppStore();

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setShowSettings(false)}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-6">
            <Settings />
          </div>
        </div>
      </div>
    </div>
  );
}

