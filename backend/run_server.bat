




@echo off
cd /d c:\ai-agent\backend
setlocal enabledelayedexpansion

echo ==================================================
echo AI Study Assistant Backend Server
echo ==================================================
echo.

:restart
echo [%date% %time%] Starting server...
C:\ai-agent\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1

if errorlevel 1 (
    echo.
    echo [%date% %time%] Server crashed. Restarting in 5 seconds...
    timeout /t 5
    goto restart
) else (
    goto end
)

:end
echo Server stopped.
pause
