@echo off
REM Batch file alternative to PowerShell scripts for Windows Command Prompt
REM AI Study Assistant - Backend Server Launcher

cls
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  AI Study Assistant - Backend Server Launcher (CMD)                ║
echo ║  FastAPI + Uvicorn + Gemini AI                                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

setlocal enabledelayedexpansion

REM Configuration
set "BACKEND_PATH=C:\ai-agent\backend"
set "PYTHON_EXE=C:\ai-agent\.venv\Scripts\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=%BACKEND_PATH%\venv\Scripts\python.exe"
set "PORT=8000"

REM Check if Python virtual environment exists
if not exist "%PYTHON_EXE%" (
    echo [-] Python virtualenv not found in expected locations.
    echo     - C:\ai-agent\.venv\Scripts\python.exe
    echo     - %BACKEND_PATH%\venv\Scripts\python.exe
    echo [*] Please run: cd C:\ai-agent ^&^& python -m venv .venv
    pause
    exit /b 1
)

echo [+] Python executable found: %PYTHON_EXE%
echo.

REM Start the robust backend launcher
echo [*] Starting backend server using robust launcher...
echo [*] Press Ctrl+C to stop the server
echo.

cd /d %BACKEND_PATH%
"%PYTHON_EXE%" run_backend.py

echo.
echo [!] Backend server stopped.
pause
