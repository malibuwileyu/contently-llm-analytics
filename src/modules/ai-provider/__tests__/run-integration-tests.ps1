# PowerShell script to run AI provider integration tests

# Check if OPENAI_API_KEY is set
if (-not $env:OPENAI_API_KEY) {
    Write-Host "Using OPENAI_API_KEY from .env.test file..." -ForegroundColor Yellow
    
    # Check if .env.test exists
    if (Test-Path ".env.test") {
        # Read the .env.test file and extract the API key
        $envContent = Get-Content ".env.test" -Raw
        if ($envContent -match "OPENAI_API_KEY=([^\r\n]+)") {
            $apiKey = $matches[1]
            $env:OPENAI_API_KEY = $apiKey
            Write-Host "OPENAI_API_KEY set from .env.test file." -ForegroundColor Green
        } else {
            Write-Host "Could not find OPENAI_API_KEY in .env.test file." -ForegroundColor Red
            Write-Host "Please set the OPENAI_API_KEY environment variable or add it to .env.test." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Warning: .env.test file not found." -ForegroundColor Yellow
        Write-Host "Please set the OPENAI_API_KEY environment variable or create a .env.test file." -ForegroundColor Yellow
        
        # Prompt user if they want to set the API key for this session
        $setKey = Read-Host "Do you want to set OPENAI_API_KEY for this session? (y/n)"
        if ($setKey -eq "y") {
            $apiKey = Read-Host "Enter your OpenAI API key"
            $env:OPENAI_API_KEY = $apiKey
            Write-Host "OPENAI_API_KEY set for this session." -ForegroundColor Green
        } else {
            Write-Host "Exiting..." -ForegroundColor Red
            exit 1
        }
    }
}

# Optional: Set other configuration variables
if (-not $env:OPENAI_DEFAULT_MODEL) {
    # Use a smaller model for testing to reduce costs
    $env:OPENAI_DEFAULT_MODEL = "gpt-3.5-turbo"
    Write-Host "Set OPENAI_DEFAULT_MODEL to gpt-3.5-turbo for testing." -ForegroundColor Cyan
}

# Run the tests
Write-Host "Running AI Provider Integration tests..." -ForegroundColor Cyan

# Navigate to the project root directory
$currentDir = Get-Location
$rootDir = $currentDir
while (-not (Test-Path (Join-Path $rootDir "package.json"))) {
    $rootDir = Split-Path $rootDir -Parent
    if (-not $rootDir) {
        Write-Host "Could not find project root directory." -ForegroundColor Red
        exit 1
    }
}

# Run mock integration tests first (these don't make actual API calls)
Write-Host "Running mock integration tests..." -ForegroundColor Cyan
Set-Location $rootDir
npx jest "src/modules/ai-provider/__tests__/integration/ai-provider-mock-integration.spec.ts" --verbose

# Run actual integration tests if API key is available
Write-Host "Running actual integration tests..." -ForegroundColor Cyan
npx jest "src/modules/ai-provider/__tests__/integration" --testPathIgnorePatterns="mock" --verbose

# Return to the original directory
Set-Location $currentDir

Write-Host "All integration tests completed." -ForegroundColor Green 