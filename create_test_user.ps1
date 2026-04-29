# Create Test User and Get Auth Token
# This script registers a test user and retrieves an access token

$API_URL = "http://localhost:8000"

Write-Host "=== Creating Test User ===" -ForegroundColor Cyan

# Test user credentials
$email = "test@example.com"
$password = "TestPassword123!"
$name = "Test User"

# Register user
Write-Host "`nRegistering user: $email" -ForegroundColor Yellow

$registerBody = @{
    email = $email
    password = $password
    name = $name
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Method Post `
        -Uri "$API_URL/api/auth/register" `
        -Body $registerBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✓ User registered successfully!" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.user.id)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "⚠ User already exists, attempting login..." -ForegroundColor Yellow
    } else {
        Write-Host "✗ Registration failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Login to get token
Write-Host "`nLogging in..." -ForegroundColor Yellow

$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Method Post `
        -Uri "$API_URL/api/auth/login" `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "`n=== AUTH TOKEN ===" -ForegroundColor Cyan
    Write-Host $loginResponse.access_token -ForegroundColor White
    Write-Host "`n=== REFRESH TOKEN ===" -ForegroundColor Cyan
    Write-Host $loginResponse.refresh_token -ForegroundColor White
    
    # Save to file for easy access
    $tokenData = @{
        access_token = $loginResponse.access_token
        refresh_token = $loginResponse.refresh_token
        email = $email
        created_at = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    } | ConvertTo-Json
    
    $tokenData | Out-File -FilePath "test_user_token.json" -Encoding UTF8
    Write-Host "`n✓ Token saved to: test_user_token.json" -ForegroundColor Green
    
    # Test the token
    Write-Host "`nTesting token with /api/auth/me..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.access_token)"
    }
    
    $meResponse = Invoke-RestMethod -Method Get `
        -Uri "$API_URL/api/auth/me" `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Token is valid!" -ForegroundColor Green
    Write-Host "User: $($meResponse.name) ($($meResponse.email))" -ForegroundColor Gray
    Write-Host "Role: $($meResponse.role)" -ForegroundColor Gray
    Write-Host "Premium: $($meResponse.is_premium)" -ForegroundColor Gray
    
    # Test chat endpoint
    Write-Host "`nTesting chat endpoint..." -ForegroundColor Yellow
    $chatBody = @{
        message = "Hello, this is a test message!"
    } | ConvertTo-Json
    
    $chatResponse = Invoke-RestMethod -Method Post `
        -Uri "$API_URL/api/chat" `
        -Headers $headers `
        -Body $chatBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✓ Chat endpoint works!" -ForegroundColor Green
    Write-Host "Response: $($chatResponse.message.Substring(0, [Math]::Min(100, $chatResponse.message.Length)))..." -ForegroundColor Gray
    
    Write-Host "`n=== SUCCESS ===" -ForegroundColor Green
    Write-Host "You can now use this token in your frontend." -ForegroundColor White
    Write-Host "Store it in localStorage as 'access_token'" -ForegroundColor White
    
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    Write-Host $_.Exception.Response -ForegroundColor Red
    exit 1
}
