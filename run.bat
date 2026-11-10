@echo off
title Samma3ni Launcher
echo ========================================================
echo        Samma3ni (سَمَّعْنِي) - Music Streaming App
echo ========================================================
echo.

echo [1/2] Starting Spring Boot Backend (Port 8080)...
start "Samma3ni Backend" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

echo [2/2] Starting Angular Frontend (Port 4200)...
start "Samma3ni Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo Both servers are launching!
echo Once ready, open your browser at: http://localhost:4200
echo Admin Login: admin / admin123
echo.
pause
