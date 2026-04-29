@echo off
echo ========================================
echo AI Study Assistant Backend Setup
echo ========================================
echo.

echo [1/5] Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)
echo.

echo [2/5] Creating virtual environment...
if not exist venv (
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)
echo.

echo [3/5] Activating virtual environment...
call venv\Scripts\activate.bat
echo.

echo [4/5] Installing dependencies...
pip install -r requirements.txt
echo.

echo [5/5] Setting up environment file...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo .env file created from .env.example
        echo.
        echo ⚠️  IMPORTANT: Edit .env and add your GOOGLE_API_KEY
        echo    Get your API key from: https://makersuite.google.com/app/apikey
        echo.
    ) else (
        echo ERROR: .env.example not found
    )
) else (
    echo .env file already exists.
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env and add your GOOGLE_API_KEY
echo 2. Run: python database.py (to initialize database)
echo 3. Run: python main.py (to start the server)
echo.
echo Or use start_server.bat to run everything automatically
echo.
pause
