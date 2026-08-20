@echo off
setlocal enabledelayedexpansion

title Phone-PC Control Server

set "PYTHON=C:\Users\Admin\AppData\Local\Programs\Python\Python313-32\python.exe"
set "BACKEND=E:\Phone-PC-Control\backend"

cd /d "%BACKEND%"

echo Running port check...
:: Find PID using port 8000 and kill it if it exists
for /f "tokens=5" %%p in ('netstat -ano ^| findstr LISTENING ^| findstr :8000') do (
    echo Found process %%p using port 8000.
    taskkill /F /PID %%p >nul 2>&1
)

echo.
echo Python Path: %PYTHON%
echo Checking Python version...
"%PYTHON%" --version
if errorlevel 1 (
    echo Python not found.
    pause
    exit /b
)

echo Starting Server...
"%PYTHON%" -m uvicorn main:app --host 0.0.0.0 --port 8000 --ws websockets
if errorlevel 1 (
    echo.
    echo Server crashed or failed to start.
    pause
)
pause
