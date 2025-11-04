import React, { useCallback, useEffect, useState, forwardRef } from 'react';
import { FolderOpen, Loader2, FileImage, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { selectDirectory, selectImageFiles, scanDirectory, createThumbnailUrl } from '../features/files/fs-api';
import { useAppStore } from '../features/store/slices';
import type { ImageFile } from '../features/store/slices';

interface ScannedImage {
  id: string;
  file: File;
  fileHandle: FileSystemFileHandle;
  path: string;
  originalName: string;
  extension: string;
  thumbnailUrl: string;
  size: number;
  lastModified: number;
}

export interface FilePickerRef {
  handleConfirmSelection: () => Promise<void>;
  selectedImageCount: number;
  scannedImageCount: number;
  isLoading: boolean;
}

interface FilePickerProps {
  onSelectionChange?: (selectedCount: number, scannedCount: number) => void;
}

export const FilePicker = forwardRef<FilePickerRef, FilePickerProps>(({ onSelectionChange }, ref) => {
  const {
    setSelectedDirectory,
    setImages,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedImages, setScannedImages] = useState<ScannedImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [selectedDirectoryHandle, setSelectedDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [lastDirectoryHandle, setLastDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sortColumn, setSortColumn] = useState<'name' | 'size' | 'modified' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragCounterRef = React.useRef(0);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);

  const handleSelectDirectory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use last directory handle if available
      const dirHandle = await selectDirectory(lastDirectoryHandle || undefined);
      if (!dirHandle) {
        return;
      }

      // Store the directory handle for next time
      setLastDirectoryHandle(dirHandle);

      setSelectedDirectory(dirHandle);
      setSelectedDirectoryHandle(dirHandle);

      // Scan for images
      const fileEntries = await scanDirectory(dirHandle, true);
      
      // Process files into scanned images
      const images: ScannedImage[] = [];
      for (const entry of fileEntries) {
        try {
          const file = await entry.handle.getFile();
          const extension = file.name.substring(file.name.lastIndexOf('.'));
          
          const thumbnailUrl = createThumbnailUrl(file);

          images.push({
            id: `${Date.now()}-${Math.random()}`,
            file,
            fileHandle: entry.handle,
            path: entry.path,
            originalName: file.name,
            extension,
            thumbnailUrl,
            size: file.size,
            lastModified: file.lastModified,
          });
        } catch (err: any) {
          console.error('Error processing file:', err);
        }
      }

      setScannedImages(images);
      const allSelected = new Set(images.map(img => img.id));
      setSelectedImageIds(allSelected);
      onSelectionChange?.(allSelected.size, images.length);
    } catch (err: any) {
      setError(err.message || 'Failed to select directory');
      console.error('Error selecting directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setSelectedDirectory, lastDirectoryHandle, onSelectionChange]);

  const handleSelectImages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use last directory handle if available
      const fileHandles = await selectImageFiles(lastDirectoryHandle || undefined);
      if (!fileHandles || fileHandles.length === 0) {
        return;
      }
      
      // If we got files from a directory, try to get the parent directory handle
      // Note: This is a workaround - we can't directly get parent, but we can store
      // the directory if the user selects a folder later

      // Process files into scanned images
      const images: ScannedImage[] = [];
      for (const handle of fileHandles) {
        try {
          const file = await handle.getFile();
          const extension = file.name.substring(file.name.lastIndexOf('.'));
          
          const thumbnailUrl = createThumbnailUrl(file);

          images.push({
            id: `${Date.now()}-${Math.random()}`,
            file,
            fileHandle: handle,
            path: file.name,
            originalName: file.name,
            extension,
            thumbnailUrl,
            size: file.size,
            lastModified: file.lastModified,
          });
        } catch (err: any) {
          console.error('Error processing file:', err);
        }
      }

      setScannedImages(images);
      const allSelected = new Set(images.map(img => img.id));
      setSelectedImageIds(allSelected);
      setSelectedDirectoryHandle(null);
      onSelectionChange?.(allSelected.size, images.length);
    } catch (err: any) {
      setError(err.message || 'Failed to select images');
      console.error('Error selecting images:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lastDirectoryHandle, onSelectionChange]);

  const handleConfirmSelection = useCallback(async () => {
    if (selectedImageIds.size === 0) {
      setError('Please select at least one image to rename.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Filter to only selected images and convert to ImageFile format
      // Note: We'll generate names later when theme and preset are selected
      const selectedScannedImages = scannedImages.filter(img => selectedImageIds.has(img.id));
      const images: ImageFile[] = selectedScannedImages.map((scannedImg) => ({
        id: scannedImg.id,
        file: scannedImg.file,
        fileHandle: scannedImg.fileHandle,
        path: scannedImg.path,
        originalName: scannedImg.originalName,
        suggestedName: '', // Will be generated later
        currentName: '', // Will be generated later
        extension: scannedImg.extension,
        thumbnailUrl: scannedImg.thumbnailUrl,
        size: scannedImg.size,
        lastModified: scannedImg.lastModified,
        locked: false,
      }));

      setImages(images);
      setScannedImages([]);
      setSelectedImageIds(new Set());
    } catch (err: any) {
      setError(err.message || 'Failed to process images');
      console.error('Error processing images:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedImageIds, scannedImages, setImages]);

  // Expose methods and state via ref
  React.useImperativeHandle(ref, () => ({
    handleConfirmSelection,
    selectedImageCount: selectedImageIds.size,
    scannedImageCount: scannedImages.length,
    isLoading,
  }));

  const toggleImageSelection = (id: string) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      onSelectionChange?.(newSet.size, scannedImages.length);
      return newSet;
    });
  };

  const selectAllImages = () => {
    const allSelected = new Set(scannedImages.map(img => img.id));
    setSelectedImageIds(allSelected);
    onSelectionChange?.(allSelected.size, scannedImages.length);
  };

  const deselectAllImages = () => {
    setSelectedImageIds(new Set());
    onSelectionChange?.(0, scannedImages.length);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const handleSort = useCallback((column: 'name' | 'size' | 'modified') => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const sortedImages = React.useMemo(() => {
    if (!sortColumn) return scannedImages;

    const sorted = [...scannedImages].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'modified':
          comparison = a.lastModified - b.lastModified;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [scannedImages, sortColumn, sortDirection]);

  // Prevent default drag behavior on the document to avoid browser opening files
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      // Only prevent if it's files being dragged
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDrop = (e: DragEvent) => {
      // Check if drop is happening in our drop zone
      const target = e.target as HTMLElement;
      if (dropZoneRef.current && (dropZoneRef.current.contains(target) || dropZoneRef.current === target)) {
        // Let the drop zone handle it - don't prevent
        return;
      }
      
      // Prevent drop on document (outside drop zone) to stop browser navigation
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Use capture phase to catch events early
    document.addEventListener('dragover', handleDragOver, { capture: true });
    document.addEventListener('drop', handleDrop, { capture: true });

    return () => {
      document.removeEventListener('dragover', handleDragOver, { capture: true });
      document.removeEventListener('drop', handleDrop, { capture: true });
    };
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
      // Set dropEffect to prevent browser navigation
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
      // Set dropEffect to prevent browser navigation
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    try {
      setIsLoading(true);
      setError(null);

      // Filter to image files only
      const imageFiles = files.filter(file => {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.heic', '.gif'].includes(ext);
      });

      if (imageFiles.length === 0) {
        setError('No image files found. Please select image files (jpg, png, webp, etc.)');
        setIsLoading(false);
        return;
      }

      // Process files into scanned images
      // Note: Dropped files won't have FileSystemFileHandle, so we store the file directly
      // For renaming, we'll need to handle this case differently
      const images: ScannedImage[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const extension = file.name.substring(file.name.lastIndexOf('.'));
        const thumbnailUrl = createThumbnailUrl(file);

        // Use a more unique ID that includes index
        const uniqueId = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        
        images.push({
          id: uniqueId,
          file,
          fileHandle: file as any, // Store file directly - will need special handling for rename
          path: file.name,
          originalName: file.name,
          extension,
          thumbnailUrl,
          size: file.size,
          lastModified: file.lastModified,
        });
      }

      setScannedImages(images);
      const allSelected = new Set(images.map(img => img.id));
      setSelectedImageIds(allSelected);
      setSelectedDirectoryHandle(null);
      onSelectionChange?.(allSelected.size, images.length);
    } catch (err: any) {
      setError(err.message || 'Failed to process files');
      console.error('Error processing files:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onSelectionChange]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    if (isLoading) return;

    try {
      setError(null);

      // First, check if we have files in dataTransfer.files (this is the most reliable)
      const droppedFiles = Array.from(e.dataTransfer.files);

      const items = Array.from(e.dataTransfer.items);
      const fileHandles: FileSystemFileHandle[] = [];
      let directoryHandle: FileSystemDirectoryHandle | null = null;
      let filesFromItems: File[] = [];

      // Check if File System Access API is available and try to get handles
      if (items.length > 0 && 'getAsFileSystemHandle' in items[0]) {
        // Process each item using File System Access API
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.kind === 'file') {
            try {
              const handle = await (item as any).getAsFileSystemHandle();
              if (handle) {
                if (handle.kind === 'directory') {
                  // Store the directory handle (take the first one if multiple)
                  if (!directoryHandle) {
                    directoryHandle = handle as FileSystemDirectoryHandle;
                  }
                } else if (handle.kind === 'file') {
                  // It's a file handle
                  fileHandles.push(handle as FileSystemFileHandle);
                }
              }
            } catch (err: any) {
              // If getAsFileSystemHandle fails, try to get the file directly
              try {
                const file = item.getAsFile();
                if (file) {
                  filesFromItems.push(file);
                }
              } catch (fileErr: any) {
                // Ignore - will fall back to dataTransfer.files
              }
            }
          } else if (item.kind === '') {
            // Some browsers report empty kind - try to get file directly
            try {
              const file = item.getAsFile();
              if (file) {
                filesFromItems.push(file);
              }
            } catch (fileErr: any) {
              // Ignore - will fall back to dataTransfer.files
            }
          }
        }

        // If we got a directory handle, use it
        if (directoryHandle) {
          setIsLoading(true);
          try {
            // Request readwrite permission
            const permission = await directoryHandle.requestPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
              setError('Permission denied. Please grant read/write access to the folder.');
              setIsLoading(false);
              return;
            }

            // Set the directory
            setSelectedDirectory(directoryHandle);
            setSelectedDirectoryHandle(directoryHandle);

            // Scan the directory for images
            const { scanDirectory } = await import('../features/files/fs-api');
            const fileEntries = await scanDirectory(directoryHandle, true);

            // Process files into scanned images
            const images: ScannedImage[] = [];
            for (const entry of fileEntries) {
              try {
                const file = await entry.handle.getFile();
                const extension = file.name.substring(file.name.lastIndexOf('.'));
                const thumbnailUrl = createThumbnailUrl(file);

                images.push({
                  id: `${Date.now()}-${Math.random()}`,
                  file,
                  fileHandle: entry.handle,
                  path: entry.path,
                  originalName: file.name,
                  extension,
                  thumbnailUrl,
                  size: file.size,
                  lastModified: file.lastModified,
                });
              } catch (err: any) {
                console.error('Error processing file:', err);
              }
            }

            setScannedImages(images);
            const allSelected = new Set(images.map(img => img.id));
            setSelectedImageIds(allSelected);
            onSelectionChange?.(allSelected.size, images.length);
          } finally {
            setIsLoading(false);
          }
          return;
        } else {
          // Combine file handles and files from items
          const allFiles: File[] = [];
          
          // Get files from handles
          if (fileHandles.length > 0) {
            const filesFromHandles = await Promise.all(fileHandles.map(handle => handle.getFile()));
            allFiles.push(...filesFromHandles);
          }
          
          // Add files that we got directly from items (when handles failed)
          if (filesFromItems.length > 0) {
            allFiles.push(...filesFromItems);
          }
          
          // If we got fewer files than what's in dataTransfer.files, use dataTransfer.files instead
          // This handles the case where File System Access API doesn't give us all files
          if (droppedFiles.length > 0 && droppedFiles.length > allFiles.length) {
            await processFiles(droppedFiles);
            return;
          }
          
          // If we have any files, process them
          if (allFiles.length > 0) {
            await processFiles(allFiles);
            return;
          }
        }
      }

      // Fallback: regular file drop (for browsers without File System Access API or when handles aren't available)
      if (droppedFiles.length > 0) {
        await processFiles(droppedFiles);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process dropped items');
      console.error('Error processing drop:', err);
      setIsLoading(false);
    }
  }, [isLoading, processFiles, setSelectedDirectory, onSelectionChange]);

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await processFiles(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  // Show file/folder selection UI with table below when images are scanned
  return (
    <div className="flex flex-col space-y-4 min-w-0 flex-1 min-h-0">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        id="file-upload-input"
      />
      
      {/* Selection Area */}
      <div
        ref={dropZoneRef}
        className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center text-center mb-3 w-full">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {isDragOver ? 'Drop images or folder here' : 'Drag and drop images or a folder here, or click to browse'}
          </p>
        </div>
        
        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm w-full">
            {error}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <FileImage className="w-4 h-4 mr-2" />
                Browse images
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectDirectory();
            }}
            disabled={isLoading}
            size="sm"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Select folder
          </Button>
        </div>
      </div>

      {/* Image Selection Table - shown below when images are scanned */}
      {scannedImages.length > 0 && (
        <div className="flex flex-col space-y-4 min-w-0 flex-1 min-h-0">
          <div className="flex items-center justify-between flex-shrink-0 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              Select Images to Rename ({scannedImages.length} found)
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedImageIds.size === scannedImages.length) {
                    deselectAllImages();
                  } else {
                    selectAllImages();
                  }
                }}
              >
                {selectedImageIds.size === scannedImages.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setScannedImages([]);
                  setSelectedImageIds(new Set());
                  setSelectedDirectoryHandle(null);
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col min-w-0 flex-1 min-h-0">
            <div className="overflow-y-auto overflow-x-hidden min-w-0 flex-1 min-h-0">
              <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                <colgroup>
                  <col style={{ width: '48px' }} />
                  <col style={{ width: '80px' }} />
                  <col style={{ width: 'auto' }} />
                  <col style={{ width: '96px' }} />
                  <col style={{ width: '112px' }} />
                </colgroup>
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedImageIds.size === scannedImages.length && scannedImages.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllImages();
                          } else {
                            deselectAllImages();
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Preview</th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        {sortColumn === 'name' && (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                      onClick={() => handleSort('size')}
                    >
                      <div className="flex items-center gap-1">
                        Size
                        {sortColumn === 'size' && (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                      onClick={() => handleSort('modified')}
                    >
                      <div className="flex items-center gap-1">
                        Modified
                        {sortColumn === 'modified' && (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedImages.map((image) => (
                    <tr 
                      key={image.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedImageIds.has(image.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedImageIds.has(image.id)}
                          onChange={() => toggleImageSelection(image.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-16 h-16 flex-shrink-0">
                          <img
                            src={image.thumbnailUrl}
                            alt={image.originalName}
                            className="w-full h-full object-cover rounded border border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white break-words max-w-0">
                        <div className="truncate" title={image.originalName}>
                          {image.originalName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatFileSize(image.size)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(image.lastModified).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
});
