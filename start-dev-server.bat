@echo off
setlocal

cd /d "%~dp0"

echo Starting Project Jeju dev server...
echo.
echo URL: http://localhost:5174/
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please install Node.js first.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo node_modules was not found. Installing dependencies first...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
  )
)

call npm run dev

echo.
echo Dev server stopped.
pause
