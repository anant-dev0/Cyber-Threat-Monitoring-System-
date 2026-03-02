@echo off
echo ==================================================
echo   CYBER THREAT MONITOR - SYSTEM LAUNCHER
echo ==================================================
echo.
echo 1. Starting Backend Server (New Window)...
start "Backend Server" cmd /k "cd /d %~dp0backend && python app.py"

echo Waiting 5 seconds for server to initialize...
timeout /t 5 /nobreak >nul

echo 2. Starting Attack Simulation (New Window)...
start "Attack Simulation" cmd /k "cd /d %~dp0 && python scripts/simulate_attacks.py"

echo.
echo ==================================================
echo   SYSTEM STARTED!
echo   > Open http://localhost:5000 in your browser
echo ==================================================
pause
