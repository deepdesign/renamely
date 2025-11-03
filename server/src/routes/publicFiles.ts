import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import { verify } from '../services/tokens';
import { log } from '../util/logger';

const router = Router();
const TMP = path.join(process.cwd(), 'server', 'tmp');
const THUMB_DIR = path.join(TMP, 'thumbs');

// Handle CORS preflight requests
router.options('/:fileId', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).send();
});

router.options('/:fileId/thumb', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).send();
});

// Handle thumbnail requests
router.get('/:fileId/thumb', (req, res) => {
  let fileId = decodeURIComponent(req.params.fileId);
  
  // Safety check: if decoding results in path traversal, reject
  if (fileId.includes('..') || fileId.includes('/') || fileId.includes('\\')) {
    log(`Invalid fileId after decoding: ${req.params.fileId}`);
    return res.status(403).send('Forbidden: Invalid file identifier');
  }
  
  const token = String(req.query.t || '');
  const expQuery = String(req.query.e || '');

  // Verify token (for thumbnail, token is for fileId.thumb)
  if (!token || !verify(`${fileId}.thumb`, token)) {
    log(`Token verification failed for thumbnail: ${fileId}`);
    return res.status(403).send('Forbidden: Invalid or expired token');
  }

  // Check expiry from query parameter as well
  const exp = Number(expQuery);
  if (exp && Date.now() / 1000 > exp) {
    log(`Token expired for thumbnail: ${fileId}`);
    return res.status(403).send('Forbidden: Token expired');
  }

  const thumbPath = path.join(THUMB_DIR, `${fileId}.thumb.jpg`);

  // Prevent directory traversal
  const resolvedPath = path.resolve(thumbPath);
  const resolvedThumbDir = path.resolve(THUMB_DIR);
  if (!resolvedPath.startsWith(resolvedThumbDir)) {
    log(`Directory traversal attempt detected: ${fileId}`);
    return res.status(403).send('Forbidden: Invalid file path');
  }

  if (!fs.existsSync(thumbPath)) {
    log(`Thumbnail not found: ${fileId}`);
    return res.status(404).send('Not found');
  }

  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=600, immutable');
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  
  fs.createReadStream(thumbPath).pipe(res);
});

router.get('/:fileId', (req, res) => {
  // Decode the fileId since we encode it in the URL
  let fileId = decodeURIComponent(req.params.fileId);
  
  // Safety check: if decoding results in path traversal, reject
  if (fileId.includes('..') || fileId.includes('/') || fileId.includes('\\')) {
    log(`Invalid fileId after decoding: ${req.params.fileId}`);
    return res.status(403).send('Forbidden: Invalid file identifier');
  }
  
  const token = String(req.query.t || '');
  const expQuery = String(req.query.e || '');

  // Verify token
  if (!token || !verify(fileId, token)) {
    log(`Token verification failed for fileId: ${fileId}`);
    return res.status(403).send('Forbidden: Invalid or expired token');
  }

  // Check expiry from query parameter as well
  const exp = Number(expQuery);
  if (exp && Date.now() / 1000 > exp) {
    log(`Token expired for fileId: ${fileId}`);
    return res.status(403).send('Forbidden: Token expired');
  }

  const fullPath = path.join(TMP, fileId);

  // Prevent directory traversal
  const resolvedPath = path.resolve(fullPath);
  const resolvedTmp = path.resolve(TMP);
  if (!resolvedPath.startsWith(resolvedTmp)) {
    log(`Directory traversal attempt detected: ${fileId}`);
    return res.status(403).send('Forbidden: Invalid file path');
  }

  if (!fs.existsSync(fullPath)) {
    log(`File not found: ${fileId}`);
    log(`  Expected path: ${fullPath}`);
    log(`  TMP directory: ${TMP}`);
    // List files in tmp directory for debugging
    try {
      const files = fs.readdirSync(TMP);
      log(`  Files in tmp directory (${files.length}): ${files.slice(0, 10).join(', ')}${files.length > 10 ? '...' : ''}`);
    } catch (err) {
      log(`  Could not list tmp directory: ${err}`);
    }
    return res.status(404).send('Not found');
  }

  const type = mime.lookup(fullPath) || 'application/octet-stream';
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'public, max-age=600, immutable');
  
  // Log file serving details for debugging
  const stats = fs.statSync(fullPath);
  const referer = req.get('Referer') || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  log(`Serving file: ${fileId}, size: ${stats.size} bytes, type: ${type}`);
  log(`  Path: ${fullPath}`);
  log(`  Referer: ${referer}`);
  log(`  User-Agent: ${userAgent.substring(0, 100)}`);
  
  // Detect if this might be Gelato fetching the image
  const isLikelyGelato = userAgent.toLowerCase().includes('gelato') || 
                         referer.toLowerCase().includes('gelato') ||
                         userAgent.includes('curl') || // Gelato might use curl
                         userAgent.includes('python'); // Or python requests
  
  if (isLikelyGelato) {
    log(`  ✅ GELATO FETCH DETECTED - This image is being fetched by Gelato!`);
  }
  
  // Add CORS headers to allow Gelato to fetch images
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  
  fs.createReadStream(fullPath).pipe(res);
});

export default router;

