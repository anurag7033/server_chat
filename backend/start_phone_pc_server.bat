@echo off
setlocal

title Phone-PC Control Server

set "PYTHON=C:\Users\Admin\AppData\Local\Programs\Python\Python313-32\python.exe"
set "BACKEND=E:\Phone-PC-Control\backend"

cd /d "%BACKEND%"

echo.
echo ==========================================
echo       PHONE-PC CONTROL SERVER
echo ==========================================
echo.

:: --- PORT CLEANUP LOGIC ---
echo Checking port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    if not "%%a"=="" (
        echo Port 8000 is busy (PID %%a). Cleaning up...
        taskkill /f /pid %%a >nul 2>&1
        echo Port 8000 is now free.
    )
)

echo.
echo Backend : %BACKEND%
echo Python  : %PYTHON%
echo.
echo Checking Python...
"%PYTHON%" --version
if errorlevel 1 (
    echo.
    echo ERROR: Python executable not found.
    pause
    exit /b 1
)

echo.
echo Starting Phone-PC Control server...
echo.
echo Local URL : http://127.0.0.1:8000
echo Network   : http://YOUR-PC-IP:8000
echo WebSocket: ws://YOUR-PC-IP:8000/ws
echo.
echo Press CTRL+C to stop the server.
echo.

"%PYTHON%" -m uvicorn main:app --host 0.0.0.0 --port 8000 --ws websockets

echo.
echo ==========================================
echo       SERVER STOPPED
echo ==========================================
pause
endlocal
