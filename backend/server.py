#!/usr/bin/env python3
"""
AI Study Assistant - AI Agent Backend Server

RECOMMENDED STARTUP SCRIPT
==========================
This is the recommended way to start the AI Agent backend.

Architecture:
- AgentState: Session-based memory (short-term + long-term)
- AgentPlanner: Deterministic intent routing to tools
- GeminiWrapper: API calls for inference (NO TRAINING)

Other startup scripts (run_backend.py, start_server.py, etc.) are DEPRECATED.
Use this script or: uvicorn main:app --host 0.0.0.0 --port 8000

Author: AI Study Assistant
Version: 2.0.0
"""
import os
import sys
from pathlib import Path

backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))
os.chdir(backend_path)

def main():
    print("=" * 70)
    print("AI STUDY ASSISTANT - AI AGENT BACKEND")
    print("=" * 70)
    print()
    print("Architecture: Agent with Memory + Planning + Tool Routing")
    print()
    print("Components:")
    print("  • AgentState    - Session-based memory management")
    print("  • AgentPlanner  - Deterministic action routing")
    print("  • GeminiWrapper - API inference (NO training)")
    print()
    
    try:
        import uvicorn
        from config import settings
        
        print(f"Starting server on http://0.0.0.0:{settings.PORT}")
        print(f"Debug mode: {settings.DEBUG}")
        print(f"Gemini timeout: {settings.GEMINI_TIMEOUT_SECONDS}s")
        print()
        print("-" * 70)
        
        # Run uvicorn server with Windows-compatible settings
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=settings.PORT,
            reload=False,
            log_level="info",
            access_log=True,
            use_colors=True
        )
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
