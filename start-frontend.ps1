# PowerShell Script: Start Frontend Server
# AI Study Assistant - Frontend Launcher for Windows

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  AI Study Assistant - Frontend Server Launcher                     ║" -ForegroundColor Cyan
Write-Host "║  React + Tailwind + Framer Motion                                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$frontendPath = "C:\ai-agent\frontend"
$port = 3000

# Check if already running
Write-Host "[*] Checking if port $port is already in use..." -ForegroundColor Yellow
$existingProcess = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "[-] Port $port is already in use!" -ForegroundColor Red
    Write-Host "[*] Attempting to kill existing Node processes..." -ForegroundColor Yellow
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
    Start-Sleep -Seconds 2
}

# Check frontend directory
if (-not (Test-Path (Join-Path $frontendPath 'package.json'))) {
    Write-Host "[-] Frontend project not found at: $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host "[+] Frontend project found: $frontendPath" -ForegroundColor Green
Write-Host ""

# Install dependencies if needed
if (-not (Test-Path (Join-Path $frontendPath 'node_modules'))) {
    Write-Host "[*] Installing dependencies (npm install)..." -ForegroundColor Yellow
    cd $frontendPath
    npm install
    Write-Host ""
}

# Start React dev server
Write-Host "[*] Starting React development server..." -ForegroundColor Cyan
Write-Host "[*] Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend will be available at: http://localhost:$port" -ForegroundColor Green
Write-Host ""

cd $frontendPath
npm start

Write-Host ""
Write-Host "[!] Frontend server stopped." -ForegroundColor Yellow
