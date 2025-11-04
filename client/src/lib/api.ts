// API functions - to be implemented for new image renaming app
// These are stubs that will throw errors if called - replace with actual implementations

export async function getTemplate(id: string): Promise<unknown> {
  throw new Error('API not implemented - replace with your implementation');
}

export async function uploadLocal(file: File): Promise<{ fileId: string; publicUrl: string; thumbnailUrl?: string | null }> {
  throw new Error('API not implemented - replace with your implementation');
}

export async function createFromTemplate(payload: unknown): Promise<unknown> {
  throw new Error('API not implemented - replace with your implementation');
}

export async function getProductStatus(productId: string): Promise<unknown> {
  throw new Error('API not implemented - replace with your implementation');
}

// Dropbox OAuth and file operations
export async function listDropboxFiles(accessToken: string, path?: string): Promise<{ folders?: Array<{ id: string; name: string; path: string }>; files: Array<{ id: string; name: string; path: string; size: number; modified: string }> }> {
  throw new Error('API not implemented - replace with your implementation');
}

export async function getDropboxDownloadLink(accessToken: string, path: string): Promise<{ link: string; expires?: string }> {
  throw new Error('API not implemented - replace with your implementation');
}

export function getDropboxThumbnailUrl(accessToken: string, path: string): string {
  throw new Error('API not implemented - replace with your implementation');
}

// Refresh Dropbox access token
export async function refreshDropboxToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; expiryTime: number }> {
  throw new Error('API not implemented - replace with your implementation');
}

// Google Drive OAuth and file operations
export async function listGoogleDriveFiles(accessToken: string, folderId?: string): Promise<{ files: Array<{ id: string; name: string; mimeType: string; size?: string; modified?: string; downloadUrl?: string; thumbnailUrl?: string }> }> {
  throw new Error('API not implemented - replace with your implementation');
}

export async function getGoogleDriveDownloadLink(accessToken: string, fileId: string): Promise<{ link: string; name?: string; mimeType?: string }> {
  throw new Error('API not implemented - replace with your implementation');
}

// Regenerate public URL for a locally uploaded file (after tunnel refresh)
export async function regenerateFileUrl(fileId: string): Promise<{ fileId: string; publicUrl: string; thumbnailUrl?: string | null }> {
  throw new Error('API not implemented - replace with your implementation');
}

// Get current tunnel/base URL from server
export async function getTunnelUrl(): Promise<{ publicBaseUrl: string }> {
  throw new Error('API not implemented - replace with your implementation');
}
