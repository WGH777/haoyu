@echo off
setlocal EnableExtensions

set "FAIL=0"
set "SHOULD_STOP=0"
if /I "%~1"=="/stop" set "SHOULD_STOP=1"
if /I "%~1"=="--stop" set "SHOULD_STOP=1"

set "SCRIPT_DIR=%~dp0"
set "BACKEND_PORT=3000"
set "FRONTEND_PORT=5174"
set "BACKEND_URL=http://127.0.0.1:%BACKEND_PORT%/api"
set "FRONTEND_URL=http://127.0.0.1:%FRONTEND_PORT%/"

echo Checking HaoYu local development services...
echo.

call :check_port %BACKEND_PORT% "Backend port"
call :check_port %FRONTEND_PORT% "Frontend port"
call :check_url "%BACKEND_URL%" "Backend API"
call :check_url "%FRONTEND_URL%" "Frontend app"
call :check_cors "http://127.0.0.1:%FRONTEND_PORT%" "Local CORS 127.0.0.1"
call :check_cors "http://localhost:%FRONTEND_PORT%" "Local CORS localhost"

echo.
if "%FAIL%"=="0" (
  echo [OK] HaoYu local development checks passed.
  if "%SHOULD_STOP%"=="1" call :stop_services
  exit /b 0
)

echo [ERROR] One or more HaoYu local development checks failed.
if "%SHOULD_STOP%"=="1" call :stop_services
exit /b 1

:stop_services
echo.
echo Stopping HaoYu local development services after check...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%haoyu-dev-cleanup.ps1"
exit /b 0

:check_port
set "PORT=%~1"
set "LABEL=%~2"
netstat -ano -p tcp | findstr /C:":%PORT%" | findstr /C:"LISTENING" >nul
if errorlevel 1 (
  echo [FAIL] %LABEL% %PORT% is not listening.
  set "FAIL=1"
) else (
  echo [OK]   %LABEL% %PORT% is listening.
)
exit /b 0

:check_url
set "URL=%~1"
set "LABEL=%~2"
curl.exe -fsS -o NUL "%URL%" >nul 2>nul
if errorlevel 1 (
  echo [FAIL] %LABEL% did not respond: %URL%
  set "FAIL=1"
) else (
  echo [OK]   %LABEL% responded: %URL%
)
exit /b 0

:check_cors
set "ORIGIN=%~1"
set "LABEL=%~2"
curl.exe -fsS -o NUL -X OPTIONS "%BACKEND_URL%/auth/login" -H "Origin: %ORIGIN%" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type,authorization" >nul 2>nul
if errorlevel 1 (
  echo [FAIL] %LABEL% preflight failed for %ORIGIN%
  set "FAIL=1"
) else (
  echo [OK]   %LABEL% preflight passed for %ORIGIN%
)
exit /b 0
