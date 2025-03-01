# PowerShell script to verify that app data symbolic links are working correctly

# Define paths to check
$pathsToCheck = @(
    # Cursor paths
    @{
        Path = "$env:APPDATA\Cursor"
        Name = "Cursor (Roaming AppData)"
        ExpectedTarget = "J:\AppData\Cursor"
    },
    @{
        Path = "$env:LOCALAPPDATA\cursor-updater"
        Name = "Cursor Updater (Local AppData)"
        ExpectedTarget = "J:\AppData\CursorLocal"
    },
    @{
        Path = "$env:LOCALAPPDATA\Programs\cursor"
        Name = "Cursor Programs (Local AppData)"
        ExpectedTarget = "J:\AppData\CursorPrograms"
    },
    # Docker paths
    @{
        Path = "$env:APPDATA\Docker"
        Name = "Docker (Roaming AppData)"
        ExpectedTarget = "J:\AppData\Docker"
    },
    @{
        Path = "$env:APPDATA\Docker Desktop"
        Name = "Docker Desktop (Roaming AppData)"
        ExpectedTarget = "J:\AppData\DockerDesktop"
    },
    @{
        Path = "C:\ProgramData\DockerDesktop"
        Name = "Docker Desktop (ProgramData)"
        ExpectedTarget = "J:\AppData\DockerProgramData"
    },
    @{
        Path = "$env:USERPROFILE\.docker"
        Name = "Docker User Config"
        ExpectedTarget = "J:\AppData\DockerUser"
    }
)

# Function to check if a path is a symbolic link and points to the expected target
function Test-SymbolicLink {
    param (
        [string]$Path,
        [string]$Name,
        [string]$ExpectedTarget
    )

    Write-Host "Checking $Name..." -NoNewline

    if (-not (Test-Path $Path -ErrorAction SilentlyContinue)) {
        Write-Host " [NOT FOUND]" -ForegroundColor Yellow
        return $false
    }

    $item = Get-Item $Path -Force
    if (-not ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
        Write-Host " [NOT A SYMLINK]" -ForegroundColor Red
        return $false
    }

    # Get the target of the symbolic link
    $targetPath = $null
    try {
        $targetPath = [System.IO.Path]::GetFullPath(
            [System.IO.Path]::Combine(
                [System.IO.Path]::GetDirectoryName($Path),
                [System.IO.Directory]::GetDirectoryRoot($Path)
            )
        )
    } catch {
        # Use alternative method to get target
        $targetPath = (Get-Item $Path).Target
    }

    # Check if target matches expected target
    if ($targetPath -eq $ExpectedTarget) {
        Write-Host " [OK]" -ForegroundColor Green
        return $true
    } else {
        Write-Host " [WRONG TARGET: $targetPath]" -ForegroundColor Red
        return $false
    }
}

# Function to check if J: drive directories exist and have content
function Test-JDriveDirectories {
    $jDriveDirs = @(
        @{ Path = "J:\AppData\Cursor"; Name = "Cursor (J: Drive)" },
        @{ Path = "J:\AppData\CursorLocal"; Name = "Cursor Updater (J: Drive)" },
        @{ Path = "J:\AppData\CursorPrograms"; Name = "Cursor Programs (J: Drive)" },
        @{ Path = "J:\AppData\Docker"; Name = "Docker (J: Drive)" },
        @{ Path = "J:\AppData\DockerDesktop"; Name = "Docker Desktop (J: Drive)" },
        @{ Path = "J:\AppData\DockerProgramData"; Name = "Docker ProgramData (J: Drive)" },
        @{ Path = "J:\AppData\DockerUser"; Name = "Docker User Config (J: Drive)" }
    )

    Write-Host "`nChecking J: drive directories..."
    foreach ($dir in $jDriveDirs) {
        Write-Host "Checking $($dir.Name)..." -NoNewline
        if (Test-Path $dir.Path) {
            $fileCount = (Get-ChildItem -Path $dir.Path -Recurse -File -ErrorAction SilentlyContinue).Count
            if ($fileCount -gt 0) {
                Write-Host " [OK - Contains $fileCount files]" -ForegroundColor Green
            } else {
                Write-Host " [EMPTY]" -ForegroundColor Yellow
            }
        } else {
            Write-Host " [NOT FOUND]" -ForegroundColor Red
        }
    }
}

# Function to check if applications can access their data
function Test-ApplicationAccess {
    Write-Host "`nChecking application access..."
    
    # Check if Cursor is running
    $cursorProcess = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
    if ($cursorProcess) {
        Write-Host "Cursor is running. This suggests it can access its data." -ForegroundColor Green
    } else {
        Write-Host "Cursor is not running. Please start it to verify access." -ForegroundColor Yellow
    }
    
    # Check if Docker Desktop is running
    $dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
    if ($dockerProcess) {
        Write-Host "Docker Desktop is running. This suggests it can access its data." -ForegroundColor Green
    } else {
        Write-Host "Docker Desktop is not running. Please start it to verify access." -ForegroundColor Yellow
    }
}

# Main verification
Write-Host "=== App Data Symbolic Link Verification ==="
Write-Host "Checking symbolic links..."

$allLinksCorrect = $true
foreach ($pathInfo in $pathsToCheck) {
    $result = Test-SymbolicLink -Path $pathInfo.Path -Name $pathInfo.Name -ExpectedTarget $pathInfo.ExpectedTarget
    if (-not $result) {
        $allLinksCorrect = $false
    }
}

# Check J: drive directories
Test-JDriveDirectories

# Check application access
Test-ApplicationAccess

# Summary
Write-Host "`n=== Verification Summary ==="
if ($allLinksCorrect) {
    Write-Host "All symbolic links are correctly configured." -ForegroundColor Green
} else {
    Write-Host "Some symbolic links are missing or incorrectly configured." -ForegroundColor Red
    Write-Host "Please run the move-app-data-to-j-drive.ps1 script to fix the issues."
}

Write-Host "`nVerification complete."