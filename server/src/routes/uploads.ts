import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { sign } from '../services/tokens';
import { ENV } from '../util/env';
import { errorHandler } from '../util/errors';
import { log, error } from '../util/logger';

const router = Router();

// Ensure tmp directory exists
const tmpDir = path.join(process.cwd(), 'server', 'tmp');
const thumbDir = path.join(tmpDir, 'thumbs');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}
if (!fs.existsSync(thumbDir)) {
  fs.mkdirSync(thumbDir, { recursive: true });
}

// Use storage instead of dest to preserve file extensions
const storage = multer.diskStorage({
  destination: tmpDir,
  filename: (req, file, cb) => {
    // Preserve original extension if available
    const ext = file.originalname.split('.').pop() || '';
    // Generate unique filename with extension
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext ? `.${ext}` : ''}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

router.post('/local', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileId = file.filename; // Opaque id in tmp directory
    // Increase expiry to 2 hours - Gelato may need time to fetch and process images asynchronously
    const exp = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours
    const token = sign(fileId, exp);
    const publicUrl = `${ENV.PUBLIC_BASE_URL}/public-files/${encodeURIComponent(fileId)}?t=${encodeURIComponent(token)}&e=${exp}`;

    // Verify file exists on disk
    if (!fs.existsSync(file.path)) {
      error(`File was not saved to disk: ${file.path}`);
      return res.status(500).json({ error: 'File upload failed: file not saved' });
    }
    
    // Log detailed upload info for debugging
    const stats = fs.statSync(file.path);
    log(`File uploaded: ${fileId}, original name: ${file.originalname}, size: ${stats.size} bytes, path: ${file.path}`);
    log(`Public URL: ${publicUrl.replace(/[?&]t=[^&]+/, '?t=[REDACTED]')}`);
    // Check file permissions
    try {
      fs.accessSync(file.path, fs.constants.R_OK);
      log(`Verification: File exists and is readable`);
    } catch (err) {
      error(`File exists but is not readable: ${file.path}`);
    }

    // Generate thumbnail for image files
    let thumbnailUrl: string | null = null;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (imageExtensions.includes(fileExt)) {
      try {
        const thumbPath = path.join(thumbDir, `${fileId}.thumb.jpg`);
        await sharp(file.path)
          .resize(200, 200, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toFile(thumbPath);
        
        const thumbToken = sign(`${fileId}.thumb`, exp);
        thumbnailUrl = `${ENV.PUBLIC_BASE_URL}/public-files/${encodeURIComponent(fileId)}/thumb?t=${encodeURIComponent(thumbToken)}&e=${exp}`;
        log(`Thumbnail generated: ${thumbPath}`);
      } catch (thumbErr) {
        error(`Failed to generate thumbnail for ${fileId}:`, thumbErr);
        // Don't fail the upload if thumbnail generation fails
      }
    }

    res.json({ fileId, publicUrl, thumbnailUrl });
  } catch (err) {
    next(err);
  }
});

// Regenerate public URL for an existing file (e.g., after tunnel refresh)
router.post('/regenerate-url', async (req, res, next) => {
  try {
    const { fileId } = req.body;
    
    if (!fileId) {
      return res.status(400).json({ error: 'fileId required' });
    }

    // Only allow regeneration for files that exist locally (not cloud URLs)
    // Cloud URLs (dropbox/googledrive) don't need regeneration
    if (fileId.startsWith('cloud-')) {
      return res.status(400).json({ error: 'Cannot regenerate URLs for cloud files' });
    }

    const filePath = path.join(tmpDir, fileId);
    if (!fs.existsSync(filePath)) {
      log(`File not found for URL regeneration: ${fileId}`);
      return res.status(404).json({ error: 'File not found' });
    }

    // Generate new token with fresh expiry (2 hours from now)
    const exp = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours
    const token = sign(fileId, exp);
    const publicUrl = `${ENV.PUBLIC_BASE_URL}/public-files/${encodeURIComponent(fileId)}?t=${encodeURIComponent(token)}&e=${exp}`;

    // Regenerate thumbnail URL if it exists
    let thumbnailUrl: string | null = null;
    const thumbPath = path.join(thumbDir, `${fileId}.thumb.jpg`);
    if (fs.existsSync(thumbPath)) {
      const thumbToken = sign(`${fileId}.thumb`, exp);
      thumbnailUrl = `${ENV.PUBLIC_BASE_URL}/public-files/${encodeURIComponent(fileId)}/thumb?t=${encodeURIComponent(thumbToken)}&e=${exp}`;
    }

    log(`URL regenerated for file: ${fileId}, new base URL: ${ENV.PUBLIC_BASE_URL}`);
    res.json({ fileId, publicUrl, thumbnailUrl });
  } catch (err) {
    next(err);
  }
});

router.use(errorHandler);

export default router;

