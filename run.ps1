#!/usr/bin/env pwsh
# AI Study Assistant - Run Both Frontend and Backend

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AI Study Assistant - Full Stack" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing processes on ports
Write-Host "[*] Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "[+] Starting Backend Server on http://localhost:8000" -ForegroundColor Green
$backendProcess = Start-Process -NoNewWindow -FilePath "C:\ai-agent\backend\venv\Scripts\python.exe" -ArgumentList "C:\ai-agent\backend\main.py" -PassThru
Start-Sleep -Seconds 3

# Test if backend is running
Write-Host "[*] Testing backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[+] Backend is running!" -ForegroundColor Green
    Write-Host "    Response: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[-] Backend not responding yet, but continuing..." -ForegroundColor Yellow
}

# Start Frontend Server
Write-Host "[+] Starting Frontend Server on http://localhost:3000" -ForegroundColor Green
Write-Host ""
$frontendProcess = Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c cd C:\ai-agent\frontend && npm start" -PassThru
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Wait for processes
$backendProcess | Wait-Process
$frontendProcess | Wait-Process
