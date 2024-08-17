# Get the directory of the script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Get the script file name
$scriptName = $MyInvocation.MyCommand.Name

# Define the output ZIP file name with full path
$outputFile = Join-Path $scriptDir "lockedContainers.mcaddon"

# Attempt to delete the existing ZIP file if it exists
if (Test-Path $outputFile) {
    try {
        Remove-Item $outputFile -Force -ErrorAction Stop
        Write-Output "Deleted existing file: $outputFile"
    } catch {
        Write-Output "Failed to delete existing file: $outputFile"
        exit
    }
}

# Load the necessary assembly for compression
Add-Type -AssemblyName 'System.IO.Compression.FileSystem'

# Create the ZIP file in the script's directory
$zip = [System.IO.Compression.ZipFile]::Open($outputFile, [System.IO.Compression.ZipArchiveMode]::Create)

# Get all files and directories recursively, excluding the script itself and any existing .zip files
$items = Get-ChildItem -Path $scriptDir -Recurse | Where-Object { $_.Name -ne $scriptName -and $_.FullName -ne $outputFile -and $_.Name -ne "README.md" }

# Add files to the ZIP archive manually, preserving the directory structure
foreach ($item in $items) {
    if ($item.PSIsContainer) {
        continue  # Skip directories as they will be handled implicitly by file paths
    }

    $relativePath = $item.FullName.Substring($scriptDir.Length + 1).TrimStart('\')
    Write-Output "Adding $relativePath to archive"
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $item.FullName, $relativePath)
}

# Finalize and close the ZIP file
$zip.Dispose()

Write-Output "Zipping complete: $outputFile"
