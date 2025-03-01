# Run all tests and save output to a file
# This script attempts to run all tests and saves the output to a text file

Write-Host "Running all tests for Contently LLM Analytics with output logging..." -ForegroundColor Cyan
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
$outputFile = "$outputDir/all-test-results_$timestamp.txt"

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
Contently LLM Analytics Test Results
===============================================
Date: $(Get-Date)
Environment: $env:NODE_ENV
===============================================

"@ | Out-File -FilePath $outputFile -Encoding utf8

# Initialize result variables
$unitTestResult = -1
$integrationTestResult = -1
$e2eTestResult = -1

# Run unit tests
Write-Host "`nRunning unit tests..." -ForegroundColor Green
@"
===============================================
Unit Tests
===============================================

"@ | Out-File -FilePath $outputFile -Append -Encoding utf8

try {
    $unitTestOutput = npx jest --testPathIgnorePatterns="integration|e2e" 2>&1
    $unitTestResult = $LASTEXITCODE
    $unitTestOutput | Out-File -FilePath $outputFile -Append -Encoding utf8
} catch {
    "Error running unit tests: $_" | Out-File -FilePath $outputFile -Append -Encoding utf8
    $unitTestResult = 1
}

# Run integration tests
Write-Host "`nRunning integration tests..." -ForegroundColor Green
@"

===============================================
Integration Tests
===============================================

"@ | Out-File -FilePath $outputFile -Append -Encoding utf8

try {
    $integrationTestOutput = npx jest --testMatch="**/__tests__/integration/**/*.spec.ts" 2>&1
    $integrationTestResult = $LASTEXITCODE
    $integrationTestOutput | Out-File -FilePath $outputFile -Append -Encoding utf8
} catch {
    "Error running integration tests: $_" | Out-File -FilePath $outputFile -Append -Encoding utf8
    $integrationTestResult = 1
}

# Run E2E tests
Write-Host "`nRunning E2E tests..." -ForegroundColor Green
@"

===============================================
E2E Tests
===============================================

"@ | Out-File -FilePath $outputFile -Append -Encoding utf8

try {
    $e2eTestOutput = npx jest --config=jest-e2e.config.js 2>&1
    $e2eTestResult = $LASTEXITCODE
    $e2eTestOutput | Out-File -FilePath $outputFile -Append -Encoding utf8
} catch {
    "Error running E2E tests: $_" | Out-File -FilePath $outputFile -Append -Encoding utf8
    $e2eTestResult = 1
}

# Add summary to the output file
@"

===============================================
Test Summary
===============================================
Unit Tests: $(if ($unitTestResult -eq 0) { "PASSED" } else { "FAILED" })
Integration Tests: $(if ($integrationTestResult -eq 0) { "PASSED" } else { "FAILED" })
E2E Tests: $(if ($e2eTestResult -eq 0) { "PASSED" } else { "FAILED" })
Overall Status: $(if (($unitTestResult -eq 0) -and ($integrationTestResult -eq 0) -and ($e2eTestResult -eq 0)) { "PASSED" } else { "FAILED" })
Output File: $outputFile
===============================================
"@ | Out-File -FilePath $outputFile -Append -Encoding utf8

# Display summary in console
Write-Host "`nTest Summary:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan

if ($unitTestResult -eq 0) {
    Write-Host "Unit Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "Unit Tests: FAILED" -ForegroundColor Red
}

if ($integrationTestResult -eq 0) {
    Write-Host "Integration Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "Integration Tests: FAILED" -ForegroundColor Red
}

if ($e2eTestResult -eq 0) {
    Write-Host "E2E Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "E2E Tests: FAILED" -ForegroundColor Red
}

Write-Host "`nTest results saved to: $outputFile" -ForegroundColor Yellow

# Overall result
if (($unitTestResult -eq 0) -and ($integrationTestResult -eq 0) -and ($e2eTestResult -eq 0)) {
    Write-Host "`nAll tests PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome tests FAILED!" -ForegroundColor Red
    exit 1
} 