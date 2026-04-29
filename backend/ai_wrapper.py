"""
Unified AI Wrapper - Supports multiple AI providers (Gemini, Hugging Face)

This module provides a unified interface for AI operations that can use either:
- Google Gemini API (default)
- Hugging Face Inference API

The provider is selected via the AI_PROVIDER environment variable:
- AI_PROVIDER=gemini (default) -> Uses Gemini API
- AI_PROVIDER=huggingface -> Uses Hugging Face API

Author: AI Study Assistant
"""

import logging
from typing import Optional, List, Dict, Any
from config import settings

logger = logging.getLogger(__name__)


class AIProviderError(Exception):
    """Custom exception for AI provider errors"""
    def __init__(self, message: str, error_type: str = "api_error"):
        self.message = message
        self.error_type = error_type
        super().__init__(self.message)


class UnifiedAIWrapper:
    """
    Unified wrapper that delegates to either Gemini or Hugging Face.
    
    Usage:
        from ai_wrapper import ai_wrapper
        
        # Use the same API regardless of provider
        response = await ai_wrapper.chat("Hello!")
        summary = await ai_wrapper.summarize("Long text...")
    """
    
    def __init__(self):
        self._provider = settings.AI_PROVIDER.lower()
        self._client = None
        logger.info(f"✓ UnifiedAIWrapper initialized (provider: {self._provider})")
    
    def _get_client(self):
        """Get the appropriate AI client based on configuration"""
        if self._client is not None:
            return self._client
            
        if self._provider == "huggingface":
            from huggingface_client import huggingface_client
            self._client = huggingface_client
            logger.info("✓ Using Hugging Face as AI provider")
        else:
            # Default to Gemini
            from gemini_wrapper import gemini_wrapper
            self._client = gemini_wrapper
            logger.info("✓ Using Gemini as AI provider")
        
        return self._client
    
    @property
    def provider_name(self) -> str:
        """Get the current provider name"""
        return self._provider
    
    async def chat(self, message: str, history: Optional[List[Dict]] = None) -> str:
        """Chat with the AI"""
        client = self._get_client()
        return await client.chat(message, history)
    
    async def summarize(self, text: str) -> str:
        """Summarize text"""
        client = self._get_client()
        return await client.summarize(text)
    
    async def highlight_notes(self, text: str) -> Dict:
        """Analyze and highlight notes"""
        client = self._get_client()
        return await client.highlight_notes(text)
    
    async def generate_quiz(self, topic: str, num_questions: int = 5, difficulty: str = "medium") -> List[Dict]:
        """Generate quiz questions"""
        client = self._get_client()
        return await client.generate_quiz(topic, num_questions, difficulty)
    
    async def generate_flashcards(self, topic: str = None, text: str = None, num_cards: int = 10) -> List[Dict]:
        """Generate flashcards"""
        client = self._get_client()
        # Hugging Face uses topic, Gemini might use text
        if hasattr(client, 'generate_flashcards'):
            if topic:
                return await client.generate_flashcards(topic, num_cards)
            elif text:
                return await client.generate_flashcards(text[:200], num_cards)  # Use first 200 chars as topic
        return []
    
    async def generate_text(self, prompt: str, max_tokens: int = 2000) -> str:
        """
        Generate raw text from a prompt.
        
        This is useful for custom prompts like quiz question generation,
        custom analysis, etc.
        
        Args:
            prompt: The prompt to send to the AI
            max_tokens: Maximum tokens in response
            
        Returns:
            Generated text response
        """
        client = self._get_client()
        if hasattr(client, 'generate_text'):
            return await client.generate_text(prompt, max_tokens)
        # Fallback to chat if generate_text not available
        return await client.chat(prompt)


# Singleton instance
ai_wrapper = UnifiedAIWrapper()


# For backward compatibility - expose GeminiAPIError
try:
    from gemini_wrapper import GeminiAPIError
except ImportError:
    GeminiAPIError = AIProviderError
