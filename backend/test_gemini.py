#!/usr/bin/env python3
"""
Minimal Gemini API Test Script

This script sends EXACTLY ONE request to the Gemini API to verify:
1. API key is working
2. Model gemini-2.5-flash is accessible
3. No quota exceeded errors

Usage:
    python test_gemini.py

Environment:
    GEMINI_API_KEY must be set in .env or as environment variable
"""
import os
import sys

# Load .env file
from dotenv import load_dotenv
load_dotenv()

def test_gemini_single_request():
    """Send exactly ONE request to Gemini API and print result"""
    
    # Get API key from environment
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in environment")
        print("   Set it in .env file or export GEMINI_API_KEY=your_key")
        sys.exit(1)
    
    print(f"✓ API key found (starts with: {api_key[:10]}...)")
    
    # Hardcoded model - DO NOT CHANGE
    MODEL_NAME = "gemini-2.5-flash"
    
    print(f"✓ Using model: {MODEL_NAME}")
    print("=" * 50)
    print("Sending ONE test request...")
    print("=" * 50)
    
    try:
        from google import genai
        from google.genai import types
        
        # Create client
        client = genai.Client(api_key=api_key)
        
        # Send exactly ONE request
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents="Hello, this is a test. Please respond with: Test successful!",
            config=types.GenerateContentConfig(
                max_output_tokens=100,
                temperature=0.1,  # Low temperature for consistent response
            )
        )
        
        print("\n✅ SUCCESS! API Response:")
        print("-" * 50)
        print(response.text)
        print("-" * 50)
        print("\n✓ Gemini API is working correctly!")
        print(f"✓ Model: {MODEL_NAME}")
        print("✓ No quota errors detected")
        
        return True
        
    except Exception as e:
        error_str = str(e).lower()
        print(f"\n❌ ERROR: {e}")
        
        if "429" in str(e) or "quota" in error_str or "exhausted" in error_str:
            print("\n⚠️  QUOTA EXHAUSTED")
            print("   Your free tier daily limit has been reached.")
            print("   Options:")
            print("   1. Wait until midnight Pacific Time (quota resets daily)")
            print("   2. Use a different Google Cloud project with fresh API key")
            print("   3. Enable billing for unlimited API calls")
        elif "403" in str(e) or "permission" in error_str:
            print("\n⚠️  PERMISSION DENIED")
            print("   The Generative Language API may not be enabled.")
            print("   Visit: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com")
        elif "404" in str(e) or "not found" in error_str:
            print("\n⚠️  MODEL NOT FOUND")
            print(f"   Model '{MODEL_NAME}' may not be available.")
            print("   Check available models at: https://ai.google.dev/gemini-api/docs/models")
        else:
            print("\n⚠️  UNEXPECTED ERROR")
            print("   Check your API key and network connection.")
        
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("GEMINI API TEST - Single Request")
    print("=" * 50)
    
    success = test_gemini_single_request()
    
    print("\n" + "=" * 50)
    if success:
        print("TEST PASSED ✅")
    else:
        print("TEST FAILED ❌")
    print("=" * 50)
    
    sys.exit(0 if success else 1)
