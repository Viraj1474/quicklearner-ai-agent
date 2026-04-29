#!/usr/bin/env python3
"""Direct server start script"""
import uvicorn
import sys

if __name__ == "__main__":
    print("Starting AI Study Assistant Backend...")
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=False,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"Error starting server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
