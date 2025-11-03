export async function getTemplate(id: string): Promise<unknown> {
  const res = await fetch(`/api/templates/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get template failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function uploadLocal(file: File): Promise<{ fileId: string; publicUrl: string; thumbnailUrl?: string | null }> {
  const body = new FormData();
  body.append('file', file);
  
  const res = await fetch('/api/uploads/local', { 
    method: 'POST', 
    body 
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

export async function createFromTemplate(payload: unknown): Promise<unknown> {
  const res = await fetch('/api/products/create-from-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create product failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

export async function getProductStatus(productId: string): Promise<unknown> {
  const res = await fetch(`/api/products/${encodeURIComponent(productId)}`);
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get product status failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

// Dropbox OAuth and file operations
export async function listDropboxFiles(accessToken: string, path?: string): Promise<{ folders?: Array<{ id: string; name: string; path: string }>; files: Array<{ id: string; name: string; path: string; size: number; modified: string }> }> {
  const res = await fetch('/api/dropbox/list-files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, path: path || '' }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List Dropbox files failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

export async function getDropboxDownloadLink(accessToken: string, path: string): Promise<{ link: string; expires?: string }> {
  const res = await fetch('/api/dropbox/get-download-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, path }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get Dropbox download link failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

export function getDropboxThumbnailUrl(accessToken: string, path: string): string {
  // Return a URL that will fetch the thumbnail through our proxy
  // We'll need to encode the path and token for security
  const encodedPath = encodeURIComponent(path);
  return `/api/dropbox/get-thumbnail?token=${encodeURIComponent(accessToken)}&path=${encodedPath}`;
}

// Refresh Dropbox access token
export async function refreshDropboxToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; expiryTime: number }> {
  const res = await fetch('/api/dropbox/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh Dropbox token failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

// Google Drive OAuth and file operations
export async function listGoogleDriveFiles(accessToken: string, folderId?: string): Promise<{ files: Array<{ id: string; name: string; mimeType: string; size?: string; modified?: string; downloadUrl?: string; thumbnailUrl?: string }> }> {
  const res = await fetch('/api/googledrive/list-files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, folderId: folderId || 'root' }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List Google Drive files failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

export async function getGoogleDriveDownloadLink(accessToken: string, fileId: string): Promise<{ link: string; name?: string; mimeType?: string }> {
  const res = await fetch('/api/googledrive/get-download-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, fileId }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get Google Drive download link failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

// Regenerate public URL for a locally uploaded file (after tunnel refresh)
export async function regenerateFileUrl(fileId: string): Promise<{ fileId: string; publicUrl: string; thumbnailUrl?: string | null }> {
  const res = await fetch('/api/uploads/regenerate-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Regenerate URL failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

// Get current tunnel/base URL from server
export async function getTunnelUrl(): Promise<{ publicBaseUrl: string }> {
  const res = await fetch('/api/tunnel/url');
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Get tunnel URL failed: ${res.status} ${text}`);
  }
  
  return res.json();
}

