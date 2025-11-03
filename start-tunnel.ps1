# Script to start cloudflared tunnel and update .env file
# This script will:
# 1. Find cloudflared executable
# 2. Start the tunnel
# 3. Capture the tunnel URL
# 4. Update PUBLIC_BASE_URL in .env file

Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Cyan

# Try to find cloudflared in common locations
$cloudflaredPaths = @(
    "cloudflared",
    "$env:ProgramFiles\Cloudflare\cloudflared.exe",
    "$env:ProgramFiles(x86)\Cloudflare\cloudflared.exe",
    "$env:LOCALAPPDATA\Microsoft\WindowsApps\cloudflared.exe",
    "C:\ProgramData\chocolatey\bin\cloudflared.exe",
    "$env:USERPROFILE\AppData\Local\Programs\cloudflared.exe"
)

$cloudflaredExe = $null
foreach ($path in $cloudflaredPaths) {
    if (Test-Path $path) {
        $cloudflaredExe = $path
        Write-Host "Found cloudflared at: $path" -ForegroundColor Green
        break
    }
}

if (-not $cloudflaredExe) {
    # Try using Get-Command to find it
    try {
        $cmd = Get-Command cloudflared -ErrorAction Stop
        $cloudflaredExe = $cmd.Source
        Write-Host "Found cloudflared via PATH: $cloudflaredExe" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: cloudflared not found!" -ForegroundColor Red
        Write-Host "Please install cloudflared first:" -ForegroundColor Yellow
        Write-Host "  Option 1: Run setup-tunnel.ps1" -ForegroundColor White
        Write-Host "  Option 2: Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor White
        Write-Host "  Option 3: Use ngrok instead: ngrok http 5175" -ForegroundColor White
        exit 1
    }
}

# Stop any existing cloudflared processes
Write-Host "`nChecking for existing cloudflared processes..." -ForegroundColor Yellow
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Start cloudflared and capture output
Write-Host "Starting tunnel to http://localhost:5175..." -ForegroundColor Yellow
Write-Host "Waiting for tunnel URL..." -ForegroundColor Yellow

$job = Start-Job -ScriptBlock {
    param($exe)
    & $exe tunnel --url http://localhost:5175 2>&1
} -ArgumentList $cloudflaredExe

# Wait a bit and try to get the URL
Start-Sleep -Seconds 8

$output = Receive-Job $job
$tunnelUrl = $null

# Look for the tunnel URL in the output
foreach ($line in $output) {
    if ($line -match "https://([a-zA-Z0-9\-]+)\.trycloudflare\.com") {
        $tunnelUrl = $matches[0]
        Write-Host "`n✅ Tunnel URL found: $tunnelUrl" -ForegroundColor Green
        break
    }
    # Also check stderr lines that might contain the URL
    if ($line -match "trycloudflare\.com") {
        $tunnelUrl = ($line | Select-String -Pattern "https://[^\s]+trycloudflare\.com").Matches.Value
        if ($tunnelUrl) {
            Write-Host "`n✅ Tunnel URL found: $tunnelUrl" -ForegroundColor Green
            break
        }
    }
}

if (-not $tunnelUrl) {
    Write-Host "`n⚠️  Could not automatically detect tunnel URL from output." -ForegroundColor Yellow
    Write-Host "Tunnel is running. Please check the cloudflared output above for the URL." -ForegroundColor Yellow
    Write-Host "`nCloudflared output:" -ForegroundColor Cyan
    $output | ForEach-Object { Write-Host $_ }
    
    $manualUrl = Read-Host "`nPlease enter the tunnel URL manually (or press Enter to skip)"
    if ($manualUrl) {
        $tunnelUrl = $manualUrl
    } else {
        Write-Host "Skipping .env update. Tunnel is running in background." -ForegroundColor Yellow
        Write-Host "Job ID: $($job.Id) - You can check it with: Receive-Job -Id $($job.Id)" -ForegroundColor Cyan
        exit 0
    }
}

# Update .env file
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "`nUpdating .env file..." -ForegroundColor Yellow
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "PUBLIC_BASE_URL=(.*)") {
        $envContent = $envContent -replace "PUBLIC_BASE_URL=.*", "PUBLIC_BASE_URL=$tunnelUrl"
        Write-Host "Updated PUBLIC_BASE_URL to: $tunnelUrl" -ForegroundColor Green
    } else {
        # Add it if it doesn't exist
        $envContent += "`nPUBLIC_BASE_URL=$tunnelUrl`n"
        Write-Host "Added PUBLIC_BASE_URL: $tunnelUrl" -ForegroundColor Green
    }
    
    Set-Content -Path $envFile -Value $envContent -NoNewline
    Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file not found. Creating new one..." -ForegroundColor Yellow
    "PUBLIC_BASE_URL=$tunnelUrl" | Out-File -FilePath $envFile -Encoding utf8
    Write-Host "✅ Created .env file with PUBLIC_BASE_URL: $tunnelUrl" -ForegroundColor Green
}

Write-Host "`n✅ Tunnel is running and .env file updated!" -ForegroundColor Green
Write-Host "The tunnel is running in the background (Job ID: $($job.Id))" -ForegroundColor Cyan
Write-Host "To stop the tunnel, run: Stop-Job -Id $($job.Id); Remove-Job -Id $($job.Id)" -ForegroundColor Yellow
Write-Host "`n⚠️  IMPORTANT: Keep this terminal/PowerShell window open while the tunnel is running!" -ForegroundColor Yellow
Write-Host "If you close it, Gelato won't be able to access your images." -ForegroundColor Yellow

