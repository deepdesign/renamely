import { Router } from 'express';
import axios from 'axios';
import { ENV } from '../util/env';
import { log, error as errorLog } from '../util/logger';

const router = Router();

// OAuth 2.0 flow for Google Drive
// Users authenticate with their own Google accounts

// Step 1: Initiate OAuth - redirect user to Google
router.get('/auth', (req, res) => {
  const clientId = ENV.GOOGLE_DRIVE_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/googledrive/callback`;
  const state = req.query.state as string || 'default';
  
  if (!clientId) {
    errorLog('Google Drive OAuth initiated but GOOGLE_DRIVE_CLIENT_ID is not set in .env');
    return res.status(500).json({ 
      error: 'Google Drive Client ID not configured. Please ensure GOOGLE_DRIVE_CLIENT_ID is set in your .env file and restart the server.' 
    });
  }

  // Use a less sensitive scope that doesn't require verification for testing
  // https://www.googleapis.com/auth/drive.readonly requires verification for production
  // For development, we can use a less sensitive scope or add test users
  const scope = 'https://www.googleapis.com/auth/drive.readonly';
  const responseType = 'code';
  const accessType = 'offline'; // Request refresh token
  const prompt = 'consent'; // Force consent to get refresh token

  // Log the redirect URI for debugging
  log(`Google Drive OAuth - Redirect URI: ${redirectUri}`);
  log(`Google Drive OAuth - Make sure this EXACT URI is in Google Cloud Console authorized redirect URIs`);
  log(`Google Drive OAuth - Scope: ${scope}`);
  log(`Google Drive OAuth - Client ID: ${clientId.substring(0, 20)}...`);
  log(`Google Drive OAuth - IMPORTANT: If you see "This app is not valid", you need to:`);
  log(`  1. Go to: https://console.cloud.google.com/apis/credentials/consent`);
  log(`  2. Complete the OAuth consent screen setup:`);
  log(`     - App name: Podmate`);
  log(`     - User support email: Your email`);
  log(`     - Developer contact: Your email`);
  log(`  3. Add scope "${scope}" to the consent screen`);
  log(`  4. Add your Google account email as a Test User (if app is in Testing mode)`);
  log(`  5. Verify redirect URI "${redirectUri}" is in Authorized redirect URIs`);

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=${responseType}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=${accessType}&` +
    `prompt=${prompt}&` +
    (state ? `state=${encodeURIComponent(state)}` : '');

  log(`Initiating Google Drive OAuth flow. Redirecting to: ${authUrl.replace(clientId, '[REDACTED]').replace(redirectUri, '[REDIRECT_URI]')}`);
  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback - exchange code for access token
router.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  const error = req.query.error as string;
  const state = req.query.state as string;

  if (error) {
    errorLog(`Google Drive OAuth error: ${error}`);
    errorLog(`This usually means:`);
    errorLog(`1. OAuth consent screen is not configured`);
    errorLog(`2. App is in Testing mode and user is not added as test user`);
    errorLog(`3. Scope is not added to consent screen`);
    errorLog(`4. Redirect URI mismatch`);
    errorLog(`Fix at: https://console.cloud.google.com/apis/credentials/consent`);
    const clientUrl = ENV.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/?googledrive_auth_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    errorLog('Google Drive OAuth callback missing authorization code');
    const clientUrl = ENV.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/?googledrive_auth_error=missing_code`);
  }

  try {
    const clientId = ENV.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = ENV.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/googledrive/callback`;

    if (!clientId || !clientSecret) {
      errorLog('Google Drive OAuth credentials not configured');
      const clientUrl = ENV.CLIENT_URL || 'http://localhost:5173';
      return res.redirect(`${clientUrl}/?googledrive_auth_error=not_configured`);
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    log('Google Drive OAuth successful - token obtained');

    const clientUrl = ENV.CLIENT_URL || 'http://localhost:5173';
    const params = new URLSearchParams({
      googledrive_auth_success: 'true',
      access_token,
      expires_in: expires_in?.toString() || '3600',
      step: '2', // Navigate to Upload artwork screen
      tab: 'googledrive', // Pre-select Google Drive tab
    });
    
    if (refresh_token) {
      params.append('refresh_token', refresh_token);
    }

    res.redirect(`${clientUrl}/?${params.toString()}`);
  } catch (err) {
    errorLog(`Google Drive OAuth token exchange failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    const clientUrl = ENV.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/?googledrive_auth_error=token_exchange_failed`);
  }
});

// Step 3: List files in Google Drive using access token
router.post('/list-files', async (req, res) => {
  try {
    const { accessToken, folderId = 'root' } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // List files - filter for images
    const imageMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
    ];

    const queryParts = [
      `'${folderId}' in parents`,
      'mimeType != "application/vnd.google-apps.folder"',
      `(${imageMimeTypes.map(type => `mimeType='${type}'`).join(' or ')})`,
      'trashed=false',
    ];

    const response = await axios.get(
      'https://www.googleapis.com/drive/v3/files',
      {
        params: {
          q: queryParts.join(' and '),
          fields: 'files(id, name, mimeType, size, modifiedTime, webContentLink, thumbnailLink)',
          pageSize: 100,
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const files = (response.data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      modified: file.modifiedTime,
      downloadUrl: file.webContentLink,
      thumbnailUrl: file.thumbnailLink,
    }));

    res.json({ files });
  } catch (err) {
    errorLog(`Failed to list Google Drive files: ${err instanceof Error ? err.message : 'Unknown error'}`);
    if (axios.isAxiosError(err) && err.response) {
      return res.status(err.response.status).json({ 
        error: err.response.data?.error?.message || 'Failed to list Google Drive files' 
      });
    }
    res.status(500).json({ error: 'Failed to list Google Drive files' });
  }
});

// Step 4: Get download URL for a specific file
router.post('/get-download-link', async (req, res) => {
  try {
    const { accessToken, fileId } = req.body;

    if (!accessToken || !fileId) {
      return res.status(400).json({ error: 'Access token and file ID required' });
    }

    // Get file metadata first to check if it's exportable
    const fileResponse = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        params: {
          fields: 'id, name, mimeType, webContentLink',
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const file = fileResponse.data;

    // If it's a Google Workspace file (e.g., Google Docs), we'd need to export it
    // For now, just return the webContentLink if available
    // For regular files, webContentLink should work
    res.json({ 
      link: file.webContentLink || `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      name: file.name,
      mimeType: file.mimeType,
    });
  } catch (err) {
    errorLog(`Failed to get Google Drive download link: ${err instanceof Error ? err.message : 'Unknown error'}`);
    if (axios.isAxiosError(err) && err.response) {
      return res.status(err.response.status).json({ 
        error: err.response.data?.error?.message || 'Failed to get download link' 
      });
    }
    res.status(500).json({ error: 'Failed to get download link' });
  }
});

export default router;

