@echo off
title ThaiGigaBike — Dev Server
color 0A
cd /d "%~dp0"

echo.
echo  ==========================================
echo   ThaiGigaBike Dev Server
echo  ==========================================
echo.
echo  [1/2] Clearing cache...
if exist .next rmdir /s /q .next
echo        Done.
echo.
echo  [2/2] Starting server at http://localhost:3000
echo        (browser opens in ~8 seconds)
echo.
echo  Press Ctrl+C to stop the server.
echo  ==========================================
echo.

:: Open browser after 8 seconds in background
start "" cmd /c "timeout /t 8 /nobreak > nul && start http://localhost:3000"

:: Start dev server (stays in this window)
npm run dev
