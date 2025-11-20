#!/bin/bash
set -e

cd /var/www/renamely.jamescutts.me
sudo git pull origin main
npm run install
cd client
npm run build
cd ..
sudo nginx -t && sudo systemctl reload nginx
echo "✅ Deployment complete! Build output: client/dist/"
