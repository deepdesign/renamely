import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';

export type TemplateElement = 'prefix' | 'adjective' | 'noun' | 'suffix' | 'date' | 'counter';

export interface TemplatePart {
  id: string;
  type: TemplateElement;
}

interface TemplateBuilderProps {
  value: TemplatePart[];
  onChange: (parts: TemplatePart[]) => void;
  numAdjectives: number;
  onNumAdjectivesChange: (num: number) => void;
  delimiter?: string;
}

export function TemplateBuilder({ value, onChange, numAdjectives, onNumAdjectivesChange, delimiter = '-' }: TemplateBuilderProps) {
  const [parts, setParts] = useState<TemplatePart[]>(value || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setParts(value || []);
  }, [value]);

  const handleAdd = (type: TemplateElement) => {
    const newPart: TemplatePart = {
      id: `part-${Date.now()}-${Math.random()}`,
      type,
    };
    const updated = [...parts, newPart];
    setParts(updated);
    onChange(updated);
  };

  const handleRemove = (id: string) => {
    const updated = parts.filter(p => p.id !== id);
    setParts(updated);
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === parts.length - 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...parts];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setParts(updated);
    onChange(updated);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    // Add a slight delay to make the drag feel more responsive
    setTimeout(() => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    const updated = [...parts];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, removed);
    
    setParts(updated);
    onChange(updated);
    setDraggedIndex(null);
  };

  const getElementLabel = (type: TemplateElement): string => {
    switch (type) {
      case 'prefix': return 'Prefix';
      case 'adjective': return `Adjective${numAdjectives > 1 ? ` (x${numAdjectives})` : ''}`;
      case 'noun': return 'Noun';
      case 'suffix': return 'Suffix';
      case 'date': return 'Date';
      case 'counter': return 'Counter';
      default: return type;
    }
  };

  const getElementColor = (type: TemplateElement): string => {
    switch (type) {
      case 'prefix': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'adjective': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'noun': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'suffix': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
      case 'date': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      case 'counter': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const availableElements: TemplateElement[] = ['prefix', 'adjective', 'noun', 'suffix', 'date', 'counter'];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          Template Builder
        </label>
        
        {/* Template Preview */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            {parts.length === 0 ? (
              <span className="text-sm text-gray-400 dark:text-gray-500 italic">No elements added yet</span>
            ) : (
              parts.map((part, index) => (
                <React.Fragment key={part.id}>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getElementColor(part.type)}`}>
                    {getElementLabel(part.type)}
                  </span>
                  {index < parts.length - 1 && (
                    <span className="text-gray-400 dark:text-gray-500">{delimiter}</span>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        {/* Template Parts List */}
        <div className="space-y-2 mb-4">
          {parts.map((part, index) => (
            <div
              key={part.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center gap-2 p-2 border rounded bg-white dark:bg-gray-800 transition-all ${
                draggedIndex === index
                  ? 'opacity-50 border-blue-400 dark:border-blue-500'
                  : dragOverIndex === index
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700'
              } cursor-move hover:border-gray-300 dark:hover:border-gray-600`}
            >
              <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing" />
              <span className={`px-3 py-1 rounded text-sm font-medium flex-1 ${getElementColor(part.type)}`}>
                {getElementLabel(part.type)}
              </span>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(index, 'up');
                  }}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMove(index, 'down');
                  }}
                  disabled={index === parts.length - 1}
                  className="h-8 w-8 p-0"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(part.id);
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Element Dropdown */}
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAdd(e.target.value as TemplateElement);
                e.target.value = ''; // Reset dropdown
              }
            }}
            className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-gray-900 dark:text-gray-100"
            defaultValue=""
          >
            <option value="">Add element...</option>
            {availableElements.map((element) => (
              <option key={element} value={element}>
                {getElementLabel(element)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert template parts to template string
export function templatePartsToString(parts: TemplatePart[], delimiter: string = '-'): string {
  return parts.map(part => {
    switch (part.type) {
      case 'prefix': return '{prefix}';
      case 'adjective': return '{adjective}';
      case 'noun': return '{noun}';
      case 'suffix': return '{suffix}';
      case 'date': return '{date}';
      case 'counter': return '{counter}';
      default: return '';
    }
  }).filter(Boolean).join(delimiter);
}

// Helper function to parse template string to parts
export function templateStringToParts(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  const regex = /\{(prefix|adjective|noun|suffix|date|counter)\}/g;
  let match;
  let idCounter = 0;

  while ((match = regex.exec(template)) !== null) {
    parts.push({
      id: `part-${idCounter++}`,
      type: match[1] as TemplateElement,
    });
  }

  return parts;
}

