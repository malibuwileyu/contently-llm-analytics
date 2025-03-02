# PowerShell script to run AI provider tests

# Check if OPENAI_API_KEY is set
if (-not $env:OPENAI_API_KEY) {
    Write-Host "Warning: OPENAI_API_KEY environment variable is not set." -ForegroundColor Yellow
    Write-Host "Some tests will be skipped. Set this variable to run all tests." -ForegroundColor Yellow
    
    # Prompt user if they want to set the API key for this session
    $setKey = Read-Host "Do you want to set OPENAI_API_KEY for this session? (y/n)"
    if ($setKey -eq "y") {
        $apiKey = Read-Host "Enter your OpenAI API key"
        $env:OPENAI_API_KEY = $apiKey
        Write-Host "OPENAI_API_KEY set for this session." -ForegroundColor Green
    }
}

# Optional: Set other configuration variables
if (-not $env:OPENAI_DEFAULT_MODEL) {
    # Use a smaller model for testing to reduce costs
    $env:OPENAI_DEFAULT_MODEL = "gpt-3.5-turbo"
    Write-Host "Set OPENAI_DEFAULT_MODEL to gpt-3.5-turbo for testing." -ForegroundColor Cyan
}

# Run the tests
Write-Host "Running AI Provider tests..." -ForegroundColor Cyan

# Run mock tests first (these don't require API keys)
Write-Host "Running mock tests..." -ForegroundColor Cyan
npx jest --config jest.config.js "src/modules/ai-provider/__tests__/services/ai-provider-factory.mock.spec.ts" --verbose

# Run actual API tests if API key is available
if ($env:OPENAI_API_KEY) {
    Write-Host "Running API integration tests..." -ForegroundColor Cyan
    npx jest --config jest.config.js "src/modules/ai-provider/__tests__/services/openai-provider.service.spec.ts" --verbose
    npx jest --config jest.config.js "src/modules/ai-provider/__tests__/services/ai-provider-factory.service.spec.ts" --verbose
    npx jest --config jest.config.js "src/modules/ai-provider/__tests__/runners/ai-provider.runner.spec.ts" --verbose
} else {
    Write-Host "Skipping API integration tests due to missing OPENAI_API_KEY." -ForegroundColor Yellow
}

# Run module tests
Write-Host "Running module tests..." -ForegroundColor Cyan
npx jest --config jest.config.js "src/modules/ai-provider/__tests__/ai-provider.module.spec.ts" --verbose

Write-Host "All tests completed." -ForegroundColor Green 