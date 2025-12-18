# PowerShell 5.1 compatible
$ErrorActionPreference = "Stop"

Write-Host "--- Deploy Frontend (Windows -> VPS) ---" -ForegroundColor Cyan

# ====== HARD CODE CONFIG ======
$FrontendAbsPath = "G:\haoyu\apps\frontend"

$ServerIP  = "47.79.92.47"
$SSHUser   = "root"
$SSHPort   = 22

$RemoteDir = "/opt/haoyu/frontend"
# ==============================

function Assert-Command([string]$cmd) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "Missing command: $cmd. Please ensure OpenSSH and tar are available in PATH."
  }
}
function Assert-Path([string]$path, [string]$name) {
  if ([string]::IsNullOrWhiteSpace($path)) { throw "$name is empty." }
  if (-not (Test-Path -LiteralPath $path)) { throw "$name not found: [$path]" }
}
function Run-Checked {
  param(
    [Parameter(Mandatory=$true)][string]$Title,
    [Parameter(Mandatory=$true)][scriptblock]$Cmd
  )
  Write-Host ""
  Write-Host "==> $Title" -ForegroundColor Yellow
  & $Cmd
  if ($LASTEXITCODE -ne 0) {
    throw "FAILED: $Title (exit code $LASTEXITCODE)"
  }
}

Assert-Command "ssh"
Assert-Command "scp"
Assert-Command "tar"

Assert-Path $FrontendAbsPath "FrontendAbsPath"
Assert-Path (Join-Path $FrontendAbsPath "package.json") "frontend package.json"

$pm = $null
if (Get-Command "pnpm" -ErrorAction SilentlyContinue) { $pm = "pnpm" }
elseif (Get-Command "npm" -ErrorAction SilentlyContinue) { $pm = "npm" }
elseif (Get-Command "yarn" -ErrorAction SilentlyContinue) { $pm = "yarn" }
else { throw "No pnpm/npm/yarn found on this machine." }

$timestamp    = Get-Date -Format "yyyyMMdd_HHmmss"
$archiveName  = "dist_$timestamp.tar.gz"
$localArchive = Join-Path $FrontendAbsPath $archiveName

$sshTarget = ("{0}@{1}" -f $SSHUser, $ServerIP)
$remoteReleaseDir  = "$RemoteDir/releases"
$remoteBackupDir   = "$RemoteDir/backups"
$remoteArchivePath = "$remoteReleaseDir/$archiveName"
$scpDest = ("{0}@{1}:{2}" -f $SSHUser, $ServerIP, $remoteArchivePath)

Run-Checked "1) Build frontend ($pm run build)" {
  Push-Location $FrontendAbsPath
  try {
    if ($pm -eq "pnpm") { & pnpm run build }
    elseif ($pm -eq "npm") { & npm run build }
    elseif ($pm -eq "yarn") { & yarn build }
  } finally {
    Pop-Location
  }
}

Run-Checked "2) Pack dist -> $archiveName" {
  $distPath = Join-Path $FrontendAbsPath "dist"
  Assert-Path $distPath "dist folder"
  if (Test-Path -LiteralPath $localArchive) { Remove-Item -LiteralPath $localArchive -Force }
  & tar -czf $localArchive -C $FrontendAbsPath dist
  Assert-Path $localArchive "localArchive"
}

Run-Checked "3) Ensure remote dirs + upload archive" {
  & ssh -p $SSHPort $sshTarget ("mkdir -p '{0}' '{1}' '{2}'" -f $RemoteDir, $remoteReleaseDir, $remoteBackupDir)
  & scp -P $SSHPort $localArchive $scpDest
}

# 远端 bash 脚本：通过 stdin 传给 bash -s，避免任何换行/转义问题
$remoteScript = @'
set -euo pipefail

REMOTE_DIR="$1"
ARCHIVE="$2"
TS="$3"

cd "$REMOTE_DIR"

rm -rf dist_new
mkdir -p dist_new

# 解压：压缩包内应包含 dist/ 目录
tar -xzf "$ARCHIVE" -C dist_new
test -d dist_new/dist

# 备份旧 dist
if [ -d dist ]; then
  mkdir -p backups
  mv dist "backups/dist_${TS}"
fi

# 原子切换
mv dist_new/dist dist
rm -rf dist_new
rm -f "$ARCHIVE"

echo "[OK] switched dist at $REMOTE_DIR"
'@

Run-Checked "4) Extract + atomic switch on VPS" {
  $cmd = ("bash -s -- '{0}' '{1}' '{2}'" -f $RemoteDir, $remoteArchivePath, $timestamp)
  $remoteScript | & ssh -p $SSHPort $sshTarget $cmd
}

Run-Checked "5) Reload nginx (nginx -t && reload)" {
  & ssh -p $SSHPort $sshTarget "nginx -t && (systemctl reload nginx || nginx -s reload)"
}

Write-Host ""
Write-Host ("--- Deployment Success: {0} ---" -f $timestamp) -ForegroundColor Green

# cleanup local archive
if (Test-Path -LiteralPath $localArchive) { Remove-Item -LiteralPath $localArchive -Force }
