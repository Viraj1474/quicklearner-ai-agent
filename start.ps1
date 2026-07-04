#!/usr/bin/env pwsh
# AI Study Assistant - Start Both Frontend and Backend

$root = $PSScriptRoot
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"
$pythonExe = Join-Path $root ".venv\Scripts\python.exe"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AI Study Assistant - Full Stack" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $pythonExe)) {
    Write-Host "[-] Root virtual environment not found: $pythonExe" -ForegroundColor Red
    Write-Host "[*] Create it with: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

Write-Host "[*] Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null

Write-Host "[+] Starting Backend Server on http://localhost:8000" -ForegroundColor Green
$backendProcess = Start-Process -NoNewWindow -FilePath $pythonExe -ArgumentList (Join-Path $backendPath "run_backend_simple.py") -WorkingDirectory $backendPath -PassThru
Start-Sleep -Seconds 3

Write-Host "[*] Testing backend API..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop | Out-Null
    Write-Host "[+] Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "[-] Backend not responding yet, but continuing..." -ForegroundColor Yellow
}

Write-Host "[+] Starting Frontend Server on http://localhost:3000" -ForegroundColor Green
$frontendProcess = Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$frontendPath`" && npm start" -PassThru

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow

$backendProcess | Wait-Process
$frontendProcess | Wait-Process