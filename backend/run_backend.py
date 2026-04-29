#!/usr/bin/env python3
"""
Robust AI Study Assistant Backend Launcher for Windows
- Handles startup/shutdown gracefully
- Restarts server if it unexpectedly exits
- Logs all activity for debugging
"""
import os
import sys
import time
import signal
import subprocess
from pathlib import Path
from datetime import datetime

# Setup paths
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))
os.chdir(backend_path)

# Configuration
SERVER_HOST = "0.0.0.0"
SERVER_PORT = 8000
MAX_RESTART_ATTEMPTS = 5
RESTART_DELAY = 2  # seconds

# Global state
server_process = None
shutdown_event = False
restart_count = 0


def log_message(level, message):
    """Print timestamped log messages."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully."""
    global shutdown_event
    log_message("INFO", "Shutdown signal received (Ctrl+C). Stopping server...")
    shutdown_event = True
    if server_process:
        try:
            server_process.terminate()
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_process.kill()
            server_process.wait()
    sys.exit(0)


def start_server():
    """Start the FastAPI server using uvicorn as a module."""
    global server_process, restart_count
    
    restart_count += 1
    log_message("INFO", f"Starting server (attempt {restart_count}/{MAX_RESTART_ATTEMPTS})...")
    
    try:
        # Import here to ensure .env is loaded
        from config import settings
        
        # Run uvicorn as a subprocess (more stable on Windows)
        # Redirect stderr to stdout to capture all output
        server_process = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "main:app",
                f"--host={SERVER_HOST}",
                f"--port={SERVER_PORT}",
                "--reload=False",
                "--log-level=info",
                "--access-log",
                "--use-colors",
            ],
            cwd=str(backend_path),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,  # Line buffered
        )
        
        log_message("INFO", f"Server process started (PID: {server_process.pid})")
        log_message("INFO", f"Running on http://{SERVER_HOST}:{SERVER_PORT}")
        log_message("INFO", "Press Ctrl+C to stop the server")
        log_message("INFO", "=" * 70)
        
        return True
    except Exception as e:
        log_message("ERROR", f"Failed to start server: {e}")
        import traceback
        traceback.print_exc()
        return False


def monitor_server():
    """Monitor the server process and restart if needed."""
    global server_process, shutdown_event, restart_count
    
    try:
        while not shutdown_event:
            if server_process is None:
                if restart_count >= MAX_RESTART_ATTEMPTS:
                    log_message("ERROR", f"Max restart attempts ({MAX_RESTART_ATTEMPTS}) reached. Exiting.")
                    sys.exit(1)
                
                if not start_server():
                    time.sleep(RESTART_DELAY)
                    continue
                restart_count = 0  # Reset counter on successful start
            
            # Check if process is still running
            poll_result = server_process.poll()
            if poll_result is not None:
                log_message("WARNING", f"Server process exited with code {poll_result}")
                server_process = None
                
                if not shutdown_event:
                    log_message("INFO", f"Restarting in {RESTART_DELAY} seconds...")
                    time.sleep(RESTART_DELAY)
            else:
                # Process is running, check for output periodically
                time.sleep(1)
    
    except KeyboardInterrupt:
        log_message("INFO", "Keyboard interrupt received")
        shutdown_event = True


def main():
    """Main entry point."""
    log_message("INFO", "=" * 70)
    log_message("INFO", "AI Study Assistant - Backend Server (Launcher)")
    log_message("INFO", "=" * 70)
    
    try:
        # Load config to validate environment
        from config import settings
        log_message("INFO", f"Configuration loaded successfully")
        log_message("INFO", f"Debug mode: {settings.DEBUG}")
        log_message("INFO", f"Database: {settings.DATABASE_URL}")
    except Exception as e:
        log_message("ERROR", f"Failed to load configuration: {e}")
        sys.exit(1)
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start monitoring
    monitor_server()


if __name__ == "__main__":
    main()
