// Load .env if not already loaded (in case this is imported directly)
import { config } from 'dotenv';
import path from 'path';
const envPath = path.resolve(__dirname, '../../../.env');
config({ path: envPath });

export const ENV = {
  GELATO_API_KEY: process.env.GELATO_API_KEY || '',
  GELATO_STORE_ID: process.env.GELATO_STORE_ID || '',
  GELATO_TEMPLATE_ID: process.env.GELATO_TEMPLATE_ID || '',
  GELATO_IMAGES_FOLDER: process.env.GELATO_IMAGES_FOLDER || '',
  GELATO_PRODUCT_TITLE: process.env.GELATO_PRODUCT_TITLE || 'Walljazzle',
  GELATO_PRODUCT_DESCRIPTION: process.env.GELATO_PRODUCT_DESCRIPTION || 'A beautiful Walljazzle print',
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || '',
  SERVER_PORT: process.env.SERVER_PORT || '5175',
  DROPBOX_APP_KEY: process.env.DROPBOX_APP_KEY || '', // Client ID for OAuth
  DROPBOX_APP_SECRET: process.env.DROPBOX_APP_SECRET || '', // Client Secret for OAuth
  GOOGLE_DRIVE_CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
  GOOGLE_DRIVE_CLIENT_SECRET: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

// Validate critical env vars at startup
if (!ENV.GELATO_API_KEY) {
  console.error('ERROR: GELATO_API_KEY is not set in .env file');
  console.error(`Looked for .env at: ${envPath}`);
}
if (!ENV.GELATO_STORE_ID) {
  console.error('ERROR: GELATO_STORE_ID is not set in .env file');
}

// Log Dropbox config status (without exposing secrets)
if (ENV.DROPBOX_APP_KEY) {
  console.log(`✓ Dropbox Client ID configured: ${ENV.DROPBOX_APP_KEY.substring(0, 8)}...`);
} else {
  console.warn('⚠ Dropbox Client ID not configured (DROPBOX_APP_KEY missing in .env)');
}
if (ENV.GOOGLE_DRIVE_CLIENT_ID) {
  console.log(`✓ Google Drive Client ID configured`);
} else {
  console.warn('⚠ Google Drive Client ID not configured (GOOGLE_DRIVE_CLIENT_ID missing in .env)');
}

