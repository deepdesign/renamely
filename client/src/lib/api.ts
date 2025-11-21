/**
 * API functions - to be implemented for new image renaming app
 * 
 * These are stubs that will throw errors if called - replace with actual implementations.
 * 
 * When implementing these functions, wrap them with retryApiCall() from './retry' for
 * automatic retry on transient failures:
 * 
 * @example
 * ```typescript
 * import { retryApiCall } from './retry';
 * 
 * export async function getTemplate(id: string): Promise<GetTemplateResponse> {
 *   return retryApiCall(
 *     () => fetch(`/api/templates/${id}`).then(r => r.json()),
 *     `GET /api/templates/${id}`
 *   );
 * }
 * ```
 */

import type { GetTemplateResponse, CreateFromTemplateResponse, ProductStatusResponse } from './types';

export async function getTemplate(_id: string): Promise<GetTemplateResponse> {
  throw new Error('API not implemented - replace with your implementation');
}

export async function uploadLocal(_file: File): Promise<{ fileId: string; publicUrl: string; thumbnailUrl?: string | null }> {
  throw new Error('API not implemented - replace with your implementation');
}

export async function createFromTemplate(_payload: unknown): Promise<CreateFromTemplateResponse> {
  throw new Error('API not implemented - replace with your implementation');
}

export async function getProductStatus(_productId: string): Promise<ProductStatusResponse> {
  throw new Error('API not implemented - replace with your implementation');
}

// Dropbox OAuth and file operations
export async function listDropboxFiles(_accessToken: string, _path?: string): Promise<{ folders?: Array<{ id: string; name: string; path: string }>; files: Array<{ id: string; name: string; path: string; size: number; modified: string }> }> {
  throw new Error('API not implemented - replace with your implementation');
}

export async function getDropboxDownloadLink(_accessToken: string, _path: string): Promise<{ link: string; expires?: string }> {
  throw new Error('API not implemented - replace with your implementation');
}

export function getDropboxThumbnailUrl(_accessToken: string, _path: string): string {
  throw new Error('API not implemented - replace with your implementation');
}

// Refresh Dropbox access token
export async function refreshDropboxToken(_refreshToken: string): Promise<{ access_token: string; expires_in: number; expiryTime: number }> {
  throw new Error('API not implemented - replace with your implementation');
}

// Google Drive OAuth and file operations
export async function listGoogleDriveFiles(_accessToken: string, _folderId?: string): Promise<{ files: Array<{ id: string; name: string; mimeType: string; size?: string; modified?: string; downloadUrl?: string; thumbnailUrl?: string }> }> {
  throw new Error('API not implemented - replace with your implementation');
}

export async function getGoogleDriveDownloadLink(_accessToken: string, _fileId: string): Promise<{ link: string; name?: string; mimeType?: string }> {
  throw new Error('API not implemented - replace with your implementation');
}

// Regenerate public URL for a locally uploaded file (after tunnel refresh)
export async function regenerateFileUrl(_fileId: string): Promise<{ fileId: string; publicUrl: string; thumbnailUrl?: string | null }> {
  throw new Error('API not implemented - replace with your implementation');
}

// Get current tunnel/base URL from server
export async function getTunnelUrl(): Promise<{ publicBaseUrl: string }> {
  throw new Error('API not implemented - replace with your implementation');
}
