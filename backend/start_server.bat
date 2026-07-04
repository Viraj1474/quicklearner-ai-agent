@echo off
echo ========================================
echo Starting AI Study Assistant Backend
echo ========================================
echo.

REM Check if virtual environment exists
if not exist C:\ai-agent\.venv (
    echo Virtual environment not found. Running setup...
    call setup.bat
    if %errorlevel% neq 0 exit /b 1
)

REM Activate virtual environment
call C:\ai-agent\.venv\Scripts\activate.bat

REM Check if .env exists
if not exist .env (
    echo.
    echo ERROR: .env file not found!
    echo Please run setup.bat first and configure your .env file
    pause
    exit /b 1
)

REM Initialize database if needed
if not exist ai_agent.db (
    echo Initializing database...
    python database.py
    echo.
)

REM Start the server
echo Starting server...
echo Server will be available at: http://localhost:8000
echo API docs will be available at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py
