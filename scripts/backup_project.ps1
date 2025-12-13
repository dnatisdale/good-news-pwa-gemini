$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path "$PSScriptRoot\.."
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$backupFolder = Join-Path $projectRoot "backups"
$backupFile = Join-Path $backupFolder "good-news-pwa-$timestamp.zip"

# Create backup folder if not exists
if (-not (Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
    Write-Host "Created backup directory: $backupFolder"
}

Write-Host "----------------------------------------------------------------"
Write-Host "STARTING FULL SYSTEM BACKUP"
Write-Host "Source: $projectRoot"
Write-Host "Destination: $backupFile"
Write-Host "----------------------------------------------------------------"

# List of folders/files to EXCLUDE (to keep backup size reasonable and relevant)
$excludes = @(
    "node_modules",
    ".git",
    "dist",
    "build",
    "backups",       # Don't backup the backups folder!
    ".gemini",
    ".vscode",
    "tmp"
)

# Debug: Show what we are excluding
Write-Host "Excluding the following system folders:"
$excludes | ForEach-Object { Write-Host " - $_" }
Write-Host ""

# Get top-level items to zip
$itemsToZip = Get-ChildItem -Path $projectRoot | Where-Object { $excludes -notcontains $_.Name }

Write-Host "Compressing project files..."
Write-Host "This process captures ALL audio (mp3s), source code, and assets."
Write-Host "Please wait..."

# Attempt compression
try {
    Compress-Archive -Path $itemsToZip.FullName -DestinationPath $backupFile -CompressionLevel Optimal -Force
    
    $size = (Get-Item $backupFile).Length / 1MB
    $sizeFormatted = "{0:N2} MB" -f $size

    Write-Host ""
    Write-Host "----------------------------------------------------------------"
    Write-Host "BACKUP COMPLETE SUCCESS!"
    Write-Host "File: $backupFile"
    Write-Host "Size: $sizeFormatted"
    Write-Host "----------------------------------------------------------------"
    Write-Host "You can now safely make major changes (like deleting legacy folders)"
    Write-Host "knowing you have a full snapshot here."
}
catch {
    Write-Error "Backup Failed: $_"
    exit 1
}
