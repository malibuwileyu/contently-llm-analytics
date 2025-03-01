# PowerShell script to revert app data symbolic links
# Must be run as Administrator

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator. Please restart PowerShell as Administrator and try again."
    exit 1
}

# Define paths to revert
$pathsToRevert = @(
    # Cursor paths
    @{
        Path = "$env:APPDATA\Cursor"
        Name = "Cursor (Roaming AppData)"
        BackupPath = "$env:APPDATA\Cursor.bak"
    },
    @{
        Path = "$env:LOCALAPPDATA\cursor-updater"
        Name = "Cursor Updater (Local AppData)"
        BackupPath = "$env:LOCALAPPDATA\cursor-updater.bak"
    },
    @{
        Path = "$env:LOCALAPPDATA\Programs\cursor"
        Name = "Cursor Programs (Local AppData)"
        BackupPath = "$env:LOCALAPPDATA\Programs\cursor.bak"
    },
    # Docker paths
    @{
        Path = "$env:APPDATA\Docker"
        Name = "Docker (Roaming AppData)"
        BackupPath = "$env:APPDATA\Docker.bak"
    },
    @{
        Path = "$env:APPDATA\Docker Desktop"
        Name = "Docker Desktop (Roaming AppData)"
        BackupPath = "$env:APPDATA\Docker Desktop.bak"
    },
    @{
        Path = "C:\ProgramData\DockerDesktop"
        Name = "Docker Desktop (ProgramData)"
        BackupPath = "C:\ProgramData\DockerDesktop.bak"
    },
    @{
        Path = "$env:USERPROFILE\.docker"
        Name = "Docker User Config"
        BackupPath = "$env:USERPROFILE\.docker.bak"
    }
)

# Function to revert a symbolic link to its original state
function Revert-SymbolicLink {
    param (
        [string]$Path,
        [string]$Name,
        [string]$BackupPath
    )

    Write-Host "Reverting $Name..." -NoNewline

    # Stop related processes if needed
    if ($Name -like "*Cursor*") {
        Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | Stop-Process -Force
    } elseif ($Name -like "*Docker*") {
        Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force
        Get-Process -Name "com.docker.service" -ErrorAction SilentlyContinue | Stop-Process -Force
    }

    # Check if the path exists and is a symbolic link
    if (Test-Path $Path -ErrorAction SilentlyContinue) {
        $item = Get-Item $Path -Force
        if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
            # Remove the symbolic link
            Remove-Item -Path $Path -Force
            Write-Host " [Symbolic link removed]" -NoNewline
        } else {
            Write-Host " [Not a symbolic link - skipping]" -NoNewline
        }
    } else {
        Write-Host " [Path not found - will create from backup]" -NoNewline
    }

    # Check if backup exists
    if (Test-Path $BackupPath -ErrorAction SilentlyContinue) {
        # Restore from backup
        Rename-Item -Path $BackupPath -NewName $Path -Force
        Write-Host " [Restored from backup]" -ForegroundColor Green
        return $true
    } else {
        # No backup found
        Write-Host " [No backup found]" -ForegroundColor Yellow
        
        # Check if data exists on J: drive
        $jDrivePath = $null
        if ($Name -eq "Cursor (Roaming AppData)") {
            $jDrivePath = "J:\AppData\Cursor"
        } elseif ($Name -eq "Cursor Updater (Local AppData)") {
            $jDrivePath = "J:\AppData\CursorLocal"
        } elseif ($Name -eq "Cursor Programs (Local AppData)") {
            $jDrivePath = "J:\AppData\CursorPrograms"
        } elseif ($Name -eq "Docker (Roaming AppData)") {
            $jDrivePath = "J:\AppData\Docker"
        } elseif ($Name -eq "Docker Desktop (Roaming AppData)") {
            $jDrivePath = "J:\AppData\DockerDesktop"
        } elseif ($Name -eq "Docker Desktop (ProgramData)") {
            $jDrivePath = "J:\AppData\DockerProgramData"
        } elseif ($Name -eq "Docker User Config") {
            $jDrivePath = "J:\AppData\DockerUser"
        }

        if ($jDrivePath -and (Test-Path $jDrivePath)) {
            Write-Host "  Data found on J: drive at $jDrivePath"
            $copyBack = Read-Host "  Do you want to copy data back from J: drive? (Y/N)"
            if ($copyBack -eq "Y" -or $copyBack -eq "y") {
                # Create directory if it doesn't exist
                if (-not (Test-Path (Split-Path -Parent $Path))) {
                    New-Item -Path (Split-Path -Parent $Path) -ItemType Directory -Force | Out-Null
                }
                
                # Copy data back from J: drive
                Write-Host "  Copying data from $jDrivePath to $Path..."
                robocopy $jDrivePath $Path /E /COPYALL /R:1 /W:1
                Write-Host "  Data copied back from J: drive." -ForegroundColor Green
                return $true
            }
        }
        
        return $false
    }
}

# Main reversion process
Write-Host "=== App Data Symbolic Link Reversion ==="
Write-Host "This script will revert symbolic links and restore original data."
Write-Host "WARNING: This will stop Cursor and Docker Desktop if they are running."
$confirmation = Read-Host "Do you want to continue? (Y/N)"

if ($confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Host "Operation cancelled."
    exit 0
}

$successCount = 0
$failCount = 0

foreach ($pathInfo in $pathsToRevert) {
    $result = Revert-SymbolicLink -Path $pathInfo.Path -Name $pathInfo.Name -BackupPath $pathInfo.BackupPath
    if ($result) {
        $successCount++
    } else {
        $failCount++
    }
}

# Summary
Write-Host "`n=== Reversion Summary ==="
Write-Host "Successfully reverted: $successCount"
Write-Host "Failed to revert: $failCount"

if ($failCount -gt 0) {
    Write-Host "`nSome items could not be reverted because backups were not found."
    Write-Host "You may need to reinstall the affected applications if they don't work properly."
}

Write-Host "`nReversion complete. Please restart your computer for the changes to take effect."