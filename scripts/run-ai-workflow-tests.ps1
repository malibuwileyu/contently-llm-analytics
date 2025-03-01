# Run AI Analytics Workflow E2E tests with detailed output
# This script runs only the AI analytics workflow E2E tests with detailed output

Write-Host "Running AI Analytics Workflow E2E tests with detailed output..." -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Set environment variables
$env:NODE_ENV = "test"
$env:DEBUG = "true"  # Enable debug output

# Create output directory if it doesn't exist
$outputDir = "test-results"
if (-not (Test-Path $outputDir)) {
    Write-Host "Creating output directory at $outputDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Set timestamp for the output file
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$outputFile = "$outputDir/ai-workflow-test-results_$timestamp.txt"

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
AI Analytics Workflow E2E Test Results
===============================================
Date: $(Get-Date)
Test: AI Analytics Workflow E2E
Environment: $env:NODE_ENV
Debug Mode: Enabled
===============================================

"@ | Out-File -FilePath $outputFile -Encoding utf8

# Run our AI workflow E2E tests with detailed output
Write-Host "`nRunning AI Analytics Workflow E2E tests..." -ForegroundColor Green
$testOutput = npx jest --config=jest-e2e.config.js "test/e2e/ai-analytics-workflow.e2e-spec.ts" --verbose --detectOpenHandles --runInBand 2>&1
$testExitCode = $LASTEXITCODE

# Save test output to file
$testOutput | Out-File -FilePath $outputFile -Append -Encoding utf8

# Add test details to the output file
@"

===============================================
Test Details
===============================================
"@ | Out-File -FilePath $outputFile -Append -Encoding utf8

# Get the test file content and append to output
$testFilePath = "test/e2e/ai-analytics-workflow.e2e-spec.ts"
if (Test-Path $testFilePath) {
    @"
Test File: $testFilePath
Content:
-----------------------------------------------
$(Get-Content $testFilePath -Raw)
-----------------------------------------------

"@ | Out-File -FilePath $outputFile -Append -Encoding utf8
}

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

Write-Host "`nDetailed test results saved to: $outputFile" -ForegroundColor Yellow

exit $testExitCode 