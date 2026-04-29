# Start Backend Server (PowerShell)

Write-Host ""
Write-Host "AI Study Assistant - Backend Server Launcher" -ForegroundColor Cyan
Write-Host ""

$backendPath = "C:\ai-agent\backend"
$pythonCandidates = @(
    "C:\ai-agent\.venv\Scripts\python.exe",
    "$backendPath\venv\Scripts\python.exe"
)
$pythonExe = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
$launcher = "$backendPath\run_backend_simple.py"
$port = 8000

Write-Host "[*] Checking if port $port is already in use..." -ForegroundColor Yellow
$existingProcess = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($existingProcess) {
    Write-Host "[-] Port $port is already in use. Stopping existing python processes..." -ForegroundColor Yellow
    Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
}

if (-not $pythonExe) {
    Write-Host "[-] Python virtualenv not found in expected locations:" -ForegroundColor Red
    $pythonCandidates | ForEach-Object { Write-Host "    - $_" -ForegroundColor DarkGray }
    Write-Host "[*] Please run: cd C:\ai-agent; python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

Write-Host "[+] Python executable found: $pythonExe" -ForegroundColor Green
Write-Host "[+] Using launcher: $launcher" -ForegroundColor Green
Write-Host ""

Set-Location $backendPath
& $pythonExe $launcher

Write-Host ""
Write-Host "[!] Backend server stopped." -ForegroundColor Yellow
