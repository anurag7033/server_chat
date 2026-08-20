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
echo Checking WebSocket support...
"%PYTHON%" -c "import websockets; print('WebSocket:', websockets.__version__)"
if errorlevel 1 (
    echo.
    echo ERROR: websockets is not installed in this Python environment.
    echo Run:
    echo "%PYTHON%" -m pip install websockets
    pause
    exit /b 1
)

echo.
echo Checking Uvicorn...
"%PYTHON%" -m uvicorn --version
if errorlevel 1 (
    echo.
    echo ERROR: Uvicorn is not installed in this Python environment.
    echo Run:
    echo "%PYTHON%" -m pip install uvicorn
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
