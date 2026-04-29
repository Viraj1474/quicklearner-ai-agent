#!/usr/bin/env python3
"""Start the AI Study Assistant Backend and keep it running"""
import sys
import subprocess
import time
import signal

def main():
    print("=" * 60)
    print("🚀 AI Study Assistant Backend")
    print("=" * 60)
    
    cmd = [
        sys.executable,
        "-m", "uvicorn",
        "main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload"
    ]
    
    print(f"\nStarting server with: {' '.join(cmd)}\n")
    
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        while True:
            output = process.stdout.readline()
            if output:
                print(output.decode().strip())
            else:
                time.sleep(0.1)
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down...")
        process.terminate()
        process.wait()
        sys.exit(0)

if __name__ == "__main__":
    main()
