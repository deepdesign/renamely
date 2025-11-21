# Hostinger Deployment Guide

## Quick Deploy Command (Cut/Paste)

If you have SSH access to Hostinger, run these commands in order:

```bash
cd /home/u123456789/domains/yourdomain.com/public_html && git pull origin main && cd client && npm install && npm run build && echo "✅ Build complete! Files in: client/dist/"
```

**Replace `/home/u123456789/domains/yourdomain.com/public_html` with your actual Hostinger domain path.**

## Step-by-Step Deployment

### Option 1: SSH/Terminal Deployment (Recommended)

```bash
# 1. Navigate to your Hostinger domain directory
cd /home/u123456789/domains/yourdomain.com/public_html

# 2. Pull latest changes from Git
git pull origin main

# 3. Navigate to client directory
cd client

# 4. Install dependencies (if package.json changed)
npm install

# 5. Build the application
npm run build

# 6. Verify build output exists
ls -lh dist/

# 7. Copy build files to public_html root (if needed)
# Most Hostinger setups serve from public_html directly
# Check your hosting panel for the correct directory
```

### Option 2: Manual Upload via File Manager

1. **Build locally:**
   ```bash
   cd client
   npm run build
   ```

2. **Upload contents of `client/dist/` folder** to your Hostinger `public_html` directory via File Manager or FTP.

3. **Create `.htaccess` file** in `public_html` with SPA routing support:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

## Full Automated Deploy Script

Create this file as `deploy.sh` on your Hostinger server:

```bash
#!/bin/bash
set -e

# Configuration - UPDATE THESE PATHS
DOMAIN_DIR="/home/u123456789/domains/yourdomain.com/public_html"
BUILD_OUTPUT_DIR="$DOMAIN_DIR/client/dist"

echo "🚀 Starting deployment..."

# Navigate to domain directory
cd "$DOMAIN_DIR"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
cd client
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build
if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo "✅ Build complete!"
echo "📁 Build output: $BUILD_OUTPUT_DIR"
echo "📊 Build size:"
du -sh dist/

# If you need to copy to a different directory, uncomment:
# cp -r dist/* ../public_html/

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

Then run:
```bash
./deploy.sh
```

## Single-Line Command (All-in-One)

```bash
cd /home/u123456789/domains/yourdomain.com/public_html && git pull origin main && cd client && npm install && npm run build && ls -lh dist/ && echo "✅ Deployment complete! Build output in: client/dist/"
```

## Important Notes

1. **First-time setup**: Make sure Node.js v18+ is installed on Hostinger
2. **Build output**: Files will be in `client/dist/` directory
3. **Server configuration**: Ensure your hosting points to the correct directory
4. **File permissions**: May need to set proper permissions for web server access
5. **SPA routing**: Create `.htaccess` for React Router to work properly

## Verify Deployment

After deploying, check:
```bash
# Check if files exist
ls -lh client/dist/

# Should see:
# - index.html
# - assets/ (directory)
# - Other static files
```

## Troubleshooting

### Build fails
```bash
# Check Node.js version
node --version  # Should be v18+

# Clear cache and rebuild
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Files not serving
- Verify your hosting panel's document root points to the correct directory
- Check file permissions: `chmod -R 755 client/dist/`
- Verify `.htaccess` is in place for SPA routing

