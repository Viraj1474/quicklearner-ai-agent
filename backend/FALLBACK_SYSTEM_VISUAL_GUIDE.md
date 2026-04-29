# 🎯 API Fallback System - Visual Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your Application                             │
│  (Frontend, Mobile, Other Services)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                             │
│  (main.py)                                                      │
│  ├─ /api/chat              → ai_fallback_wrapper.chat()         │
│  ├─ /api/summarize         → ai_fallback_wrapper.summarize()    │
│  ├─ /api/quiz/generate     → ai_fallback_wrapper.generate_quiz()│
│  ├─ /api/flashcards/gen    → ai_fallback_wrapper.gen_flashcards│
│  ├─ /api/providers/status  → Health & switch history          │
│  └─ /api/health            → System health                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              AI Fallback Wrapper (NEW!)                          │
│  (ai_fallback_wrapper.py)                                       │
│                                                                  │
│  ┌─ Try Primary Provider                                       │
│  │  ├─ AI_PROVIDER=huggingface  OR  AI_PROVIDER=gemini        │
│  │  ├─ ✓ Success? ──────────────┐                             │
│  │  │                           │                             │
│  │  └─ Rate Limit/Error?        │    Record success           │
│  │     │                         │    Return response          │
│  │     ▼                         │                             │
│  │  Try Fallback Provider       │                             │
│  │  ├─ Switch to other one      │                             │
│  │  ├─ ✓ Success? ──────────────┤    Log provider switch      │
│  │  │  Record success           │    Return response          │
│  │  │                           │                             │
│  │  └─ Failed? ────────────┐    │                             │
│  │                         ▼    │                             │
│  │                    Return error                             │
│  │                    Log failure                              │
│  │                                                              │
│  └─ Health Tracker                                             │
│     ├─ Track failures per provider                            │
│     ├─ Maintain status (HEALTHY/DEGRADED/UNAVAILABLE)         │
│     ├─ Log all switches                                       │
│     └─ Expose via /api/providers/status                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   Gemini API     │  │ Hugging Face API │
        │ (15 req/min)     │  │ (30 req/min)     │
        └──────────────────┘  └──────────────────┘
```

## Request Flow Example

### Scenario: Hugging Face is rate limited

```
1. User sends chat request
   ↓
2. Backend tries HUGGINGFACE first (primary)
   ├─ Request sent to Hugging Face API
   ├─ Response: "429 Rate Limit Exceeded"
   ├─ System detects rate limit error
   ├─ Record failure for Hugging Face
   ├─ Mark Hugging Face as DEGRADED
   ↓
3. Automatically switch to GEMINI (fallback)
   ├─ Log: "🔄 Provider switched: huggingface → gemini"
   ├─ Request sent to Gemini API
   ├─ Response: "✓ Success"
   ├─ Record success for Gemini
   ├─ Current provider now: GEMINI
   ↓
4. Return response to user
   ├─ User gets chat response
   ├─ No error or delay visible
   ├─ Request succeeded transparently
   ↓
5. Log switch history
   └─ Frontend can check /api/providers/status
      to see that a switch occurred
```

## Health Status States

```
HEALTHY
  ├─ No recent failures
  ├─ All requests succeeding
  └─ Status: Ready to use
     
DEGRADED
  ├─ 2-4 consecutive failures
  ├─ Or recent rate limits detected
  ├─ Status: May need fallback soon
  └─ Will use fallback if failures continue
     
UNAVAILABLE
  ├─ 5+ consecutive failures
  ├─ Persistent API errors
  └─ Status: Do not use
```

## Configuration Comparison

### Setup A: Hugging Face Primary

```env
AI_PROVIDER=huggingface              Primary
     ↓
HUGGINGFACE_API_KEY=hf_xxxx          Used first (15-30 req/min)
     ↓ (on failure)
GEMINI_API_KEY=AIzaSyD_xxxx          Used as fallback (15 req/min)
```

**Pros:** Lower cost
**Cons:** May need more fallbacks

---

### Setup B: Gemini Primary

```env
AI_PROVIDER=gemini                   Primary
     ↓
GEMINI_API_KEY=AIzaSyD_xxxx          Used first (15 req/min)
     ↓ (on failure)
HUGGINGFACE_API_KEY=hf_xxxx          Used as fallback (15-30 req/min)
```

**Pros:** More reliable
**Cons:** Potentially higher cost if paid tier

## Combined Capacity

```
Gemini Only:                  ▓▓▓▓▓ (15 req/min)
Hugging Face Only:            ▓▓▓▓▓▓ (30 req/min)
Both with Fallback:           ▓▓▓▓▓ + ▓▓▓▓▓▓ = 45+ req/min! 🚀
```

## Switch Triggers

```
Rate Limit Error                  → Detected keywords:
                                    • "rate limit"
                                    • "quota exceeded"
                                    • "too many requests"
                                    • "429" or similar
                                    
Network Error                     → Timeout, connection refused
                                    
Invalid API Key                   → Authentication failed
                                    
Service Unavailable               → 503 or similar error
                                    
Repeated Failures                 → After 2 errors → DEGRADED
(2-5 consecutive)                 After 5 errors → UNAVAILABLE
```

## Monitoring Dashboard (Example)

```
┌──────────────────────────────────────────────┐
│  AI Provider Status Dashboard                 │
├──────────────────────────────────────────────┤
│                                              │
│ Current Provider:  🟢 Hugging Face           │
│ Primary:           Hugging Face              │
│ Fallback:          Gemini                    │
│                                              │
│ Provider Status:                             │
│ ┌─ Hugging Face                             │
│ │  Status:   🟢 HEALTHY                     │
│ │  Failures: 0                              │
│ │  Last Error: None                         │
│ │                                            │
│ └─ Gemini                                   │
│    Status:   🟢 HEALTHY                     │
│    Failures: 0                              │
│    Last Error: None                         │
│                                              │
│ Recent Switches:                            │
│  (none in last hour)                        │
│                                              │
│ System Uptime: 4 days, 12 hours             │
└──────────────────────────────────────────────┘
```

## Implementation Files

```
backend/
├── ai_fallback_wrapper.py          ← NEW: Fallback logic
├── main.py                         ← UPDATED: Uses fallback
├── ai_wrapper.py                   ← UNCHANGED: Still available
├── gemini_wrapper.py               ← UNCHANGED: Direct Gemini access
├── huggingface_client.py           ← UNCHANGED: Direct HF access
│
├── FALLBACK_SYSTEM_GUIDE.md        ← NEW: Usage guide
├── FALLBACK_SYSTEM_IMPLEMENTATION.md ← NEW: Implementation details
├── API_INTEGRATION_GUIDE.md        ← NEW: Add more providers
├── .env.example                    ← UPDATED: Config reference
└── test_fallback.py                ← NEW: Testing script
```

## API Endpoints Summary

```
NEW ENDPOINTS:
┌─────────────────────────────────────────────────────┐
│ GET /api/providers/status                           │
│ Returns:                                            │
│  • current_provider (which one is active)           │
│  • primary_provider (configured primary)            │
│  • fallback_provider (configured fallback)          │
│  • health_status (status of each provider)          │
│  • recent_switches (history of switches)            │
└─────────────────────────────────────────────────────┘

UPDATED ENDPOINTS (now support fallback):
┌─────────────────────────────────────────────────────┐
│ POST /api/chat                                      │
│ POST /api/summarize                                 │
│ POST /api/notes/highlight                           │
│ POST /api/quiz/generate                             │
│ POST /api/flashcards/generate                       │
└─────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
User Request
    ↓
┌───────────────────────────┐
│ Try Primary Provider      │
└───────────┬───────────────┘
            │
    ╔═══════╫═══════╗
    ║       ║       ║
Success  Timeout  RateLimit/Error
    ║       ║       ║
    ║       ║   ┌───┴──────────┐
    ║       ║   │ Try Fallback │
    ║       ║   └───┬──────────┘
    ║       ║       │
    ║       ║   ╔═══╫═══╗
    ║       ║   ║   ║   ║
    ║       ║ Success Timeout/Error
    ║       ║   ║   ║   ║
    ┗━━━━━━━╋━━━╋━━━┻───╫────┛
            │   │       │
            ▼   ▼       ▼
        Response Error Logged
        to User   (after
                  both failed)
```

## Timeline: Request with Fallback

```
00:00 - Request arrives
00:01 - Try Hugging Face
00:50 - Hugging Face responds: Rate Limit
00:51 - Detect rate limit, switch providers
00:52 - Log switch to console & backend.log
00:53 - Try Gemini
01:20 - Gemini responds: Success
01:21 - Return response to user
TOTAL: ~1.2 seconds (including network latency)
```

## Monitoring with CLI

```bash
# Check provider status every 5 seconds
watch -n 5 'curl -s http://localhost:8000/api/providers/status | jq'

# Check only switches
watch -n 5 'curl -s http://localhost:8000/api/providers/status | jq .health_status.recent_switches'

# Check current active provider
curl -s http://localhost:8000/api/providers/status | jq .current_provider

# Check if any provider is failing
curl -s http://localhost:8000/api/providers/status | jq '.health_status.providers[] | select(.status != "healthy")'
```

## Real-World Scenario

```
Day 1, 10:00 AM:
  All healthy, using Hugging Face (cheaper)
  ▓▓▓▓▓ Hugging Face: 28 requests ✓
  
Day 1, 2:00 PM:
  Traffic spike increases!
  ✗ Hugging Face hits rate limit
  🔄 System switches to Gemini automatically
  ▓▓▓ Gemini: 15 requests ✓
  
Day 1, 3:00 PM:
  Hugging Face rate limit resets
  ✓ System tries Hugging Face again
  ▓▓▓▓▓ Hugging Face: 20 requests ✓
  
Day 1, 5:00 PM:
  Another spike
  ✗ Hugging Face hits rate limit AGAIN
  🔄 Switches to Gemini
  ▓▓▓ Gemini: 14 requests ✓

Zero downtime through entire day! 💪
Users never experienced an error.
```

---

## Summary

✨ **Transparent**: Works automatically, no changes needed  
✨ **Reliable**: Never fails if one provider is down  
✨ **Scalable**: 45+ combined requests per minute  
✨ **Observable**: Full status tracking endpoint  
✨ **Extensible**: Easy to add more providers  

🚀 Your API is now production-ready with redundancy!
