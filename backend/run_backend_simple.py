#!/usr/bin/env python3
"""
Simple AI Study Assistant Backend Launcher for Windows
Direct uvicorn execution - most reliable method
"""
import os
import sys
from pathlib import Path

# Setup paths
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))
os.chdir(backend_path)

def main():
    """Main entry point - runs uvicorn directly."""
    try:
        # Load config to validate environment
        from config import settings
        print("=" * 70)
        print("AI Study Assistant - Backend Server")
        print("=" * 70)
        print(f"[*] Configuration: {settings.HOST}:{settings.PORT}")
        print(f"[*] Debug mode: {settings.DEBUG}")
        print(f"[*] Database: {settings.DATABASE_URL}")
        print(f"[*] Python executable: {sys.executable}")
        try:
            import razorpay  # noqa: F401
            print("[*] Razorpay SDK: available")
        except Exception as exc:
            print(f"[*] Razorpay SDK: unavailable ({exc})")
        print()
        
        # Import and run uvicorn directly
        import uvicorn
        
        print("[*] Starting server...")
        print()
        
        # Run uvicorn with Windows-friendly settings
        uvicorn.run(
            app="main:app",
            host=settings.HOST,
            port=settings.PORT,
            log_level="info",
            access_log=True,
            reload=False,
            use_colors=True,
        )
        
    except KeyboardInterrupt:
        print("\n\n[*] Shutting down...")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
