# Quick Deployment Reference

## Your Current Issue

When you run `ls -l /var/www/renamely.jamescutts.me`, you won't see the `dist` folder because it's inside the `client` directory.

**Check the build output here:**
```bash
ls -l /var/www/renamely.jamescutts.me/client/dist
```

## Corrected Deployment Commands

```bash
cd /var/www/renamely.jamescutts.me

# Pull latest changes
sudo git pull origin main

# Install dependencies (from root)
npm run install

# Build the application (use npm run build, not npx vite build)
cd client
npm run build

# Verify the build output exists
ls -lh dist/

# Go back to root
cd ..

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

## Key Points

1. **Build command**: Use `npm run build` (not `npx vite build`) - this ensures TypeScript compilation happens first
2. **Build output location**: `client/dist/` (not visible in root directory listing)
3. **Nginx root**: Must point to `/var/www/renamely.jamescutts.me/client/dist`

## Verify Build Success

After building, check:
```bash
# Check if dist exists
ls -la /var/www/renamely.jamescutts.me/client/dist

# Check contents
ls -lh /var/www/renamely.jamescutts.me/client/dist/

# Should see:
# - index.html
# - assets/ directory
# - Other static files
```

## Nginx Configuration

Your nginx config should have:
```nginx
root /var/www/renamely.jamescutts.me/client/dist;
```

Not:
```nginx
root /var/www/renamely.jamescutts.me/client;  # ❌ Wrong
root /var/www/renamely.jamescutts.me;         # ❌ Wrong
```

