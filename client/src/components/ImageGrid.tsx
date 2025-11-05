import { useState, useCallback, useEffect, useRef } from 'react';
import { FixedSizeList } from 'react-window';
import { useAppStore } from '../features/store/slices';
import type { ImageFile } from '../features/store/slices';
import { NameCell } from './NameCell';
import { Lock, Unlock } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { createThumbnailUrl } from '../features/files/fs-api';

interface ImageGridProps {
  onRename?: () => void;
}

export function ImageGrid({}: ImageGridProps) {
  const {
    images,
    updateImageName,
    lockImage,
    unlockImage,
  } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [regeneratedUrls, setRegeneratedUrls] = useState<Map<string, string>>(new Map());
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());
  const rootRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Measure list container height and update on resize
  useEffect(() => {
    if (!listContainerRef.current) return;

    const updateHeight = () => {
      if (listContainerRef.current) {
        // Use offsetHeight which is more reliable for flex containers
        const height = listContainerRef.current.offsetHeight;
        if (height > 0) {
          setContainerHeight(prevHeight => {
            // Only update if height actually changed to avoid unnecessary re-renders
            if (Math.abs(prevHeight - height) > 1) {
              return height;
            }
            return prevHeight;
          });
        }
      }
    };

    // Initial measurement - use multiple RAF calls to ensure layout is complete
    let rafId1: number;
    let rafId2: number;
    const scheduleUpdate = () => {
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          updateHeight();
        });
      });
    };
    scheduleUpdate();
    
    // Also update on window resize with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(scheduleUpdate, 100);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to batch updates
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const height = entry.contentRect.height;
          if (height > 0) {
            setContainerHeight(prevHeight => {
              // Only update if height actually changed to avoid unnecessary re-renders
              if (Math.abs(prevHeight - height) > 1) {
                return height;
              }
              return prevHeight;
            });
          }
        }
      });
    });
    
    // Observe the list container - this is what we need to measure
    resizeObserver.observe(listContainerRef.current);
    
    // Force an initial measurement after a short delay
    const timeoutId = setTimeout(() => {
      updateHeight();
    }, 50);

    return () => {
      if (rafId1) cancelAnimationFrame(rafId1);
      if (rafId2) cancelAnimationFrame(rafId2);
      clearTimeout(resizeTimeout);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [images.length]); // Re-measure when images change

  // Regenerate thumbnail URL for an image
  const regenerateThumbnailUrl = useCallback(async (image: ImageFile): Promise<string | null> => {
    try {
      let file: File | null = null;
      
      // Try to get File object from image.file
      if (image.file) {
        file = image.file;
      } else if (image.fileHandle) {
        // If we have fileHandle, get the File object
        file = await image.fileHandle.getFile();
      }
      
      if (file) {
        const newUrl = createThumbnailUrl(file);
        setRegeneratedUrls(prev => new Map(prev).set(image.id, newUrl));
        return newUrl;
      }
    } catch (err) {
      console.error(`Failed to regenerate thumbnail URL for ${image.id}:`, err);
    }
    return null;
  }, []);

  // Memoize thumbnail URLs, regenerating from file object if needed
  const getThumbnailUrl = useCallback((image: ImageFile): string => {
    // If we've already regenerated this URL, use it
    if (regeneratedUrls.has(image.id)) {
      return regeneratedUrls.get(image.id)!;
    }
    // Otherwise use the stored thumbnail URL
    return image.thumbnailUrl;
  }, [regeneratedUrls]);

  // Periodically check if images are still loading and regenerate if needed
  useEffect(() => {
    const checkInterval = setInterval(() => {
      // Check all visible images
      imageRefs.current.forEach((imgElement, imageId) => {
        const image = images.find(img => img.id === imageId);
        if (!image) return;
        
        // Check if image is broken or not loaded
        if (imgElement && !imgElement.complete) {
          // Image is still loading, skip
          return;
        }
        
        // If image has error or is not displayed, try to regenerate
        if (imgElement && (imgElement.naturalWidth === 0 || imgElement.naturalHeight === 0)) {
          // Image failed to load, regenerate URL
          regenerateThumbnailUrl(image).then(newUrl => {
            if (newUrl && imgElement) {
              imgElement.src = newUrl;
            }
          });
        }
      });
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkInterval);
  }, [images, regenerateThumbnailUrl]);

  const handleNameChange = useCallback((id: string, newName: string) => {
    updateImageName(id, newName);
    setEditingId(null);
  }, [updateImageName]);

  const handleLockToggle = useCallback((id: string, locked: boolean) => {
    if (locked) {
      unlockImage(id);
    } else {
      lockImage(id);
    }
  }, [lockImage, unlockImage]);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-gray-700 dark:text-gray-300 mb-2">No images selected</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Select a folder to get started
        </p>
      </div>
    );
  }

  // Calculate item size
  const itemSize = 120;
  const listHeight = Math.max(0, containerHeight);

  return (
    <div ref={rootRef} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col min-w-0 flex-1 min-h-0 max-h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {images.length} {images.length === 1 ? 'image' : 'images'}
          </span>
        </div>
      </div>

      {/* Virtualized grid */}
      <div ref={listContainerRef} className="flex-1 min-h-0 overflow-auto">
        {listHeight > 0 ? (
          <FixedSizeList
            height={listHeight}
            itemCount={images.length}
            itemSize={itemSize}
            width="100%"
          >
            {({ index, style }) => {
              const image = images[index];
              const isEditing = editingId === image.id;

              return (
                <div style={style}>
                  <div
                    className={cn(
                      'flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700 h-full min-w-full',
                      'hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <img
                        ref={(el) => {
                          if (el) {
                            imageRefs.current.set(image.id, el);
                          } else {
                            imageRefs.current.delete(image.id);
                          }
                        }}
                        src={getThumbnailUrl(image)}
                        alt={image.originalName}
                        className="w-20 h-20 object-cover rounded border border-gray-300 dark:border-gray-600"
                        onError={async (e) => {
                          // If image fails to load, try to regenerate the thumbnail URL
                          if (!regeneratedUrls.has(image.id)) {
                            const newUrl = await regenerateThumbnailUrl(image);
                            if (newUrl && e.target) {
                              (e.target as HTMLImageElement).src = newUrl;
                            }
                          }
                        }}
                        onLoad={(e) => {
                          // Verify image actually loaded correctly
                          const img = e.target as HTMLImageElement;
                          if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                            // Image is broken, regenerate
                            regenerateThumbnailUrl(image).then(newUrl => {
                              if (newUrl) {
                                img.src = newUrl;
                              }
                            });
                          }
                        }}
                      />
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {image.originalName}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {(image.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      
                      {/* Name editing */}
                      <NameCell
                        image={image}
                        isEditing={isEditing}
                        onStartEdit={() => setEditingId(image.id)}
                        onCancelEdit={() => setEditingId(null)}
                        onNameChange={(newName) => handleNameChange(image.id, newName)}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLockToggle(image.id, image.locked);
                          }}
                          title={image.locked ? 'Unlock name' : 'Lock name'}
                        >
                          {image.locked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          </FixedSizeList>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        )}
      </div>
    </div>
  );
}

