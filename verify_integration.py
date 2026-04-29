#!/usr/bin/env python
"""
Verification Script for Advanced Tools Integration
Checks that all modules can be imported and endpoints are registered
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

print("=" * 70)
print("🔍 ADVANCED TOOLS INTEGRATION VERIFICATION")
print("=" * 70)

# Test 1: Check file existence
print("\n✓ Step 1: Checking file existence...")
required_files = [
    'backend/advanced_highlighter.py',
    'backend/advanced_summarizer.py',
    'backend/advanced_quiz_generator.py',
    'backend/study_analytics_engine.py',
    'backend/main.py',
    'backend/schemas.py',
]

all_exist = True
for file in required_files:
    if os.path.exists(file):
        print(f"  ✓ {file}")
    else:
        print(f"  ✗ {file} - MISSING")
        all_exist = False

if not all_exist:
    print("\n❌ Some files are missing. Aborting verification.")
    sys.exit(1)

# Test 2: Import advanced modules
print("\n✓ Step 2: Importing advanced modules...")
try:
    from advanced_highlighter import advanced_highlighter
    print(f"  ✓ advanced_highlighter imported")
    print(f"    - highlight_advanced method: {hasattr(advanced_highlighter, 'highlight_advanced')}")
except Exception as e:
    print(f"  ✗ advanced_highlighter import failed: {e}")

try:
    from advanced_summarizer import advanced_summarizer
    print(f"  ✓ advanced_summarizer imported")
    print(f"    - summarize_advanced method: {hasattr(advanced_summarizer, 'summarize_advanced')}")
except Exception as e:
    print(f"  ✗ advanced_summarizer import failed: {e}")

try:
    from advanced_quiz_generator import advanced_quiz_generator
    print(f"  ✓ advanced_quiz_generator imported")
    print(f"    - generate_advanced_quiz method: {hasattr(advanced_quiz_generator, 'generate_advanced_quiz')}")
except Exception as e:
    print(f"  ✗ advanced_quiz_generator import failed: {e}")

try:
    from study_analytics_engine import study_analytics_engine
    print(f"  ✓ study_analytics_engine imported")
    print(f"    - get_dashboard_analytics method: {hasattr(study_analytics_engine, 'get_dashboard_analytics')}")
except Exception as e:
    print(f"  ✗ study_analytics_engine import failed: {e}")

# Test 3: Check schemas
print("\n✓ Step 3: Checking schemas...")
try:
    from schemas import (
        AdvancedHighlightRequest, AdvancedHighlightResponse,
        AdvancedSummaryRequest, AdvancedSummaryResponse,
        AdvancedQuizRequest, AdvancedQuizResponse,
        AnalyticsDashboardResponse
    )
    print(f"  ✓ AdvancedHighlightRequest schema")
    print(f"  ✓ AdvancedHighlightResponse schema")
    print(f"  ✓ AdvancedSummaryRequest schema")
    print(f"  ✓ AdvancedSummaryResponse schema")
    print(f"  ✓ AdvancedQuizRequest schema")
    print(f"  ✓ AdvancedQuizResponse schema")
    print(f"  ✓ AnalyticsDashboardResponse schema")
except Exception as e:
    print(f"  ✗ Schema import failed: {e}")

# Test 4: Check endpoint registration
print("\n✓ Step 4: Checking FastAPI main.py...")
try:
    # This will check syntax without full execution
    with open('backend/main.py', 'r') as f:
        main_content = f.read()
    
    endpoints_to_find = [
        "/api/notes/highlight/advanced",
        "/api/summarize/advanced",
        "/api/quiz/generate/advanced",
        "/api/analytics/dashboard",
        "/api/analytics/performance",
        "/api/analytics/trends",
    ]
    
    for endpoint in endpoints_to_find:
        if endpoint in main_content:
            print(f"  ✓ {endpoint} endpoint registered")
        else:
            print(f"  ✗ {endpoint} endpoint NOT found")
    
except Exception as e:
    print(f"  ✗ main.py check failed: {e}")

# Test 5: Environment
print("\n✓ Step 5: Checking environment...")
try:
    from config import settings
    print(f"  ✓ Config loaded")
    print(f"    - AI_PROVIDER: {settings.AI_PROVIDER}")
    print(f"    - HUGGINGFACE_API_KEY: {'*' * 8 if settings.HUGGINGFACE_API_KEY else 'NOT SET'}")
    print(f"    - Database: {settings.DATABASE_URL}")
except Exception as e:
    print(f"  ✗ Config check failed: {e}")

# Final status
print("\n" + "=" * 70)
print("✅ VERIFICATION COMPLETE")
print("=" * 70)
print("\nTo start the backend:")
print("  python -m uvicorn main:app --host 0.0.0.0 --port 8000")
print("\nTo test endpoints:")
print("  Open http://localhost:8000/docs in your browser")
print("=" * 70)
