# Moving Application Data to J: Drive

This document explains how to move Cursor and Docker application data from the C: drive to the J: drive using symbolic links.

## Why Move Application Data?

- Free up space on your system drive (C:)
- Improve performance by using a faster drive for application data
- Prevent your system drive from filling up with application cache and data

## Locations Being Moved

### Cursor
- `C:\Users\<username>\AppData\Roaming\Cursor` → `J:\AppData\Cursor`
- `C:\Users\<username>\AppData\Local\cursor-updater` → `J:\AppData\CursorLocal`
- `C:\Users\<username>\AppData\Local\Programs\cursor` → `J:\AppData\CursorPrograms`

### Docker
- `C:\Users\<username>\AppData\Roaming\Docker` → `J:\AppData\Docker`
- `C:\Users\<username>\AppData\Roaming\Docker Desktop` → `J:\AppData\DockerDesktop`
- `C:\ProgramData\DockerDesktop` → `J:\AppData\DockerProgramData`
- `C:\Users\<username>\.docker` → `J:\AppData\DockerUser`

## How It Works

The script:
1. Creates destination directories on the J: drive
2. Stops relevant applications (Cursor, Docker)
3. Copies existing data to the J: drive
4. Creates symbolic links from the original locations to the new locations
5. Creates backups of original data (with .bak extension)

## Prerequisites

- Windows 10 or 11
- Administrator privileges
- PowerShell 5.1 or later
- J: drive with sufficient free space

## Usage Instructions

1. Close Cursor and Docker Desktop applications
2. Open PowerShell as Administrator
3. Navigate to the scripts directory:
   ```powershell
   cd path\to\scripts
   ```
4. Run the script:
   ```powershell
   .\move-app-data-to-j-drive.ps1
   ```
5. Restart your computer after the script completes

## Verification

After restarting, you can verify that the symbolic links are working by:

1. Opening Cursor and Docker Desktop
2. Checking that they function normally
3. Verifying that new data is being stored on the J: drive

## Reverting Changes

If you need to revert the changes:

1. Delete the symbolic links
2. Rename the backup directories (removing the .bak extension)

Example:
```powershell
# Remove symbolic link
Remove-Item -Path "$env:APPDATA\Cursor" -Force

# Restore from backup
Rename-Item -Path "$env:APPDATA\Cursor.bak" -NewName "Cursor"
```

## Troubleshooting

### Applications Won't Start
- Ensure symbolic links are correctly created
- Check permissions on the J: drive directories
- Verify that the J: drive is available at startup

### Data Not Being Saved
- Check that the symbolic links are pointing to the correct locations
- Ensure the J: drive has sufficient free space
- Verify that the application has write permissions to the J: drive

## Additional Notes

- This script creates backups of your original data with a .bak extension
- You may want to delete these backups after confirming everything works
- Some applications may need to be reconfigured after moving their data