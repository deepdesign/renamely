import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../features/store/slices';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { db } from '../features/store/db';
import type { Preset, Settings, WordBank, Theme } from '../features/store/db';
import { loadDefaultWordBanks } from '../features/generation/wordBanks';
import { TemplateBuilder, templatePartsToString, templateStringToParts, type TemplatePart } from '../components/TemplateBuilder';

export default function Settings() {
  const {
    settings,
    loadSettings,
    setSettings: setStoreSettings,
    themes,
    setThemes,
    addTheme,
    updateTheme,
    deleteTheme,
    presets,
    setPresets,
    wordBanks,
    setWordBanks,
    currentPreset,
    setCurrentPreset,
  } = useAppStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);
  const [localPresets, setLocalPresets] = useState<Preset[]>([]);
  const [localThemes, setLocalThemes] = useState<Theme[]>([]);
  
  // Initialize activeTab from URL params or default to 'themes'
  const getInitialTab = (): 'themes' | 'templates' | 'general' => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'themes' || tabParam === 'templates' || tabParam === 'general') {
      return tabParam;
    }
    return 'themes';
  };
  
  const [activeTab, setActiveTab] = useState<'themes' | 'templates' | 'general'>(getInitialTab());
  
  // Update URL when tab changes
  const handleTabChange = (tab: 'themes' | 'templates' | 'general') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  useEffect(() => {
    loadSettings();
    loadThemes();
    loadPresets();
    loadWordBanks();
  }, []);

  // Sync activeTab with URL params when they change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'themes' || tabParam === 'templates' || tabParam === 'general') {
      setActiveTab(tabParam);
    }
    
    // Handle editPresetId from URL
    const editPresetId = searchParams.get('editPresetId');
    if (editPresetId && tabParam === 'templates') {
      const presetToEdit = localPresets.find(p => p.id === editPresetId);
      if (presetToEdit) {
        setEditingPreset(presetToEdit);
        setShowPresetForm(true);
        // Remove editPresetId from URL to avoid reopening on re-render
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('editPresetId');
          return newParams;
        }, { replace: true });
      }
    }
  }, [searchParams, localPresets, setSearchParams]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Sort templates logically: basic patterns first, then variations
  const getPresetOrder = (preset: Preset): number => {
    // Default presets get priority ordering
    const orderMap: Record<string, number> = {
      'default-adjective-noun': 1,
      'default-adjective-adjective-noun': 2,
      'default-adjective-adjective-adjective-noun': 3,
      'default-adjective-noun-counter': 4,
      'default-adjective-noun-date': 5,
      'default-adjective-noun-date-counter': 6,
      'default-date-adjective-noun': 7,
      'default-prefix-adjective-noun': 8,
      'default-prefix-adjective-adjective-noun': 9,
      'default-adjective-noun-suffix': 10,
      'default-adjective-noun-suffix-counter': 11,
      'default-noun-adjective': 12,
    };
    
    // If it's a default preset, use the order map
    if (preset.id in orderMap) {
      return orderMap[preset.id];
    }
    
    // For custom presets, sort by number of adjectives first, then alphabetically
    // Put them after all defaults (starting at 100)
    return 100 + (preset.numAdjectives * 10) + (preset.name.charCodeAt(0) || 0);
  };

  useEffect(() => {
    const sorted = [...presets].sort((a, b) => {
      const orderA = getPresetOrder(a);
      const orderB = getPresetOrder(b);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // If same order, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
    setLocalPresets(sorted);
  }, [presets]);

  useEffect(() => {
    setLocalThemes(themes);
  }, [themes]);

  const loadThemes = async () => {
    const allThemes = await db.themes.toArray();
    setThemes(allThemes);
  };

  const loadPresets = async () => {
    const allPresets = await db.presets.toArray();
    setPresets(allPresets);
  };

  const loadWordBanks = async () => {
    const allBanks = await db.wordBanks.toArray();
    if (allBanks.length === 0) {
      await loadDefaultWordBanks();
      const updated = await db.wordBanks.toArray();
      setWordBanks(updated);
    } else {
      setWordBanks(allBanks);
    }
  };

  const handleSaveSettings = async () => {
    if (localSettings) {
      await setStoreSettings(localSettings);
    }
  };

  const handleCreatePreset = () => {
    setEditingPreset(null);
    setShowPresetForm(true);
  };

  const handleEditPreset = (preset: Preset) => {
    setEditingPreset(preset);
    setShowPresetForm(true);
  };

  const handleSavePreset = async (preset: Preset) => {
    // If editing a default template (starts with 'default-'), save as new instead of updating
    if (editingPreset && editingPreset.id.startsWith('default-')) {
      // Create a new preset with a unique ID
      const newPreset: Preset = {
        ...preset,
        id: `preset-${Date.now()}`,
        name: preset.name, // User can edit the name in the form
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await useAppStore.getState().addPreset(newPreset);
    } else if (editingPreset) {
      await useAppStore.getState().updatePreset(preset);
    } else {
      await useAppStore.getState().addPreset(preset);
    }
    setShowPresetForm(false);
    setEditingPreset(null);
    await loadPresets();
  };
  
  const handleTogglePresetVisibility = async (presetId: string) => {
    if (!localSettings) return;
    
    const currentVisible = localSettings.visiblePresetIds || [];
    const isVisible = currentVisible.includes(presetId);
    
    const newVisibleIds = isVisible
      ? currentVisible.filter(id => id !== presetId)
      : [...currentVisible, presetId];
    
    const updatedSettings = {
      ...localSettings,
      visiblePresetIds: newVisibleIds,
      updatedAt: new Date().toISOString(),
    };
    
    setLocalSettings(updatedSettings);
    await setStoreSettings(updatedSettings);
  };

  const handleDeletePreset = async (id: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      await useAppStore.getState().deletePreset(id);
      await loadPresets();
    }
  };

  const handleCreateTheme = () => {
    setEditingTheme(null);
    setShowThemeForm(true);
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setShowThemeForm(true);
  };

  const handleSaveTheme = async (theme: Theme) => {
    if (editingTheme) {
      await updateTheme(theme);
    } else {
      await addTheme(theme);
    }
    // Keep the form open with the saved theme so user can add word banks
    setEditingTheme(theme);
    await loadThemes();
  };

  const handleDeleteTheme = async (id: string) => {
    // Templates are theme-agnostic, so no need to check presets
    // Check if theme is used by any word banks
    const themeWordBanks = await db.wordBanks.where('themeId').equals(id).toArray();
    if (themeWordBanks.length > 0) {
      if (!confirm(`This theme has ${themeWordBanks.length} word bank(s). Deleting will also delete these word banks. Continue?`)) {
        return;
      }
      // Delete associated word banks
      for (const bank of themeWordBanks) {
        await db.wordBanks.delete(bank.id);
      }
    }

    if (confirm('Are you sure you want to delete this theme?')) {
      await deleteTheme(id);
      await loadThemes();
      await loadWordBanks();
    }
  };

  const navigate = useNavigate();

  if (!localSettings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const returnTo = searchParams.get('returnTo');
            const step = searchParams.get('step');
            
            if (returnTo === 'home' && step) {
              // Navigate back to home with the specific step
              navigate(`/?step=${step}`);
            } else {
              // Default: go to home
              navigate('/');
            }
          }}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col min-h-[472px]">
        {/* Settings Heading */}
        <div className="p-6 pb-0 flex-shrink-0">
          <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Settings</h1>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 flex-shrink-0">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
            <li className="me-2">
              <button
                onClick={() => handleTabChange('themes')}
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === 'themes'
                    ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
              >
                Themes
              </button>
            </li>
            <li className="me-2">
              <button
                onClick={() => handleTabChange('templates')}
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === 'templates'
                    ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
              >
                Templates
              </button>
            </li>
            <li className="me-2">
              <button
                onClick={() => handleTabChange('general')}
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === 'general'
                    ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
              >
                General
              </button>
            </li>
          </ul>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex flex-col flex-1 min-h-0">
          {/* Themes Tab */}
          {activeTab === 'themes' && (
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Themes</h2>
                <Button onClick={handleCreateTheme}>
                  <Plus className="w-4 h-4 mr-2" />
                  New theme
                </Button>
              </div>

              {showThemeForm && (
                <div className="flex-shrink-0 mb-4">
                  <ThemeForm
                    theme={editingTheme}
                    wordBanks={wordBanks}
                    onSave={async (theme) => {
                      await handleSaveTheme(theme);
                      await loadWordBanks();
                    }}
                    onCancel={async () => {
                      setShowThemeForm(false);
                      setEditingTheme(null);
                      await loadThemes();
                      await loadWordBanks();
                    }}
                  />
                </div>
              )}

              {/* Flowbite List Group Pattern */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {localThemes
                  .sort((a, b) => {
                    // Put 'universal' theme first
                    if (a.id === 'universal') return -1;
                    if (b.id === 'universal') return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((theme) => (
                    <li key={theme.id} className="py-3 sm:py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {theme.name}
                          </h3>
                          {theme.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {theme.description}
                            </p>
                          )}
                        </div>
                        <div className="inline-flex items-center gap-2 ml-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditTheme(theme)}
                            className="text-gray-900 dark:text-white hover:text-gray-900 dark:hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTheme(theme.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Templates</h2>
                <Button onClick={handleCreatePreset}>
                  <Plus className="w-4 h-4 mr-2" />
                  New template
                </Button>
              </div>

              {showPresetForm && (
                <div className="flex-shrink-0 mb-4">
                  <PresetForm
                    preset={editingPreset}
                    themes={localThemes}
                    wordBanks={wordBanks}
                    onSave={handleSavePreset}
                    onCancel={() => {
                      setShowPresetForm(false);
                      setEditingPreset(null);
                    }}
                  />
                </div>
              )}
              
              {showPresetForm && editingPreset && editingPreset.id.startsWith('default-') && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex-shrink-0">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> You are editing a default template. Saving will create a new template based on this one, leaving the original unchanged.
                  </p>
                </div>
              )}

              {/* Flowbite List Group Pattern */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {localPresets.map((preset) => {
                  // If visiblePresetIds is undefined/null/empty, all templates are visible by default
                  // Otherwise, check if this preset is in the visible list
                  const visibleIds = localSettings?.visiblePresetIds;
                  const isVisible = !visibleIds || visibleIds.length === 0 || visibleIds.includes(preset.id);
                  return (
                    <li key={preset.id} className="py-3 sm:py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => handleTogglePresetVisibility(preset.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            title="Show on template selection screen"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {preset.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {preset.template}
                            </p>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 ml-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditPreset(preset)}
                            className="text-gray-900 dark:text-white hover:text-gray-900 dark:hover:text-white"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePreset(preset.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
                </ul>
              </div>
            </div>
          )}

          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="flex flex-col min-h-0 flex-1">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex-shrink-0">General settings</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Max filename length</label>
                    <Input
                      type="number"
                      value={localSettings.maxFilenameLength}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          maxFilenameLength: parseInt(e.target.value) || 255,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="strip-diacritics"
                      checked={localSettings.stripDiacritics}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, stripDiacritics: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <label htmlFor="strip-diacritics" className="text-sm text-gray-900 dark:text-gray-100">
                      Strip diacritics
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="ascii-only"
                      checked={localSettings.asciiOnly}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, asciiOnly: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <label htmlFor="ascii-only" className="text-sm text-gray-900 dark:text-gray-100">
                      ASCII only
                    </label>
                  </div>
                </div>

                {/* Batch Rename Options */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-md font-semibold mb-4 text-gray-900 dark:text-gray-100">Batch rename options</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Destination</label>
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center text-gray-900 dark:text-gray-100">
                          <input
                            type="radio"
                            value="subfolder"
                            checked={(localSettings.renameDestinationOption || 'subfolder') === 'subfolder'}
                            onChange={(e) =>
                              setLocalSettings({
                                ...localSettings,
                                renameDestinationOption: e.target.value as 'subfolder' | 'sibling',
                              })
                            }
                            className="mr-2"
                          />
                          <span>Export new images to subfolder</span>
                        </label>
                        <label className="flex items-center text-gray-900 dark:text-gray-100">
                          <input
                            type="radio"
                            value="sibling"
                            checked={localSettings.renameDestinationOption === 'sibling'}
                            onChange={(e) =>
                              setLocalSettings({
                                ...localSettings,
                                renameDestinationOption: e.target.value as 'subfolder' | 'sibling',
                              })
                            }
                            className="mr-2"
                          />
                          <span>Move original images to sibling folder</span>
                        </label>
                      </div>
                    </div>

                    {(localSettings.renameDestinationOption || 'subfolder') === 'subfolder' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Subfolder name</label>
                        <Input
                          value={localSettings.renameSubfolderName || 'renamed'}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              renameSubfolderName: e.target.value,
                            })
                          }
                          placeholder="renamed"
                        />
                      </div>
                    )}

                    {localSettings.renameDestinationOption === 'sibling' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Sibling folder name</label>
                        <Input
                          value={localSettings.renameSiblingFolderName || 'original'}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              renameSiblingFolderName: e.target.value,
                            })
                          }
                          placeholder="original"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleSaveSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Save settings
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ThemeFormProps {
  theme: Theme | null;
  wordBanks: WordBank[];
  onSave: (theme: Theme) => Promise<void>;
  onCancel: () => void;
}

function ThemeForm({ theme, wordBanks: initialWordBanks, onSave, onCancel }: ThemeFormProps) {
  const [formData, setFormData] = useState({
    name: theme?.name || '',
    description: theme?.description || '',
  });
  
  const [savedTheme, setSavedTheme] = useState<Theme | null>(theme || null);
  const [wordBanks, setWordBanks] = useState(initialWordBanks);
  const [showWordBankForm, setShowWordBankForm] = useState(false);
  const [editingWordBank, setEditingWordBank] = useState<WordBank | null>(null);
  const { addWordBank, updateWordBank, deleteWordBank, deleteTheme } = useAppStore();
  const wasNewTheme = !theme; // Track if this was a new theme (not editing existing)

  // Listen for word bank updates
  React.useEffect(() => {
    const handleUpdate = async () => {
      const { db } = await import('../features/store/db');
      const updated = await db.wordBanks.toArray();
      setWordBanks(updated);
    };
    window.addEventListener('wordBanksUpdated', handleUpdate);
    return () => window.removeEventListener('wordBanksUpdated', handleUpdate);
  }, []);

  const themeId = savedTheme?.id || theme?.id || '';
  const themeWordBanks = themeId ? wordBanks.filter(b => b.themeId === themeId) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Theme name is required');
      return;
    }
    const newTheme: Theme = {
      id: theme?.id || `theme-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      createdAt: theme?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedTheme(newTheme);
    await onSave(newTheme);
  };

  const handleSaveWordBank = async (bank: WordBank) => {
    const currentThemeId = savedTheme?.id || theme?.id;
    if (!currentThemeId) {
      alert('Please save the theme first before adding word banks');
      return;
    }
    
    // Get theme name for auto-generating word bank name
    const { db } = await import('../features/store/db');
    const themeData = await db.themes.get(currentThemeId);
    if (!themeData) {
      alert('Theme not found');
      return;
    }
    
    // Auto-generate name: "{ThemeName} {Type}" (capitalize type)
    const typeCapitalized = bank.type === 'adjective' ? 'Adjectives' : 'Nouns';
    const autoName = `${themeData.name} ${typeCapitalized}`;
    
    const bankWithAutoName = {
      ...bank,
      themeId: currentThemeId,
      name: autoName,
    };
    
    if (editingWordBank) {
      await updateWordBank(bankWithAutoName);
    } else {
      await addWordBank(bankWithAutoName);
    }
    // Refresh word banks
    const updated = await db.wordBanks.toArray();
    setWordBanks(updated);
    setShowWordBankForm(false);
    setEditingWordBank(null);
  };

  const handleDeleteWordBank = async (id: string) => {
    if (confirm('Are you sure you want to delete this word bank?')) {
      await deleteWordBank(id);
      // Refresh word banks
      const { db } = await import('../features/store/db');
      const updated = await db.wordBanks.toArray();
      setWordBanks(updated);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Name</label>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Artistic, Nature, Urban"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Description (optional)
          </label>
          <Input
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., Creative, poetic, and aesthetic names"
          />
        </div>

        {/* Word Banks Section - show after theme is saved */}
        {(savedTheme || theme) && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">Word banks</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingWordBank(null);
                  setShowWordBankForm(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add word bank
              </Button>
            </div>

            {showWordBankForm && (
              <WordBankForm
                wordBank={editingWordBank}
                onSave={handleSaveWordBank}
                onCancel={() => {
                  setShowWordBankForm(false);
                  setEditingWordBank(null);
                }}
              />
            )}

            <div className="space-y-2 mt-4">
              {themeWordBanks.map((bank) => (
                <div
                  key={bank.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{bank.name}</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {bank.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {bank.words.length} word{bank.words.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setEditingWordBank(bank);
                        setShowWordBankForm(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => handleDeleteWordBank(bank.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {themeWordBanks.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No word banks yet. Add adjective and noun word banks to use this theme.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit">Save theme</Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={async () => {
            // If this was a new theme that was saved, we need to delete it and its word banks
            if (wasNewTheme && savedTheme && savedTheme.id) {
              // Delete all word banks associated with this theme
              const themeWordBanksToDelete = wordBanks.filter(b => b.themeId === savedTheme.id);
              for (const bank of themeWordBanksToDelete) {
                await deleteWordBank(bank.id);
              }
              // Delete the theme itself
              await deleteTheme(savedTheme.id);
            }
            onCancel();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface WordBankFormProps {
  wordBank: WordBank | null;
  onSave: (bank: WordBank) => void;
  onCancel: () => void;
}

function WordBankForm({ wordBank, onSave, onCancel }: WordBankFormProps) {
  // Note: themeId and name will be set by the parent when saving
  const [formData, setFormData] = useState<Partial<WordBank>>(
    wordBank || {
      type: 'adjective',
      locale: 'en-US',
      words: [],
      nsfw: false,
    }
  );
  const [wordsText, setWordsText] = useState(
    wordBank?.words.join('\n') || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const words = wordsText
      .split('\n')
      .map(w => w.trim())
      .filter(w => w.length > 0);
    
    if (words.length === 0) {
      alert('Please add at least one word');
      return;
    }

    const newBank: WordBank = {
      id: wordBank?.id || `wordbank-${Date.now()}`,
      themeId: wordBank?.themeId || '',
      name: wordBank?.name || '', // Will be auto-generated by parent
      type: formData.type || 'adjective',
      locale: formData.locale || 'en-US',
      words: words,
      category: formData.category?.trim(),
      nsfw: formData.nsfw || false,
      createdAt: wordBank?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(newBank);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Type</label>
            <select
              value={formData.type || 'adjective'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'adjective' | 'noun' })}
              className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-gray-900 dark:text-gray-100"
            >
              <option value="adjective">Adjective</option>
              <option value="noun">Noun</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Locale</label>
            <select
              value={formData.locale || 'en-US'}
              onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
              className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-gray-900 dark:text-gray-100"
            >
              <option value="en-GB">English (UK)</option>
              <option value="en-US">English (US)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ru">Russian</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Words (one per line)
          </label>
          <textarea
            value={wordsText}
            onChange={(e) => setWordsText(e.target.value)}
            className="w-full h-40 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 font-mono text-sm"
            placeholder="soft&#10;gentle&#10;delicate&#10;elegant"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter one word per line. Empty lines will be ignored.
          </p>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="nsfw-wordbank"
            checked={formData.nsfw || false}
            onChange={(e) => setFormData({ ...formData, nsfw: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="nsfw-wordbank" className="text-sm text-gray-900 dark:text-gray-100">
            Mark as NSFW (will be filtered if NSFW filter is enabled)
          </label>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit">Save word bank</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface PresetFormProps {
  preset: Preset | null;
  themes: Theme[];
  wordBanks: WordBank[];
  onSave: (preset: Preset) => void;
  onCancel: () => void;
}

function PresetForm({ preset, themes, wordBanks, onSave, onCancel }: PresetFormProps) {
  // Initialize template parts from preset template or default
  const initialTemplate = preset?.template || '{adjective}-{noun}';
  const [templateParts, setTemplateParts] = useState<TemplatePart[]>(() => {
    if (preset?.template) {
      return templateStringToParts(preset.template);
    }
    return templateStringToParts('{adjective}-{noun}');
  });

  const [formData, setFormData] = useState<Partial<Preset>>(
    preset || {
      template: '{adjective}-{noun}',
      delimiter: '-',
      caseStyle: 'lower',
      numAdjectives: 1,
      nsfwFilter: false,
      wordBankIds: { adjectives: [], nouns: [] },
    }
  );

  // Update template when parts or delimiter change
  useEffect(() => {
    if (templateParts.length > 0) {
      const newTemplate = templatePartsToString(templateParts, formData.delimiter || '-');
      setFormData(prev => ({ ...prev, template: newTemplate }));
      
      // Extract prefix and suffix from parts
      const prefixPart = templateParts.find(p => p.type === 'prefix');
      const suffixPart = templateParts.find(p => p.type === 'suffix');
      const datePart = templateParts.find(p => p.type === 'date');
      const counterPart = templateParts.find(p => p.type === 'counter');
      
      setFormData(prev => ({
        ...prev,
        prefix: prefixPart ? (prev.prefix || '') : undefined,
        suffix: suffixPart ? (prev.suffix || '') : undefined,
        includeDateStamp: !!datePart,
        useCounter: !!counterPart,
      }));
    }
  }, [templateParts, formData.delimiter]);

  // Allow selection from all word banks (theme-agnostic templates can use any word banks)
  const availableWordBanks = wordBanks;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (templateParts.length === 0) {
      alert('Please add at least one element to the template');
      return;
    }
    
    // Extract prefix and suffix values
    const hasPrefix = templateParts.some(p => p.type === 'prefix');
    const hasSuffix = templateParts.some(p => p.type === 'suffix');
    
    const newPreset: Preset = {
      id: preset?.id || `preset-${Date.now()}`,
      name: formData.name || 'New Preset',
      template: templatePartsToString(templateParts, formData.delimiter || '-'),
      delimiter: formData.delimiter || '-',
      caseStyle: formData.caseStyle || 'lower',
      numAdjectives: formData.numAdjectives || 1,
      prefix: hasPrefix ? (formData.prefix || '') : undefined,
      suffix: hasSuffix ? (formData.suffix || '') : undefined,
      includeDateStamp: templateParts.some(p => p.type === 'date'),
      useCounter: templateParts.some(p => p.type === 'counter'),
      counterStart: formData.counterStart || 1,
      nsfwFilter: formData.nsfwFilter || false,
      wordBankIds: {
        adjectives: availableWordBanks.filter((b) => b.type === 'adjective').map((b) => b.id),
        nouns: availableWordBanks.filter((b) => b.type === 'noun').map((b) => b.id),
      },
      createdAt: preset?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(newPreset);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Name</label>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <TemplateBuilder
            value={templateParts}
            onChange={setTemplateParts}
            numAdjectives={formData.numAdjectives || 1}
            onNumAdjectivesChange={(num) => setFormData({ ...formData, numAdjectives: num })}
            delimiter={formData.delimiter || '-'}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Delimiter</label>
            <Input
              value={formData.delimiter || '-'}
              onChange={(e) => setFormData({ ...formData, delimiter: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Case style</label>
            <select
              value={formData.caseStyle || 'lower'}
              onChange={(e) =>
                setFormData({ ...formData, caseStyle: e.target.value as Preset['caseStyle'] })
              }
              className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3"
            >
              <option value="Title">Title Case</option>
              <option value="Sentence">Sentence case</option>
              <option value="lower">lowercase</option>
              <option value="UPPER">UPPERCASE</option>
            </select>
          </div>
        </div>
        {/* Prefix and Suffix values (only shown if those elements are in template) */}
        {templateParts.some(p => p.type === 'prefix') && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Prefix Value
            </label>
            <Input
              value={formData.prefix || ''}
              onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
              placeholder="e.g., photo, img"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Text to use for the prefix element
            </p>
          </div>
        )}
        {templateParts.some(p => p.type === 'suffix') && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Suffix Value
            </label>
            <Input
              value={formData.suffix || ''}
              onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
              placeholder="e.g., img, final"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Text to use for the suffix element
            </p>
          </div>
        )}
        {templateParts.some(p => p.type === 'counter') && (
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Counter Start Value
            </label>
            <Input
              type="number"
              min="1"
              value={formData.counterStart || 1}
              onChange={(e) => setFormData({ ...formData, counterStart: parseInt(e.target.value) || 1 })}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Starting number for the counter
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
