$ErrorActionPreference = 'SilentlyContinue'
$ports = @(3000, 5173, 5174)
$titlePatterns = @('*HaoYu Backend :3000*', '*HaoYu Frontend :5173*', '*HaoYu Frontend :5174*')

foreach ($pattern in $titlePatterns) {
  Get-Process | Where-Object { $_.MainWindowTitle -like $pattern } | ForEach-Object {
    Write-Host "[CLOSE] window '$($_.MainWindowTitle)' pid $($_.Id)"
    Stop-Process -Id $_.Id -Force
  }
}

foreach ($port in $ports) {
  $lines = netstat -ano -p tcp | Select-String ":$port\s+.*LISTENING\s+(\d+)"
  foreach ($line in $lines) {
    $pidText = [regex]::Match($line.Line, 'LISTENING\s+(\d+)').Groups[1].Value
    if (-not $pidText) { continue }
    $pidValue = [int]$pidText
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$pidValue"
    if (-not $proc) { continue }
    $cmd = [string]$proc.CommandLine
    if ($cmd -match 'G:\\haoyu\\haoyu-main|G:\\haoyu\\haoyu-main-clean|haoyu-main|haoyu-main-clean') {
      Write-Host "[CLOSE] port $port pid $pidValue $($proc.Name)"
      Stop-Process -Id $pidValue -Force
    } else {
      Write-Host "[SKIP] port $port pid $pidValue is not a HaoYu process"
    }
  }
}

Get-CimInstance Win32_Process | Where-Object {
  $_.Name -match 'node.exe|cmd.exe' -and
  $_.CommandLine -match 'G:\\haoyu\\haoyu-main-clean\\apps\\(backend|frontend)|G:\\haoyu\\haoyu-main\\apps\\(backend|frontend)'
} | ForEach-Object {
  Write-Host "[CLOSE] stale HaoYu process pid $($_.ProcessId) $($_.Name)"
  Stop-Process -Id $_.ProcessId -Force
}
