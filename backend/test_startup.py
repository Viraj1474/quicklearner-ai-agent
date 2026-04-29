#!/usr/bin/env python3
"""Test if the AI Agent backend can start without errors"""
import sys

try:
    print("Testing imports...")
    
    from config import settings
    print("✓ Config loaded")
    
    from database import get_db, init_db
    print("✓ Database loaded")
    
    from gemini_wrapper import gemini_wrapper
    print("✓ Gemini wrapper loaded")
    
    from agent_state import AgentStateManager
    print("✓ Agent state manager loaded")
    
    from agent_planner import analyze_intent, AgentAction
    print("✓ Agent planner loaded")
    
    from schemas import ChatRequest, ChatResponse
    print("✓ Schemas loaded")
    
    print("\nTesting FastAPI app creation...")
    from main import app
    print("✓ Main app loaded")
    
    print("\n" + "=" * 50)
    print("✅ AI AGENT BACKEND - All modules loaded!")
    print("=" * 50)
    print("\nArchitecture components:")
    print("  • AgentState: Session-based memory management")
    print("  • AgentPlanner: Deterministic intent routing")
    print("  • GeminiWrapper: API calls (inference only, NO training)")
    print("\nApp ready to run with:")
    print("  python server.py")
    print("  OR")
    print("  uvicorn main:app --host 0.0.0.0 --port 8000")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
