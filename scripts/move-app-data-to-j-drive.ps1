# PowerShell script to move Cursor and Docker data from C: drive to J: drive
# Must be run as Administrator

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator. Please restart PowerShell as Administrator and try again."
    exit 1
}

# Create base directories on J: drive
$jDriveAppData = "J:\AppData"
$jDriveCursor = "$jDriveAppData\Cursor"
$jDriveCursorLocal = "$jDriveAppData\CursorLocal"
$jDriveCursorPrograms = "$jDriveAppData\CursorPrograms"
$jDriveDocker = "$jDriveAppData\Docker"
$jDriveDockerDesktop = "$jDriveAppData\DockerDesktop"
$jDriveDockerProgramData = "$jDriveAppData\DockerProgramData"
$jDriveDockerUser = "$jDriveAppData\DockerUser"

# Create directories if they don't exist
New-Item -Path $jDriveAppData -ItemType Directory -Force | Out-Null
New-Item -Path $jDriveCursor -ItemType Directory -Force | Out-Null
New-Item -Path $jDriveCursorLocal -ItemType Directory -Force | Out-Null
New-Item -Path $jDriveCursorPrograms -ItemType Directory -Force | Out-Null
New-Item -Path $jDriveDocker -ItemType Directory -Force | Out-Null
New-Item -Path $jDriveDockerDesktop -ItemType Directory -Force | Out-Null
New-Item -Path $jDriveDockerProgramData -ItemType Directory -Force | Out-Null
New-Item -Path $jDriveDockerUser -ItemType Directory -Force | Out-Null

# Define paths
$cursorRoaming = "$env:APPDATA\Cursor"
$cursorLocal = "$env:LOCALAPPDATA\cursor-updater"
$cursorPrograms = "$env:LOCALAPPDATA\Programs\cursor"
$dockerRoaming = "$env:APPDATA\Docker"
$dockerDesktopRoaming = "$env:APPDATA\Docker Desktop"
$dockerProgramData = "C:\ProgramData\DockerDesktop"
$dockerUser = "$env:USERPROFILE\.docker"

# Function to move directory and create symbolic link
function Move-DirectoryAndCreateSymlink {
    param (
        [string]$sourcePath,
        [string]$destinationPath,
        [string]$appName
    )

    if (Test-Path $sourcePath) {
        Write-Host "Moving $appName data from $sourcePath to $destinationPath..."
        
        # Check if the source is already a symbolic link
        $dirInfo = Get-Item $sourcePath -Force -ErrorAction SilentlyContinue
        if ($dirInfo.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
            Write-Host "$sourcePath is already a symbolic link. Removing it..."
            Remove-Item -Path $sourcePath -Force
        } else {
            # Stop related processes if needed
            if ($appName -eq "Cursor") {
                Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | Stop-Process -Force
            } elseif ($appName -eq "Docker") {
                Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force
                Get-Process -Name "com.docker.service" -ErrorAction SilentlyContinue | Stop-Process -Force
            }
            
            # Copy existing data if the directory exists and has content
            if ((Test-Path $sourcePath) -and (Get-ChildItem -Path $sourcePath -Force -ErrorAction SilentlyContinue)) {
                # Use robocopy for reliable copying
                robocopy $sourcePath $destinationPath /E /COPYALL /R:1 /W:1
                
                # Rename original directory as backup
                $backupPath = "$sourcePath.bak"
                if (Test-Path $backupPath) {
                    Remove-Item -Path $backupPath -Recurse -Force
                }
                Rename-Item -Path $sourcePath -NewName "$sourcePath.bak" -Force
            }
            
            # Remove the original directory if it still exists
            if (Test-Path $sourcePath) {
                Remove-Item -Path $sourcePath -Recurse -Force
            }
        }
        
        # Create symbolic link
        Write-Host "Creating symbolic link from $sourcePath to $destinationPath..."
        New-Item -ItemType SymbolicLink -Path $sourcePath -Target $destinationPath -Force
        
        Write-Host "$appName data successfully moved to J: drive and symbolic link created."
    } else {
        Write-Host "$sourcePath does not exist. Creating symbolic link to $destinationPath..."
        New-Item -ItemType SymbolicLink -Path $sourcePath -Target $destinationPath -Force
    }
}

# Move Cursor data and create symbolic links
Write-Host "=== Moving Cursor Data ==="
Move-DirectoryAndCreateSymlink -sourcePath $cursorRoaming -destinationPath $jDriveCursor -appName "Cursor"
Move-DirectoryAndCreateSymlink -sourcePath $cursorLocal -destinationPath $jDriveCursorLocal -appName "Cursor"
Move-DirectoryAndCreateSymlink -sourcePath $cursorPrograms -destinationPath $jDriveCursorPrograms -appName "Cursor"

# Move Docker data and create symbolic links
Write-Host "`n=== Moving Docker Data ==="
Move-DirectoryAndCreateSymlink -sourcePath $dockerRoaming -destinationPath $jDriveDocker -appName "Docker"
Move-DirectoryAndCreateSymlink -sourcePath $dockerDesktopRoaming -destinationPath $jDriveDockerDesktop -appName "Docker"
Move-DirectoryAndCreateSymlink -sourcePath $dockerProgramData -destinationPath $jDriveDockerProgramData -appName "Docker"
Move-DirectoryAndCreateSymlink -sourcePath $dockerUser -destinationPath $jDriveDockerUser -appName "Docker"

Write-Host "`nAll data has been moved to the J: drive and symbolic links have been created."
Write-Host "Please restart your computer for the changes to take effect."