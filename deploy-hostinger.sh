#!/bin/bash
# Hostinger Deployment Script
# Usage: ./deploy-hostinger.sh

set -e

echo "🚀 Starting Hostinger deployment..."

# Navigate to project root (adjust path as needed)
# If running from Hostinger terminal, update this path to your domain directory
cd "$(dirname "$0")"

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main || echo "⚠️  Git pull failed or not a git repo - continuing anyway"

# Install dependencies if package.json changed
echo "📦 Installing dependencies..."
if [ -f "client/package.json" ]; then
  cd client
  npm install --production=false
  echo "✅ Dependencies installed"
else
  echo "❌ client/package.json not found!"
  exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo "✅ Build complete!"
echo "📁 Build output location: $(pwd)/dist"
echo ""
echo "📊 Build statistics:"
du -sh dist/
echo ""
ls -lh dist/ | head -10
echo ""

# Note about next steps
echo "📝 Next steps:"
echo "   1. The built files are in: client/dist/"
echo "   2. Upload contents of client/dist/ to your public_html directory"
echo "   3. Make sure .htaccess file is in public_html for SPA routing"
echo "   4. Verify file permissions are correct (755 for directories, 644 for files)"
echo ""
echo "✅ Deployment script complete!"

