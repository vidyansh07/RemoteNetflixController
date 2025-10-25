# monitor_logs.ps1
# PowerShell script to monitor the native bridge logs in real-time

param(
    [string]$LogPath = "D:\ClientWork\RemoteNetflixController\elder-app\native-messaging-host\bridge.log"
)

Write-Host "Monitoring log file: $LogPath" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Cyan

# Check if file exists
if (-not (Test-Path $LogPath)) {
    Write-Host "Log file does not exist yet. Waiting for it to be created..." -ForegroundColor Yellow
}

# Monitor the file for changes
try {
    Get-Content $LogPath -Wait -Tail 20 -ErrorAction SilentlyContinue
} catch {
    Write-Host "Error monitoring file: $_" -ForegroundColor Red
}

# Alternative method using FileSystemWatcher if Get-Content -Wait doesn't work
if ($?) {
    Write-Host "Switching to FileSystemWatcher method..." -ForegroundColor Yellow
    
    $folder = Split-Path $LogPath -Parent
    $filename = Split-Path $LogPath -Leaf
    
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $folder
    $watcher.Filter = $filename
    $watcher.EnableRaisingEvents = $true
    
    Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action {
        Start-Sleep -Milliseconds 100  # Small delay to ensure file is written
        $content = Get-Content $LogPath -Tail 5 -ErrorAction SilentlyContinue
        $content | ForEach-Object { Write-Host $_ }
    }
    
    Write-Host "FileSystemWatcher monitoring started. Press any key to stop."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
}