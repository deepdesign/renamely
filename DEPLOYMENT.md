# Deployment Guide

This guide explains how to deploy Renamely to a production server.

## Prerequisites

- Node.js v18 or higher
- npm
- nginx (or another web server)
- Git access to the repository

## Server Setup

### 1. Initial Setup

```bash
# Navigate to web root
cd /var/www/renamely.jamescutts.me

# Clone repository (if not already cloned)
git clone <repository-url> .

# Install dependencies
npm run install
```

### 2. Build the Application

```bash
cd client
npm run build
```

This will create the production build in `client/dist/`.

### 3. Configure Nginx

1. Copy the nginx configuration:
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/renamely.jamescutts.me
   ```

2. Edit the configuration if needed:
   ```bash
   sudo nano /etc/nginx/sites-available/renamely.jamescutts.me
   ```

3. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/renamely.jamescutts.me /etc/nginx/sites-enabled/
   ```

4. Test and reload nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### 4. Set Permissions

Ensure nginx can read the files:
```bash
sudo chown -R www-data:www-data /var/www/renamely.jamescutts.me/client/dist
sudo chmod -R 755 /var/www/renamely.jamescutts.me/client/dist
```

## Deployment Process

### Option 1: Using the Deployment Script

```bash
cd /var/www/renamely.jamescutts.me
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

```bash
cd /var/www/renamely.jamescutts.me

# Pull latest changes
sudo git pull origin main

# Install dependencies
npm run install

# Build the application
cd client
npm run build

# Verify build
ls -lh dist/

# Test and reload nginx
cd ..
sudo nginx -t && sudo systemctl reload nginx
```

## Troubleshooting

### Build Output Not Found

If `client/dist` doesn't exist after building:

1. Check for build errors:
   ```bash
   cd client
   npm run build
   ```

2. Verify Node.js version:
   ```bash
   node --version  # Should be v18 or higher
   ```

3. Clear node_modules and reinstall:
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### Nginx 404 Errors

1. Verify nginx root path points to `client/dist`:
   ```bash
   sudo cat /etc/nginx/sites-available/renamely.jamescutts.me | grep root
   ```

2. Check file permissions:
   ```bash
   ls -la /var/www/renamely.jamescutts.me/client/dist
   ```

3. Verify nginx can read the directory:
   ```bash
   sudo -u www-data ls /var/www/renamely.jamescutts.me/client/dist
   ```

### Build Fails

1. Check for TypeScript errors:
   ```bash
   cd client
   npm run build
   ```

2. Check Node.js and npm versions:
   ```bash
   node --version
   npm --version
   ```

3. Review error logs in the build output

## File Structure After Deployment

```
/var/www/renamely.jamescutts.me/
├── client/
│   ├── dist/              # ← Built files (served by nginx)
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   ├── src/
│   └── ...
├── package.json
├── deploy.sh
└── nginx.conf.example
```

## Important Notes

- The `dist/` directory is gitignored and should not be committed
- Always run `npm run build` (not `npx vite build`) to ensure proper build process
- The nginx root must point to `client/dist`, not just `client`
- After each deployment, verify the site loads correctly

