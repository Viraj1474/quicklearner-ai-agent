# API Integration Guide

This document shows how to add new AI providers to the project.

## Current Architecture

```
ai_wrapper.py (Router)
    ├── gemini_wrapper.py (Gemini provider)
    ├── huggingface_client.py (Hugging Face provider)
    └── [Your new provider here]
```

The `ai_wrapper.py` routes requests based on `AI_PROVIDER` environment variable.

---

## Adding a New API Provider

### Step 1: Create New Provider Client

Example: `claude_client.py`

```python
"""
Claude API Client for AI Study Assistant
"""
import anthropic
import logging
from typing import Optional, List, Dict
from config import settings

logger = logging.getLogger(__name__)

class ClaudeClient:
    """Client for Anthropic Claude API"""
    
    def __init__(self):
        self.api_key = settings.CLAUDE_API_KEY
        if not self.api_key:
            logger.warning("CLAUDE_API_KEY not set")
            self.client = None
        else:
            self.client = anthropic.Anthropic(api_key=self.api_key)
            logger.info("✓ ClaudeClient initialized")
    
    async def chat(self, message: str, history: Optional[List[Dict]] = None) -> str:
        """Chat with Claude"""
        try:
            messages = history or []
            messages.append({"role": "user", "content": message})
            
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                messages=messages
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Claude API error: {str(e)}")
            raise
    
    async def summarize(self, text: str) -> str:
        """Summarize text"""
        prompt = f"Please provide a concise summary of the following text:\n\n{text}"
        return await self.chat(prompt)
    
    async def generate_quiz(self, topic: str, num_questions: int = 5, difficulty: str = "medium") -> List[Dict]:
        """Generate quiz questions"""
        prompt = f"Generate {num_questions} {difficulty} multiple-choice questions about {topic}"
        response = await self.chat(prompt)
        # Parse and return JSON format
        return json.loads(response)
    
    # Add other methods as needed...

claude_client = ClaudeClient()
```

### Step 2: Update config.py

```python
class Settings:
    # ... existing settings ...
    
    # Claude API Key
    CLAUDE_API_KEY: str = os.getenv("CLAUDE_API_KEY", "")
    
    # Anthropic/OpenAI/Other providers
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
```

### Step 3: Update ai_wrapper.py

Modify the `_get_client()` method:

```python
def _get_client(self):
    """Get the appropriate AI client based on configuration"""
    if self._client is not None:
        return self._client
    
    if self._provider == "claude":
        from claude_client import claude_client
        self._client = claude_client
        logger.info("✓ Using Claude as AI provider")
    elif self._provider == "openai":
        from openai_client import openai_client
        self._client = openai_client
        logger.info("✓ Using OpenAI as AI provider")
    elif self._provider == "huggingface":
        from huggingface_client import huggingface_client
        self._client = huggingface_client
        logger.info("✓ Using Hugging Face as AI provider")
    else:
        # Default to Gemini
        from gemini_wrapper import gemini_wrapper
        self._client = gemini_wrapper
        logger.info("✓ Using Gemini as AI provider")
    
    return self._client
```

### Step 4: Install Dependencies

```bash
pip install anthropic  # For Claude
# or
pip install openai  # For OpenAI
```

### Step 5: Set Environment Variable

```bash
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-xxxxx
```

---

## Comparison of Popular APIs

| API | Status | Free Tier | Rate Limit | Latency | Cost |
|-----|--------|-----------|-----------|---------|------|
| **Gemini** | ✅ Implemented | 15 req/min | Good | 1-3s | Free with tier |
| **Hugging Face** | ✅ Implemented | Yes | Depends | 2-5s | Free tier available |
| **Claude** | 📝 Can add | No | 100K tokens/month | 1-2s | $3-20/month |
| **OpenAI** | 📝 Can add | $5 credit | 3.5K req/min | <1s | $0.50-$0.15 per 1K tokens |
| **Ollama** | 📝 Can add | Local (free) | N/A | Varies | Free (local) |

---

## Environment Variable Reference

### Gemini (Current Default)
```
AI_PROVIDER=gemini
GEMINI_API_KEY=your-api-key-here
GEMINI_TIMEOUT_SECONDS=18
```

### Hugging Face
```
AI_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
```

### Claude (Example)
```
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### OpenAI (Example)
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

---

## Testing Your New Provider

```python
# test_new_provider.py
import asyncio
from ai_wrapper import ai_wrapper

async def test():
    print(f"Current provider: {ai_wrapper.provider_name}")
    
    # Test chat
    response = await ai_wrapper.chat("Hello!")
    print(f"Chat response: {response[:100]}...")
    
    # Test summarize
    summary = await ai_wrapper.summarize("Long text here...")
    print(f"Summary: {summary[:100]}...")

asyncio.run(test())
```

---

## Free/Low-Cost Alternatives

1. **Gemini Free Tier** (Current) - 15 req/min ✅
2. **Ollama Local** - Free, runs locally, no API keys
3. **LLaMA 2 on Hugging Face** - Free inference
4. **Mistral 7B** - Free, high quality
5. **Groq** - Free tier with very fast inference

---

## Steps to Add Claude (Quick Example)

```bash
# 1. Install
pip install anthropic

# 2. Create claude_client.py (from Step 1 above)

# 3. Update config.py
# Add: CLAUDE_API_KEY: str = os.getenv("CLAUDE_API_KEY", "")

# 4. Update ai_wrapper.py (from Step 3 above)

# 5. Update .env
echo "AI_PROVIDER=claude" >> .env
echo "CLAUDE_API_KEY=sk-ant-xxxxx" >> .env

# 6. Restart backend
python server.py
```

---

## Need Help?

All provider clients must implement the same interface:

```python
class YourProvider:
    async def chat(message: str, history: Optional[List[Dict]]) -> str
    async def summarize(text: str) -> str
    async def generate_quiz(topic: str, num_questions: int, difficulty: str) -> List[Dict]
    async def generate_flashcards(text: str, num_cards: int) -> List[Dict]
    async def highlight_notes(text: str) -> Dict
```

Copy these methods from `gemini_wrapper.py` and adapt them to your API!
