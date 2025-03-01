# Check for OPENAI_API_KEY
if (-not $env:OPENAI_API_KEY) {
    # Try to read from .env.test file
    if (Test-Path "__tests__/.env.test") {
        $envContent = Get-Content "__tests__/.env.test" -Raw
        if ($envContent -match "OPENAI_API_KEY=([^\r\n]*)") {
            $env:OPENAI_API_KEY = $matches[1]
            Write-Host "OPENAI_API_KEY set from .env.test file."
        }
    }
    
    # If still not set, prompt user
    if (-not $env:OPENAI_API_KEY) {
        $apiKey = Read-Host "Please enter your OpenAI API key for testing"
        $env:OPENAI_API_KEY = $apiKey
    }
}

# Set default model if not specified
if (-not $env:OPENAI_DEFAULT_MODEL) {
    $env:OPENAI_DEFAULT_MODEL = "gpt-3.5-turbo"
    Write-Host "Set OPENAI_DEFAULT_MODEL to gpt-3.5-turbo for testing."
}

Write-Host "Running AI Provider Integration tests..."

# Navigate to project root
$currentDir = Get-Location
$rootDir = $currentDir
while (-not (Test-Path (Join-Path $rootDir "package.json")) -and $rootDir -ne $null) {
    $rootDir = Split-Path $rootDir -Parent
}

if (-not (Test-Path (Join-Path $rootDir "package.json"))) {
    Write-Host "Could not find project root (package.json). Using current directory."
    $rootDir = $currentDir
}

# Run mock integration tests
Write-Host "Running mock integration tests..."
Set-Location $rootDir
npx jest "src/modules/ai-provider/__tests__/integration/ai-provider-mock-integration.spec.ts" --verbose

# Run actual integration tests
Write-Host "Running actual integration tests..."
npx jest "src/modules/ai-provider/__tests__/integration/ai-provider-real-integration.spec.ts" --verbose

# Return to original directory
Set-Location $currentDir

Write-Host "All integration tests completed." 