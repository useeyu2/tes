@echo off
setlocal
title SKOSA Alumni System - Local Server
echo ===================================================
echo   SKOSA ALUMNI SYSTEM - LOCAL HOSTING
echo ===================================================
echo.

:: Check for node_modules
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
) else (
    echo [INFO] Dependencies already installed.
)

echo.
echo [STATUS] Starting Server on Port 8080...
echo [LINK]   http://localhost:8080
echo.
echo Press Ctrl+C to stop the server at any time.
echo ---------------------------------------------------
node server.js
pause
