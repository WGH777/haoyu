@echo off
setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0"
echo Stopping HaoYu local development services...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%haoyu-dev-cleanup.ps1"
echo Done. HaoYu local development services are stopped.
exit /b 0
