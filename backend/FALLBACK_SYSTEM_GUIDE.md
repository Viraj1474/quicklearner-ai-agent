# Automated Fallback System Guide

Your project now has **automatic API fallback** - when Hugging Face hits rate limits, it automatically switches to Gemini!

## 🎯 How It Works

```
User Request
    ↓
Try Primary Provider (e.g., Hugging Face)
    ↓
    ✓ Success? → Return response
    ✗ Rate limited? → 
        ↓
    Try Fallback Provider (e.g., Gemini)
        ↓
        ✓ Success? → Return response (and log switch)
        ✗ Failed too? → Return error to user
```

## 📊 Fallback Chain

### Configuration: Hugging Face Primary

```env
AI_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
GEMINI_API_KEY=your_gemini_key_here
```

**Chain:** Hugging Face → Gemini (fallback)

### Configuration: Gemini Primary

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_key_here
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
```

**Chain:** Gemini → Hugging Face (fallback)

## 🔄 What Triggers a Switch?

The system automatically switches providers when:

1. **Rate limit detected**
   - "Rate limit exceeded"
   - "Quota exceeded"
   - "Too many requests" (429 error)
   - "Requests per minute limit"

2. **Provider unavailable**
   - Connection timeout
   - API not responding
   - Invalid API key

3. **Provider degraded**
   - After 2 failures: marked as DEGRADED
   - After 5 failures: marked as UNAVAILABLE

## 📡 Monitor Provider Status

### New Endpoint: `/api/providers/status`

Get current provider health:

```bash
curl http://localhost:8000/api/providers/status
```

**Response:**
```json
{
  "timestamp": "2025-04-12T10:30:00.000000",
  "current_provider": "huggingface",
  "primary_provider": "huggingface",
  "fallback_provider": "gemini",
  "health_status": {
    "providers": {
      "huggingface": {
        "status": "degraded",
        "failures": 3,
        "last_error": "Rate limit exceeded: 15 requests per minute"
      },
      "gemini": {
        "status": "healthy",
        "failures": 0,
        "last_error": null
      }
    },
    "recent_switches": [
      {
        "timestamp": "2025-04-12T10:29:45.000000",
        "from": "huggingface",
        "to": "gemini",
        "reason": "Primary failed: Rate limit exceeded: 15 requests per minute"
      }
    ]
  }
}
```

## 📝 Backend Logs

The system logs all switches:

```
🔄 Provider switched: huggingface → gemini (Reason: Primary failed: Rate limit exceeded)
✓ [gemini] chat succeeded (fallback)
```

## 🛠️ Usage (No Code Changes!)

**Everything happens automatically!** Your endpoints work the same:

```python
# This automatically tries Hugging Face, falls back to Gemini if needed
response = await ai_fallback_wrapper.chat("Hello!")

# All endpoints support fallback:
summary = await ai_fallback_wrapper.summarize(text)
quiz = await ai_fallback_wrapper.generate_quiz(topic, num_questions)
flashcards = await ai_fallback_wrapper.generate_flashcards(text, num_cards)
notes = await ai_fallback_wrapper.highlight_notes(text)
```

## 🚀 Best Practices

### 1. Always Set Both API Keys

```env
# Primary
AI_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx

# Fallback (REQUIRED for fallback to work!)
GEMINI_API_KEY=your_gemini_key
```

### 2. Monitor Health Status

Add this to your dashboard:

```javascript
// Check provider status periodically
async function checkProviderHealth() {
  const response = await fetch('/api/providers/status');
  const status = await response.json();
  
  if (status.current_provider !== status.primary_provider) {
    console.warn(`⚠️ Using fallback: ${status.current_provider}`);
  }
}

// Check every 5 minutes
setInterval(checkProviderHealth, 5 * 60 * 1000);
```

### 3. Alert on Repeated Switches

```python
# In your monitoring code
status = ai_fallback_wrapper.get_health_status()
if len(status['recent_switches']) > 5:
    alert("Frequent provider switches - check API quotas!")
```

### 4. Set Up API Key Rotation

```python
# Periodically update API keys to prevent complete outage
async def rotate_api_keys():
    # When one provider quota resets or new key is available
    os.environ["HUGGINGFACE_API_KEY"] = new_hf_key
    # System will automatically recover
```

## 📊 Rate Limits (as of 2025)

| Provider | Free Tier | Rate Limit |
|----------|-----------|-----------|
| **Gemini** | ✅ Yes | 15 req/min |
| **Hugging Face** | ✅ Yes | Depends on model (usually 30 req/min) |

**Note:** Always check current limits in provider documentation

## 🔧 Configuration Examples

### Example 1: Prefer Hugging Face (Lower Cost)

```env
AI_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_1234567890
GEMINI_API_KEY=AIzaSyD_xxxxxxxxxxxx

# Hugging Face is primary, falls back to Gemini if rate limited
```

### Example 2: Prefer Gemini (Higher Reliability)

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyD_xxxxxxxxxxxx
HUGGINGFACE_API_KEY=hf_1234567890

# Gemini is primary, falls back to Hugging Face if needed
```

### Example 3: Development (Both Available)

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyD_xxxxxxxxxxxx
HUGGINGFACE_API_KEY=hf_1234567890

# Test with Gemini, fall back locally without disruption
```

## 🎛️ Advanced: Custom Fallback Logic

If you need more control, you can extend the fallback wrapper:

```python
from ai_fallback_wrapper import AIFallbackWrapper

class CustomFallbackWrapper(AIFallbackWrapper):
    async def _try_with_fallback(self, method_name, *args, **kwargs):
        """Custom logic: prefer cheaper provider first"""
        
        # Try Hugging Face first (cheaper)
        try:
            # ... custom logic ...
            pass
        except:
            # Fall back to Gemini (more reliable)
            pass
```

## 🐛 Troubleshooting

### Both providers failing?

```bash
# Check provider status
curl http://localhost:8000/api/providers/status

# Check logs for errors
tail -f backend.log | grep "Provider switched"

# Verify API keys are set
echo $HUGGINGFACE_API_KEY
echo $GEMINI_API_KEY
```

### Frequent switches?

- Your primary provider is rate limited
- Consider using a lower rate limit consumer or paid tier
- Check if quota resets at a specific time

### Provider stuck as "unavailable"?

- Restart backend: `python server.py`
- Or wait for automatic recovery (if you update API keys)
- Check that API keys are valid

## 📈 Monitoring Dashboard

Add these metrics to your dashboard:

```python
status = ai_fallback_wrapper.get_health_status()

metrics = {
    "active_provider": ai_fallback_wrapper.current_provider,
    "primary_provider": ai_fallback_wrapper.primary_provider,
    "gemini_status": status['providers']['gemini']['status'],
    "huggingface_status": status['providers']['huggingface']['status'],
    "switches_today": len([s for s in status['recent_switches'] 
                          if is_today(s['timestamp'])]),
}
```

## ✅ Checklist

- [ ] Both `GEMINI_API_KEY` and `HUGGINGFACE_API_KEY` are set in `.env`
- [ ] `AI_PROVIDER` is set to your preferred primary
- [ ] Backend is running: `python server.py`
- [ ] Health check passes: `curl http://localhost:8000/api/providers/status`
- [ ] Test: Make a request that will trigger both providers
- [ ] Monitor: Check `/api/providers/status` regularly

---

## 🎓 How It's Implemented

**File:** `backend/ai_fallback_wrapper.py`

Key components:
- `AIFallbackWrapper`: Main wrapper with fallback logic
- `ProviderHealthTracker`: Tracks provider status and failures
- `ProviderStatus`: Enum for health states (HEALTHY, DEGRADED, UNAVAILABLE)

**Integration in:** `backend/main.py`
- All AI endpoints now use `ai_fallback_wrapper` instead of direct `ai_wrapper`
- New endpoint: `/api/providers/status` for monitoring

That's it! Your system now has enterprise-grade API failover. 🚀
