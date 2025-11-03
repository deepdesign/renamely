import fs from 'fs';
import path from 'path';
import { ENV } from '../util/env';
import { log } from '../util/logger';

export function getLocalImageFiles(): string[] {
  const folder = ENV.GELATO_IMAGES_FOLDER;
  
  if (!folder || !fs.existsSync(folder)) {
    log(`Images folder not found or not configured: ${folder}`);
    return [];
  }

  try {
    const files = fs.readdirSync(folder);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
    }).map(file => path.join(folder, file));
  } catch (err) {
    log(`Error reading images folder: ${err}`);
    return [];
  }
}

