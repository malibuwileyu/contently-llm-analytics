# Run E2E tests and save output to a file
# This script runs the AI analytics workflow E2E tests and saves the output to a text file

Write-Host "Running E2E tests for Contently LLM Analytics with output logging..." -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Set environment variables
$env:NODE_ENV = "test"

# Create output directory if it doesn't exist
$outputDir = "test-results"
if (-not (Test-Path $outputDir)) {
    Write-Host "Creating output directory at $outputDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Set timestamp for the output file
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$outputFile = "$outputDir/e2e-test-results_$timestamp.txt"

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

# Run header information to the output file
@"
===============================================
Contently LLM Analytics E2E Test Results
===============================================
Date: $(Get-Date)
Test: AI Analytics Workflow E2E
Environment: $env:NODE_ENV
===============================================

"@ | Out-File -FilePath $outputFile -Encoding utf8

# Run our custom E2E tests and capture output
Write-Host "`nRunning AI Analytics Workflow E2E tests..." -ForegroundColor Green
$testOutput = npx jest --config=jest-e2e.config.js "test/e2e/ai-analytics-workflow.e2e-spec.ts" --verbose
$testExitCode = $LASTEXITCODE

# Save test output to file
$testOutput | Out-File -FilePath $outputFile -Append -Encoding utf8

# Add summary to the output file
@"

===============================================
Test Summary
===============================================
Exit Code: $testExitCode
Status: $(if ($testExitCode -eq 0) { "PASSED" } else { "FAILED" })
Output File: $outputFile
===============================================
"@ | Out-File -FilePath $outputFile -Append -Encoding utf8

# Display summary in console
Write-Host "`nTest Summary:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan

if ($testExitCode -eq 0) {
    Write-Host "AI Analytics Workflow E2E Tests: PASSED" -ForegroundColor Green
    Write-Host "`nAll tests PASSED!" -ForegroundColor Green
} else {
    Write-Host "AI Analytics Workflow E2E Tests: FAILED" -ForegroundColor Red
    Write-Host "`nSome tests FAILED!" -ForegroundColor Red
}

Write-Host "`nTest results saved to: $outputFile" -ForegroundColor Yellow

exit $testExitCode 