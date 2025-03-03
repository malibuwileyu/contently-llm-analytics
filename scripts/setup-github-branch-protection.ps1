# PowerShell script to set up GitHub branch protection rules
# Prerequisites: GitHub CLI (gh) must be installed and authenticated

param(
    [string]$repoName = "",
    [string]$branchName = "main"
)

# Check if GitHub CLI is installed
$ghInstalled = $null
try {
    $ghInstalled = Get-Command gh -ErrorAction Stop
} catch {
    Write-Error "GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/"
    exit 1
}

# Check if user is authenticated with GitHub CLI
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "You are not authenticated with GitHub CLI. Please run 'gh auth login' first."
    exit 1
}

# If repo name is not provided, try to get it from the current directory
if ([string]::IsNullOrEmpty($repoName)) {
    $remoteUrl = git config --get remote.origin.url
    if ([string]::IsNullOrEmpty($remoteUrl)) {
        Write-Error "Could not determine repository name. Please provide it as a parameter."
        exit 1
    }
    
    # Extract repo name from remote URL
    if ($remoteUrl -match "github\.com[:/](.+)/(.+)(?:\.git)?$") {
        $owner = $matches[1]
        $repo = $matches[2] -replace "\.git$", ""
        $repoName = "$owner/$repo"
    } else {
        Write-Error "Could not parse repository name from git remote URL. Please provide it as a parameter."
        exit 1
    }
}

Write-Host "Setting up branch protection rules for $repoName on branch $branchName..."

# Create branch protection rule
$branchProtectionRule = @{
    pattern = $branchName
    required_status_checks = @{
        strict = $true
        contexts = @("lint", "test", "build")
    }
    required_pull_request_reviews = @{
        dismiss_stale_reviews = $true
        require_code_owner_reviews = $true
        required_approving_review_count = 1
    }
    enforce_admins = $true
    restrictions = $null
}

# Convert to JSON
$branchProtectionRuleJson = $branchProtectionRule | ConvertTo-Json -Depth 10

# Create a temporary file for the JSON
$tempFile = New-TemporaryFile
$branchProtectionRuleJson | Out-File -FilePath $tempFile.FullName -Encoding utf8

# Apply branch protection rule using GitHub CLI
Write-Host "Applying branch protection rule..."
gh api --method PUT "repos/$repoName/branches/$branchName/protection" -F "$($tempFile.FullName)"

# Check if the command was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Branch protection rules have been successfully set up for $branchName branch in $repoName."
} else {
    Write-Error "Failed to set up branch protection rules."
}

# Clean up
Remove-Item $tempFile.FullName

Write-Host "Done!"