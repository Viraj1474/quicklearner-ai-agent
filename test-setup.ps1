# PowerShell Test Script - Validate the full stack setup
# AI Study Assistant - Startup & Health Check

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  AI Study Assistant - System Validation                           ║" -ForegroundColor Cyan
Write-Host "║  Testing Backend + Frontend + API Integration                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "http://localhost:8000"
$frontendUrl = "http://localhost:3000"
$testsPassed = 0
$testsFailed = 0

# Test 1: Backend Health Check
Write-Host "[TEST 1] Backend Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Method Get -Uri "$backendUrl/health" -TimeoutSec 5
    if ($response.status -eq "healthy") {
        Write-Host "✓ Backend is healthy!" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "✗ Backend returned unhealthy status" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ Backend not responding. Is it running?" -ForegroundColor Red
    Write-Host "  Try: .\start-backend.ps1" -ForegroundColor Yellow
    $testsFailed++
}
Write-Host ""

# Test 2: Frontend Connectivity
Write-Host "[TEST 2] Frontend Server Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Frontend is running!" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "✗ Frontend returned status $($response.StatusCode)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ Frontend not responding. Is it running?" -ForegroundColor Red
    Write-Host "  Try: .\start-frontend.ps1" -ForegroundColor Yellow
    $testsFailed++
}
Write-Host ""

# Test 3: Chat API Endpoint
Write-Host "[TEST 3] Chat API Endpoint" -ForegroundColor Yellow
try {
    $body = @{
        message = "Hello, can you help me study?"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Method Post `
        -Uri "$backendUrl/api/chat" `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 10
    
    if ($response.message -and $response.message.Length -gt 0) {
        Write-Host "✓ Chat API is working!" -ForegroundColor Green
        Write-Host "  Response: $($response.message.Substring(0, [Math]::Min(100, $response.message.Length)))..." -ForegroundColor Cyan
        $testsPassed++
    } else {
        Write-Host "✗ Chat API returned empty response" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ Chat API test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure backend is running and configured correctly" -ForegroundColor Yellow
    $testsFailed++
}
Write-Host ""

# Test 4: API Documentation
Write-Host "[TEST 4] API Documentation (Swagger)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/docs" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Swagger API docs available at: $backendUrl/docs" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "✗ API docs not available" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "✗ Cannot access API docs" -ForegroundColor Red
    $testsFailed++
}
Write-Host ""

# Summary
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Test Results                                                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Passed: " -NoNewline
Write-Host "$testsPassed" -ForegroundColor Green

Write-Host "Failed: " -NoNewline
if ($testsFailed -eq 0) {
    Write-Host "$testsFailed" -ForegroundColor Green
} else {
    Write-Host "$testsFailed" -ForegroundColor Red
}

Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "✓ All tests passed! System is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend: $frontendUrl" -ForegroundColor Cyan
    Write-Host "Backend:  $backendUrl" -ForegroundColor Cyan
    Write-Host "API Docs: $backendUrl/docs" -ForegroundColor Cyan
} else {
    Write-Host "✗ Some tests failed. Please check the errors above." -ForegroundColor Red
}

Write-Host ""
