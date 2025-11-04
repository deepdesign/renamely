import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Check, X, Edit2 } from 'lucide-react';
import type { ImageFile } from '../features/store/slices';
import { validateFilename } from '../features/generation/engine';
import { cn } from '../lib/utils';

interface NameCellProps {
  image: ImageFile;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onNameChange: (newName: string) => void;
}

export function NameCell({
  image,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onNameChange,
}: NameCellProps) {
  const [editValue, setEditValue] = useState(image.currentName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(image.currentName);
  }, [image.currentName]);

  const handleSave = () => {
    const validationError = validateFilename(editValue, image.extension, 255);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check for duplicates (would need to check against other images)
    // For now, just save
    onNameChange(editValue);
    setError(null);
  };

  const handleCancel = () => {
    setEditValue(image.currentName);
    setError(null);
    onCancelEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              error && 'border-red-500 focus:ring-red-500'
            )}
          />
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          title="Save (Enter)"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          title="Cancel (Esc)"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
        {image.currentName}
        <span className="text-gray-500 dark:text-gray-500">
          {image.extension}
        </span>
      </span>
      <div className="w-8 h-8 flex items-center justify-center">
        {!image.locked && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit();
            }}
            title="Edit name"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      {image.error && (
        <span className="text-xs text-red-600 dark:text-red-400">
          {image.error}
        </span>
      )}
    </div>
  );
}

