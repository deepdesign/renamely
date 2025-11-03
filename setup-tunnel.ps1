# Script to download and setup cloudflared tunnel
# Run this script in PowerShell (may need admin for Chocolatey installation)

Write-Host "Setting up Cloudflare Tunnel..." -ForegroundColor Cyan

# Check if Chocolatey is installed
try {
    $chocoVersion = choco --version
    Write-Host "Chocolatey is already installed (version: $chocoVersion)" -ForegroundColor Green
    
    # Install cloudflared
    Write-Host "Installing cloudflared..." -ForegroundColor Yellow
    choco install cloudflared -y
    
    Write-Host "`nCloudflared installed successfully!" -ForegroundColor Green
    Write-Host "To start the tunnel, run:" -ForegroundColor Cyan
    Write-Host "  cloudflared tunnel --url http://localhost:5175" -ForegroundColor White
    Write-Host "`nCopy the HTTPS URL and add it to your .env file as PUBLIC_BASE_URL" -ForegroundColor Yellow
    
} catch {
    Write-Host "Chocolatey is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "1. Open PowerShell as Administrator" -ForegroundColor Yellow
    Write-Host "2. Run this command:" -ForegroundColor Yellow
    Write-Host "   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" -ForegroundColor White
    Write-Host "3. Close and reopen PowerShell as Administrator" -ForegroundColor Yellow
    Write-Host "4. Run this script again" -ForegroundColor Yellow
}

