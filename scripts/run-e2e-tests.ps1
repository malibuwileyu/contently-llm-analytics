# Run E2E Tests
# This script runs the end-to-end tests for the AI analytics workflow

Write-Host "Running E2E tests for AI analytics workflow..." -ForegroundColor Cyan

# Set environment variables for testing
$env:NODE_ENV = "test"

# Create .env.test file if it doesn't exist
$envTestPath = "test/.env.test"
if (-not (Test-Path $envTestPath)) {
    Write-Host "Creating test environment file at $envTestPath" -ForegroundColor Yellow
    @"
# Test environment variables
OPENAI_API_KEY=test-api-key
OPENAI_DEFAULT_MODEL=gpt-3.5-turbo
OPENAI_DEFAULT_TEMPERATURE=0.7
OPENAI_TIMEOUT_MS=30000
OPENAI_MAX_RETRIES=3
"@ | Out-File -FilePath $envTestPath -Encoding utf8
}

# Run the tests
Write-Host "Starting Jest E2E tests..." -ForegroundColor Green
npx jest --config jest-e2e.config.js test/e2e/ai-analytics-workflow.e2e-spec.ts --verbose

# Check if tests passed
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ E2E tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ E2E tests failed with exit code $LASTEXITCODE" -ForegroundColor Red
} 