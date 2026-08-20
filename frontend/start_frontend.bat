@echo off
setlocal
cd /d E:\Phone-PC-Control\frontend
echo Starting Local Chat frontend...
echo.
echo Open on this PC:
echo http://127.0.0.1:5500
echo.
echo On other devices use:
echo http://YOUR-PC-IP:5500
echo.
python -m http.server 5500 --bind 0.0.0.0
pause
