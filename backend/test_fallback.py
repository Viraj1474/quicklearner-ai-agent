"""
Test script for API Fallback System

This script demonstrates:
1. Automatic provider fallback when rate limit is hit
2. Provider status monitoring
3. Switch history tracking

Run after starting backend:
    python test_fallback.py
"""

import asyncio
import aiohttp
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

async def test_provider_status():
    """Check current provider status"""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/providers/status") as resp:
            data = await resp.json()
            print("\n" + "="*70)
            print("📊 PROVIDER STATUS")
            print("="*70)
            print(json.dumps(data, indent=2))
            return data

async def test_chat():
    """Test chat endpoint (will trigger fallback if needed)"""
    print("\n" + "="*70)
    print("💬 TESTING CHAT ENDPOINT")
    print("="*70)
    
    async with aiohttp.ClientSession() as session:
        payload = {
            "message": "What is the capital of France?"
        }
        
        try:
            async with session.post(
                f"{BASE_URL}/chat",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                data = await resp.json()
                
                if resp.status == 200:
                    print(f"✓ Chat successful")
                    print(f"  Response: {data['message'][:100]}...")
                    print(f"  Session ID: {data['session_id']}")
                else:
                    print(f"✗ Chat failed: {resp.status}")
                    print(f"  Error: {data}")
                    
        except asyncio.TimeoutError:
            print("✗ Chat timeout - checking provider status...")
            status = await test_provider_status()
            return

async def test_summarize():
    """Test summarize endpoint"""
    print("\n" + "="*70)
    print("📝 TESTING SUMMARIZE ENDPOINT")
    print("="*70)
    
    test_text = """
    Machine learning is a subset of artificial intelligence that enables 
    systems to learn and improve from experience without being explicitly 
    programmed. It focuses on developing algorithms and models that can 
    analyze data, identify patterns, and make decisions with minimal human 
    intervention. Common applications include recommendation systems, image 
    recognition, natural language processing, and autonomous vehicles.
    """
    
    async with aiohttp.ClientSession() as session:
        payload = {
            "text": test_text,
            "title": "ML Overview"
        }
        
        try:
            async with session.post(
                f"{BASE_URL}/summarize",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                data = await resp.json()
                
                if resp.status == 200:
                    print(f"✓ Summarization successful")
                    print(f"  Summary: {data['summary'][:150]}...")
                    print(f"  Compression: {data['original_length']} → {data['summary_length']} chars")
                else:
                    print(f"✗ Summarization failed: {resp.status}")
                    print(f"  Error: {data}")
                    
        except asyncio.TimeoutError:
            print("✗ Summarization timeout - provider might be rate limited")
            status = await test_provider_status()
            return

async def test_quiz():
    """Test quiz generation endpoint"""
    print("\n" + "="*70)
    print("🎯 TESTING QUIZ ENDPOINT")
    print("="*70)
    
    async with aiohttp.ClientSession() as session:
        payload = {
            "topic": "Python Programming",
            "num_questions": 3,
            "difficulty": "medium"
        }
        
        try:
            async with session.post(
                f"{BASE_URL}/quiz/generate",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                data = await resp.json()
                
                if resp.status == 200:
                    print(f"✓ Quiz generation successful")
                    print(f"  Questions: {len(data['questions'])}")
                    if data['questions']:
                        print(f"  First question: {data['questions'][0]['question'][:80]}...")
                else:
                    print(f"✗ Quiz generation failed: {resp.status}")
                    print(f"  Error: {data}")
                    
        except asyncio.TimeoutError:
            print("✗ Quiz generation timeout - checking provider status...")
            status = await test_provider_status()
            return

async def main():
    """Run all tests"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*15 + "🧪 API FALLBACK SYSTEM TEST" + " "*25 + "║")
    print("╚" + "="*68 + "╝")
    print(f"\nTest started at: {datetime.now().isoformat()}")
    print(f"Backend URL: {BASE_URL}")
    
    try:
        # 1. Check provider status first
        status = await test_provider_status()
        print(f"\n✓ Current provider: {status['current_provider']}")
        print(f"✓ Primary: {status['primary_provider']}")
        print(f"✓ Fallback: {status['fallback_provider']}")
        
        # 2. Test API endpoints (these will use fallback if needed)
        await test_chat()
        await test_summarize()
        await test_quiz()
        
        # 3. Check status again to see if any switches occurred
        print("\n" + "="*70)
        print("📊 FINAL PROVIDER STATUS (checking for switches)")
        print("="*70)
        final_status = await test_provider_status()
        
        recent_switches = final_status['health_status']['recent_switches']
        if recent_switches:
            print(f"\n⚠️  {len(recent_switches)} provider switch(es) detected:")
            for switch in recent_switches[-3:]:
                print(f"  • {switch['from']} → {switch['to']}")
                print(f"    Reason: {switch['reason']}")
        else:
            print(f"\n✓ No provider switches - all APIs working normally")
        
    except ConnectionError:
        print("\n❌ ERROR: Could not connect to backend at {BASE_URL}")
        print("Please make sure the backend is running:")
        print("  python server.py")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "="*70)
    print(f"Test completed at: {datetime.now().isoformat()}")
    print("="*70 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
