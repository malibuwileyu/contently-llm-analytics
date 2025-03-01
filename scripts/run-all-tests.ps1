# Run all tests (unit, integration, and E2E)
# This script runs all tests in sequence and reports the results

Write-Host "Running all tests (unit, integration, and E2E)..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Set environment variables
$env:NODE_ENV = "test"

# Check if .env.test exists, create it if it doesn't
if (-not (Test-Path .env.test)) {
    Write-Host "Creating .env.test file with test environment variables..." -ForegroundColor Yellow
    @"
OPENAI_API_KEY=sk-test-key
OPENAI_DEFAULT_MODEL=gpt-4
OPENAI_DEFAULT_TEMPERATURE=0.7
OPENAI_TIMEOUT_MS=30000
OPENAI_MAX_RETRIES=3
"@ | Out-File -FilePath .env.test -Encoding utf8
}

# Run unit tests
Write-Host "`nRunning unit tests..." -ForegroundColor Green
npx jest --testPathIgnorePatterns="integration|e2e"
$unitTestsExitCode = $LASTEXITCODE

# Run integration tests
Write-Host "`nRunning integration tests..." -ForegroundColor Green
npx jest --testMatch="**/*integration*.spec.ts"
$integrationTestsExitCode = $LASTEXITCODE

# Run E2E tests
Write-Host "`nRunning E2E tests..." -ForegroundColor Green
npx jest --config=jest-e2e.config.js
$e2eTestsExitCode = $LASTEXITCODE

# Display summary
Write-Host "`nTest Summary:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan

if ($unitTestsExitCode -eq 0) {
    Write-Host "Unit Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "Unit Tests: FAILED" -ForegroundColor Red
}

if ($integrationTestsExitCode -eq 0) {
    Write-Host "Integration Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "Integration Tests: FAILED" -ForegroundColor Red
}

if ($e2eTestsExitCode -eq 0) {
    Write-Host "E2E Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "E2E Tests: FAILED" -ForegroundColor Red
}

# Overall status
$overallExitCode = [Math]::Max($unitTestsExitCode, [Math]::Max($integrationTestsExitCode, $e2eTestsExitCode))

if ($overallExitCode -eq 0) {
    Write-Host "`nAll tests PASSED!" -ForegroundColor Green
} else {
    Write-Host "`nSome tests FAILED!" -ForegroundColor Red
}

exit $overallExitCode