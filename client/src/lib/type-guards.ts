// Type guard utilities for runtime type checking

import type { ProductStatusResponse, CreateFromTemplateResponse, GetTemplateResponse } from './types';

/**
 * Type guard for ProductStatusResponse
 */
export function isProductStatusResponse(data: unknown): data is ProductStatusResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  // Must have status property
  if (typeof obj.status !== 'string') {
    return false;
  }
  
  // Optional properties should be of correct types if present
  if ('isReadyToPublish' in obj && typeof obj.isReadyToPublish !== 'boolean') {
    return false;
  }
  
  if ('variants' in obj && !Array.isArray(obj.variants)) {
    return false;
  }
  
  if ('productImages' in obj && !Array.isArray(obj.productImages)) {
    return false;
  }
  
  return true;
}

/**
 * Type guard for CreateFromTemplateResponse
 */
export function isCreateFromTemplateResponse(data: unknown): data is CreateFromTemplateResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  // Must have id property
  if (typeof obj.id !== 'string') {
    return false;
  }
  
  // Optional properties should be of correct types if present
  if ('previewUrl' in obj && typeof obj.previewUrl !== 'string') {
    return false;
  }
  
  if ('adminUrl' in obj && typeof obj.adminUrl !== 'string') {
    return false;
  }
  
  if ('externalId' in obj && typeof obj.externalId !== 'string') {
    return false;
  }
  
  if ('status' in obj && typeof obj.status !== 'string') {
    return false;
  }
  
  return true;
}

/**
 * Type guard for GetTemplateResponse
 */
export function isGetTemplateResponse(data: unknown): data is GetTemplateResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  // Must have id property
  if (typeof obj.id !== 'string') {
    return false;
  }
  
  // Must have variants array
  if (!Array.isArray(obj.variants)) {
    return false;
  }
  
  // Optional name should be string if present
  if ('name' in obj && typeof obj.name !== 'string' && obj.name !== undefined) {
    return false;
  }
  
  return true;
}

/**
 * Type guard for FileSystemDirectoryHandle
 */
export function isFileSystemDirectoryHandle(handle: unknown): handle is FileSystemDirectoryHandle {
  if (handle instanceof FileSystemDirectoryHandle) {
    return true;
  }
  
  if (typeof handle !== 'object' || handle === null) {
    return false;
  }
  
  const obj = handle as Record<string, unknown>;
  
  // Check for kind property
  if (obj.kind === 'directory') {
    return true;
  }
  
  // Check for FileSystemHandle-like structure
  if ('kind' in obj && typeof obj.kind === 'string') {
    return obj.kind === 'directory';
  }
  
  return false;
}

/**
 * Type guard for FileSystemFileHandle
 */
export function isFileSystemFileHandle(handle: unknown): handle is FileSystemFileHandle {
  if (handle instanceof FileSystemFileHandle) {
    return true;
  }
  
  if (typeof handle !== 'object' || handle === null) {
    return false;
  }
  
  const obj = handle as Record<string, unknown>;
  
  // Check for kind property
  if (obj.kind === 'file') {
    return true;
  }
  
  // Check for FileSystemHandle-like structure
  if ('kind' in obj && typeof obj.kind === 'string') {
    return obj.kind === 'file';
  }
  
  return false;
}

/**
 * Type guard for FileSystemHandle (either directory or file)
 */
export function isFileSystemHandle(handle: unknown): handle is FileSystemHandle {
  return isFileSystemDirectoryHandle(handle) || isFileSystemFileHandle(handle);
}

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<T extends string>(
  obj: unknown,
  prop: T
): obj is Record<T, unknown> {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard for HTMLImageElement
 */
export function isHTMLImageElement(element: unknown): element is HTMLImageElement {
  return element instanceof HTMLImageElement;
}

/**
 * Type guard for HTMLElement
 */
export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

/**
 * Type guard for TauriFileEntry
 */
export function isTauriFileEntry(entry: unknown): entry is { name: string; path: string; children?: unknown[]; size?: number; mtime?: number | string } {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }
  
  const obj = entry as Record<string, unknown>;
  
  // Must have name and path
  if (typeof obj.name !== 'string' || typeof obj.path !== 'string') {
    return false;
  }
  
  // Optional properties should be of correct types if present
  if ('children' in obj && !Array.isArray(obj.children) && obj.children !== undefined) {
    return false;
  }
  
  if ('size' in obj && typeof obj.size !== 'number' && obj.size !== undefined) {
    return false;
  }
  
  if ('mtime' in obj && typeof obj.mtime !== 'number' && typeof obj.mtime !== 'string' && obj.mtime !== undefined) {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if value is a string (for Tauri dialog return)
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

