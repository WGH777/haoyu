@echo off
setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "SCRIPT_ROOT=%%~fI"

if exist "G:\haoyu\haoyu-main-clean\apps\frontend\package.json" (
  set "PROJECT_ROOT=G:\haoyu\haoyu-main-clean"
) else (
  set "PROJECT_ROOT=%SCRIPT_ROOT%"
)

set "BACKEND_DIR=%PROJECT_ROOT%\apps\backend"
set "FRONTEND_DIR=%PROJECT_ROOT%\apps\frontend"
set "BACKEND_PORT=3000"
set "FRONTEND_PORT=5174"
set "API_BASE=http://127.0.0.1:%BACKEND_PORT%/api"
set "CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,https://www.haoyulv.com,https://haoyulv.com"

call :banner

if not exist "%BACKEND_DIR%\package.json" (
  echo [ERROR] Backend package.json not found: %BACKEND_DIR%
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Frontend package.json not found: %FRONTEND_DIR%
  exit /b 1
)

echo Checking local dependencies...
if not exist "%BACKEND_DIR%\node_modules\.bin\nest.cmd" (
  echo [ERROR] Backend dependencies are incomplete: %BACKEND_DIR%\node_modules\.bin\nest.cmd not found.
  echo [FIX]   Run: cd /d "%BACKEND_DIR%" ^&^& npm ci
  exit /b 1
)
if not exist "%FRONTEND_DIR%\node_modules\.bin\vite.cmd" (
  echo [ERROR] Frontend dependencies are incomplete: %FRONTEND_DIR%\node_modules\.bin\vite.cmd not found.
  echo [FIX]   Run: cd /d "%FRONTEND_DIR%" ^&^& npm ci
  exit /b 1
)

echo [1/4] Closing stale HaoYu dev windows and ports...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%haoyu-dev-cleanup.ps1"

echo [2/5] HaoYu-owned dev ports released.

echo [3/5] Preparing local development database...
pushd "%BACKEND_DIR%"
set DATABASE_URL=file:./dev.db
call npx prisma migrate deploy
if errorlevel 1 (
  popd
  echo [ERROR] Prisma migration failed.
  exit /b 1
)
call npx prisma db push --accept-data-loss
if errorlevel 1 (
  popd
  echo [ERROR] Prisma schema sync failed.
  exit /b 1
)
call npx prisma db seed
if errorlevel 1 (
  popd
  echo [ERROR] Prisma seed failed.
  exit /b 1
)
popd

echo [4/5] Starting backend on http://127.0.0.1:%BACKEND_PORT%/api
start "HaoYu Backend :3000" /D "%BACKEND_DIR%" cmd /k "set JWT_SECRET=haoyu_local_dev_jwt_secret_change_me_2026&& set JWT_EXPIRES_IN=7d&& set DATABASE_URL=file:./dev.db&& set PORT=%BACKEND_PORT%&& set CORS_ORIGIN=%CORS_ORIGIN%&& echo HaoYu backend starting on http://127.0.0.1:%BACKEND_PORT%/api&& npm run start:dev"

echo [5/5] Starting frontend on http://127.0.0.1:%FRONTEND_PORT%/
start "HaoYu Frontend :5174" /D "%FRONTEND_DIR%" cmd /k "set VITE_API_BASE=%API_BASE%&& echo HaoYu frontend starting on http://127.0.0.1:%FRONTEND_PORT%/ with API %API_BASE%&& npm run dev -- --host 127.0.0.1 --port %FRONTEND_PORT%"

echo.
echo Started HaoYu local development services from: %PROJECT_ROOT%
echo Wait 8 seconds, then run scripts\local-dev\haoyu-dev-check.cmd
exit /b 0

:banner
echo Starting HaoYu local development services...
echo.
echo Project:  %PROJECT_ROOT%
echo Backend:  %BACKEND_DIR%
echo Frontend: %FRONTEND_DIR%
echo.
exit /b 0




