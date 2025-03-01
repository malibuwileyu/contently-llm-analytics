# PowerShell script to verify CI/CD setup

Write-Host "Verifying CI/CD setup..." -ForegroundColor Cyan

# Check if Husky is installed
Write-Host "Checking Husky installation..." -ForegroundColor Cyan
if (Test-Path ".husky") {
    Write-Host "✅ Husky is installed" -ForegroundColor Green
} else {
    Write-Host "❌ Husky is not installed. Run 'npm run prepare' to install it." -ForegroundColor Red
}

# Check Husky hooks
Write-Host "Checking Husky hooks..." -ForegroundColor Cyan
$hooksToCheck = @("pre-commit", "pre-push", "commit-msg")
foreach ($hook in $hooksToCheck) {
    if (Test-Path ".husky/$hook") {
        Write-Host "✅ $hook hook is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ $hook hook is missing" -ForegroundColor Red
    }
}

# Check GitHub workflow files
Write-Host "Checking GitHub workflow files..." -ForegroundColor Cyan
$workflowsToCheck = @("ci.yml", "cd.yml")
foreach ($workflow in $workflowsToCheck) {
    if (Test-Path ".github/workflows/$workflow") {
        Write-Host "✅ $workflow is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ $workflow is missing" -ForegroundColor Red
    }
}

# Check GitHub templates
Write-Host "Checking GitHub templates..." -ForegroundColor Cyan
if (Test-Path ".github/PULL_REQUEST_TEMPLATE.md") {
    Write-Host "✅ Pull request template is configured" -ForegroundColor Green
} else {
    Write-Host "❌ Pull request template is missing" -ForegroundColor Red
}

if (Test-Path ".github/ISSUE_TEMPLATE") {
    Write-Host "✅ Issue templates are configured" -ForegroundColor Green
} else {
    Write-Host "❌ Issue templates are missing" -ForegroundColor Red
}

if (Test-Path ".github/CODEOWNERS") {
    Write-Host "✅ CODEOWNERS file is configured" -ForegroundColor Green
} else {
    Write-Host "❌ CODEOWNERS file is missing" -ForegroundColor Red
}

# Check npm scripts
Write-Host "Checking npm scripts..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$scriptsToCheck = @("test:all", "test:all:cov", "fix:lint")
foreach ($script in $scriptsToCheck) {
    if ($packageJson.scripts.$script) {
        Write-Host "✅ $script script is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ $script script is missing" -ForegroundColor Red
    }
}

# Check documentation
Write-Host "Checking documentation..." -ForegroundColor Cyan
$docsToCheck = @("ci-cd-pipeline-guide.md", "ci-cd-setup-checklist.md")
foreach ($doc in $docsToCheck) {
    if (Test-Path "docs/$doc") {
        Write-Host "✅ $doc is available" -ForegroundColor Green
    } else {
        Write-Host "❌ $doc is missing" -ForegroundColor Red
    }
}

# Final summary
Write-Host "`nCI/CD Setup Verification Summary:" -ForegroundColor Cyan
Write-Host "1. Complete the remaining tasks in docs/ci-cd-setup-checklist.md" -ForegroundColor Yellow
Write-Host "2. Update the CODEOWNERS file with actual GitHub usernames" -ForegroundColor Yellow
Write-Host "3. Set up branch protection rules using the setup-github-branch-protection.ps1 script" -ForegroundColor Yellow
Write-Host "4. Create a test PR to verify the CI workflow" -ForegroundColor Yellow
Write-Host "5. Merge the PR to verify the CD workflow" -ForegroundColor Yellow

Write-Host "`nFor more information, see docs/ci-cd-pipeline-guide.md" -ForegroundColor Cyan