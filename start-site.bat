@echo off
cd /d "%~dp0"
start "" cmd /c "timeout /t 2 >nul & start "" http://localhost:8000/index.html"
python server.py
