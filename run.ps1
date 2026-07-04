#!/usr/bin/env pwsh
# AI Study Assistant - Run Both Frontend and Backend

$startScript = Join-Path $PSScriptRoot "start.ps1"
if (Test-Path $startScript) {
    & $startScript
    exit $LASTEXITCODE
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AI Study Assistant - Full Stack" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing processes on ports
Write-Host "[*] Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
Start-Sleep -Seconds 2

