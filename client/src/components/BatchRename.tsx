import React, { useState, useCallback } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { FolderPlus, ArrowRight, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../features/store/slices';
import { createDirectory, moveFile, renameFile, selectDirectory } from '../features/files/fs-api';
import { db } from '../features/store/db';
import type { AuditEntry, AuditBatch } from '../features/store/db';
import { registerName } from '../features/generation/engine';

interface BatchRenameProps {
  onComplete?: () => void;
}

export function BatchRename({ onComplete }: BatchRenameProps) {
  const {
    images,
    selectedDirectory,
    setSelectedDirectory,
    isProcessing,
    setProcessing,
    setProgress,
    addError,
    clearErrors,
    addAuditBatch,
    setLastBatchId,
    addUsedName,
    errors,
  } = useAppStore();

  const [destinationOption, setDestinationOption] = useState<'subfolder' | 'sibling'>('subfolder');
  const [subfolderName, setSubfolderName] = useState('renamed');
  const [siblingFolderName, setSiblingFolderName] = useState('original');
  const [dryRun, setDryRun] = useState(false);

  const handleRename = useCallback(async () => {
    console.log('handleRename called', { imagesCount: images.length, selectedDirectory: !!selectedDirectory });
    
    if (images.length === 0) {
      console.log('No images to rename');
      addError('', 'No images selected. Please go back to step 1 to select images.');
      return;
    }

    // Check if images have current names
    const imagesWithoutNames = images.filter(img => !img.currentName);
    if (imagesWithoutNames.length > 0) {
      console.log('Some images missing currentName', imagesWithoutNames);
      addError('', `${imagesWithoutNames.length} image(s) have no generated name. Please go back to step 4 (Review & edit) to generate names.`);
      return;
    }

    // Check if we can rename in place (have file handles with move() support)
    const hasFileHandles = images.every(img => img.fileHandle);
    const canRenameInPlace = hasFileHandles && images.some(img => img.fileHandle && 'move' in img.fileHandle);
    
    // Determine if we need a destination directory
    let workingDirectory: FileSystemDirectoryHandle | null = selectedDirectory;
    
    // If no directory is selected but we need one for destination folder, prompt user
    if (!selectedDirectory && !canRenameInPlace) {
      console.log('No directory selected - need to prompt for destination');
      try {
        setProcessing(true);
        clearErrors();
        const destDir = await selectDirectory();
        if (!destDir) {
          addError('', 'Destination folder selection cancelled. Please select a folder to create the destination subfolder.');
          setProcessing(false);
          return;
        }
        workingDirectory = destDir;
        // Update the store with the selected directory
        setSelectedDirectory(destDir);
      } catch (err: any) {
        addError('', `Failed to select destination folder: ${err.message}`);
        setProcessing(false);
        return;
      }
    }

    try {
      console.log('Starting rename process...');
      setProcessing(true);
      clearErrors();

      const batchId = `batch-${Date.now()}`;
      const entries: AuditEntry[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Create destination directory (only if we have a working directory)
      let destinationDir: FileSystemDirectoryHandle | null = null;
      if (workingDirectory) {
        if (destinationOption === 'subfolder') {
          destinationDir = await createDirectory(workingDirectory, subfolderName);
        } else {
          // Create sibling folder
          // Note: File System Access API doesn't easily support parent directory access
          // This is a simplified version - in practice, you'd need to track parent
          destinationDir = await createDirectory(workingDirectory, siblingFolderName);
        }
      }

      // Process each image
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setProgress(i + 1, images.length);

        // Skip locked files - they keep their original name
        if (image.locked) {
          entries.push({
            oldPath: image.path,
            oldName: image.originalName,
            newPath: image.path,
            newName: image.originalName,
            status: 'success',
            timestamp: new Date().toISOString(),
          });
          continue;
        }

        try {
          // Check if image has a current name (should be set during name generation)
          if (!image.currentName) {
            throw new Error(`Image "${image.originalName}" has no generated name. Please go back to step 4 to generate names.`);
          }

          const newName = `${image.currentName}${image.extension}`;
          const oldPath = image.path;
          let newPath = oldPath;

          if (!dryRun) {
            // Register name in both session and persistent ledger
            const fullSlug = `${image.currentName}${image.extension}`;
            addUsedName(fullSlug);
            await registerName(image.currentName, undefined, undefined, image.extension);

            // If we have a file handle with move() support and no destination directory, rename in place
            if (image.fileHandle && !destinationDir && 'move' in image.fileHandle) {
              try {
                await renameFile(image.fileHandle, newName);
                newPath = image.path.replace(image.originalName, newName);
              } catch (renameErr: any) {
                throw new Error(`Failed to rename file: ${renameErr.message}`);
              }
            } else if (destinationDir && image.fileHandle) {
              // Move to destination directory if we have one
              await moveFile(image.fileHandle, destinationDir, newName);
              newPath = `${destinationOption === 'subfolder' ? subfolderName : siblingFolderName}/${newName}`;
            } else if (!image.fileHandle) {
              // No file handle - files were selected via file input, need destination
              throw new Error('Files selected via file input require a destination folder. Please select a destination folder option above.');
            } else {
              // No destination directory and no move() support
              throw new Error('Unable to rename file. Please ensure a destination folder option is selected.');
            }
          } else {
            // Dry run - just calculate the path
            if (destinationDir) {
              newPath = `${destinationOption === 'subfolder' ? subfolderName : siblingFolderName}/${newName}`;
            }
          }

          entries.push({
            oldPath,
            oldName: image.originalName,
            newPath,
            newName,
            status: 'success',
            timestamp: new Date().toISOString(),
          });

          successCount++;
        } catch (err: any) {
          const errorMsg = err.message || 'Unknown error';
          addError(image.id, errorMsg);
          
          entries.push({
            oldPath: image.path,
            oldName: image.originalName,
            newPath: '',
            newName: '',
            status: 'error',
            error: errorMsg,
            timestamp: new Date().toISOString(),
          });

          errorCount++;
        }
      }

      // Save audit log
      const auditBatch: AuditBatch = {
        id: `audit-${Date.now()}`,
        batchId,
        entries,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: errorCount === 0 ? 'completed' : errorCount === images.length ? 'failed' : 'partial',
      };

      await addAuditBatch(auditBatch);
      setLastBatchId(batchId);

      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      console.error('Batch rename error:', err);
      const errorMsg = err.message || 'An unexpected error occurred during rename';
      addError('', errorMsg);
    } finally {
      setProcessing(false);
    }
  }, [
    selectedDirectory,
    images,
    destinationOption,
    subfolderName,
    siblingFolderName,
    dryRun,
    setProcessing,
    setProgress,
    addError,
    clearErrors,
    addAuditBatch,
    setLastBatchId,
    addUsedName,
    setSelectedDirectory,
    onComplete,
  ]);

  const exportAudit = useCallback(async () => {
    // Export audit as CSV
    const csv = [
      'Old Path,Old Name,New Path,New Name,Status,Error,Timestamp',
      ...images.map((img) =>
        `"${img.path}","${img.originalName}","${img.currentName}${img.extension}","${img.currentName}${img.extension}","pending","","${new Date().toISOString()}"`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rename-audit-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [images]);

  return (
    <div className="space-y-6">
      {selectedDirectory && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Batch rename options</h2>

          {/* Destination options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Destination</label>
              <div className="flex gap-4">
                <label className="flex items-center text-gray-900 dark:text-gray-100">
                  <input
                    type="radio"
                    value="subfolder"
                    checked={destinationOption === 'subfolder'}
                    onChange={(e) => setDestinationOption(e.target.value as 'subfolder' | 'sibling')}
                    className="mr-2"
                  />
                  <span>Export new images to subfolder</span>
                </label>
                <label className="flex items-center text-gray-900 dark:text-gray-100">
                  <input
                    type="radio"
                    value="sibling"
                    checked={destinationOption === 'sibling'}
                    onChange={(e) => setDestinationOption(e.target.value as 'subfolder' | 'sibling')}
                    className="mr-2"
                  />
                  <span>Move original images to sibling folder</span>
                </label>
              </div>
            </div>

            {destinationOption === 'subfolder' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Subfolder name</label>
                <Input
                  value={subfolderName}
                  onChange={(e) => setSubfolderName(e.target.value)}
                  placeholder="renamed"
                />
              </div>
            )}

            {destinationOption === 'sibling' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Sibling folder name</label>
                <Input
                  value={siblingFolderName}
                  onChange={(e) => setSiblingFolderName(e.target.value)}
                  placeholder="original"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="dry-run"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="dry-run" className="text-sm text-gray-900 dark:text-gray-100">
                Dry run (preview only, no files changed)
              </label>
            </div>
          </div>
        </div>
      )}

      {!selectedDirectory && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            To rename files, please select a folder using "Select Folder" on step 1, or drag and drop a folder onto the upload area.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={exportAudit}
          disabled={images.length === 0}
        >
          Export preview CSV
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleRename}
            disabled={isProcessing || images.length === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4 mr-2" />
                {dryRun 
                  ? `Preview rename ${images.length} file${images.length !== 1 ? 's' : ''}` 
                  : `Rename ${images.length} file${images.length !== 1 ? 's' : ''}`}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="space-y-2">
            {errors.map((err, index) => (
              <p key={index} className="text-sm text-red-700 dark:text-red-300">
                {err.error}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Processing...</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {images.length} files
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(images.length / images.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

