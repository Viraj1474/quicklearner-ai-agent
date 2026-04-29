"""
AI Fallback Wrapper - Automatic API Switching on Rate Limit/Failure

This module provides intelligent fallback between AI providers:
- Tries primary provider (configured in AI_PROVIDER)
- On rate limit or failure, automatically switches to fallback provider
- Logs all provider switches for monitoring
- Maintains provider health status

Supported fallback chain:
1. Primary: gemini or huggingface (configured)
2. Fallback: huggingface or gemini (alternate)
3. Last resort: Manual failover or user notification

Author: AI Study Assistant
"""

import logging
import asyncio
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum

from config import settings

logger = logging.getLogger(__name__)


class ProviderStatus(Enum):
    """Provider health status"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNAVAILABLE = "unavailable"


class ProviderHealthTracker:
    """Track provider health and rate limit status"""
    
    def __init__(self):
        self.providers = {
            "gemini": {
                "status": ProviderStatus.HEALTHY,
                "failures": 0,
                "last_error": None,
                "opened_until": None,
            },
            "huggingface": {
                "status": ProviderStatus.HEALTHY,
                "failures": 0,
                "last_error": None,
                "opened_until": None,
            }
        }
        self.switch_history = []
    
    def record_failure(self, provider: str, error: str):
        """Record a provider failure"""
        self.providers[provider]["failures"] += 1
        self.providers[provider]["last_error"] = error

        # Mark as degraded quickly and open a circuit after threshold failures
        if self.providers[provider]["failures"] >= settings.AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD:
            self.providers[provider]["opened_until"] = datetime.utcnow() + timedelta(
                seconds=settings.AI_CIRCUIT_BREAKER_COOLDOWN_SECONDS
            )
            self.providers[provider]["status"] = ProviderStatus.UNAVAILABLE
        elif self.providers[provider]["failures"] >= 2:
            self.providers[provider]["status"] = ProviderStatus.DEGRADED
    
    def record_success(self, provider: str):
        """Record successful provider use"""
        self.providers[provider]["failures"] = 0
        self.providers[provider]["status"] = ProviderStatus.HEALTHY
        self.providers[provider]["last_error"] = None
        self.providers[provider]["opened_until"] = None

    def can_attempt(self, provider: str) -> bool:
        """Check if provider circuit is closed (or cooldown elapsed)."""
        opened_until = self.providers[provider].get("opened_until")
        if not opened_until:
            return True
        if datetime.utcnow() >= opened_until:
            # Cooldown elapsed; allow half-open trial.
            self.providers[provider]["status"] = ProviderStatus.DEGRADED
            self.providers[provider]["opened_until"] = None
            return True
        return False
    
    def record_switch(self, from_provider: str, to_provider: str, reason: str):
        """Record provider switch"""
        self.switch_history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "from": from_provider,
            "to": to_provider,
            "reason": reason
        })
        logger.warning(
            f"🔄 Provider switched: {from_provider} → {to_provider} (Reason: {reason})"
        )
    
    def get_status(self) -> Dict:
        """Get overall provider status"""
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "providers": {name: {
                "status": info["status"].value,
                "failures": info["failures"],
                "last_error": info["last_error"],
                "opened_until": info["opened_until"].isoformat() if info["opened_until"] else None
            } for name, info in self.providers.items()},
            "recent_switches": self.switch_history[-10:]  # Last 10 switches
        }
    
    def is_rate_limit_error(self, error: str) -> bool:
        """Check if error is rate limit related"""
        rate_limit_keywords = [
            "rate limit",
            "quota",
            "too many requests",
            "429",
            "requests per minute",
            "requests exceeded"
        ]
        error_lower = str(error).lower()
        return any(keyword in error_lower for keyword in rate_limit_keywords)


class AIFallbackWrapper:
    """
    Intelligent AI wrapper with automatic fallback between providers.
    
    Usage:
        from ai_fallback_wrapper import ai_fallback_wrapper
        
        # Automatically tries primary, falls back if needed
        response = await ai_fallback_wrapper.chat("Hello!")
        summary = await ai_fallback_wrapper.summarize("Long text...")
    """
    
    def __init__(self):
        self._primary_provider = settings.AI_PROVIDER.lower()
        self._fallback_provider = settings.AI_FALLBACK_PROVIDER.lower()
        self._current_provider = self._primary_provider
        self._health_tracker = ProviderHealthTracker()
        self._client = None
        
        logger.info(
            f"✓ AIFallbackWrapper initialized\n"
            f"  Primary: {self._primary_provider}\n"
            f"  Fallback: {self._fallback_provider}"
        )
    
    def _get_fallback_provider(self, primary: str) -> str:
        """Get fallback provider based on primary"""
        if primary == "gemini":
            return "huggingface"
        elif primary == "huggingface":
            return "gemini"
        else:
            # Default fallback chain
            return "gemini" if primary != "gemini" else "huggingface"
    
    def _get_client(self, provider: str = None):
        """Get AI client for specified or current provider"""
        provider = provider or self._current_provider
        
        try:
            if provider == "gemini":
                from gemini_wrapper import gemini_wrapper
                return gemini_wrapper, "gemini"
            elif provider == "huggingface":
                from huggingface_client import huggingface_client
                return huggingface_client, "huggingface"
            else:
                logger.error(f"Unknown provider: {provider}")
                return None, None
        except Exception as e:
            logger.error(f"Error loading {provider} client: {e}")
            return None, None
    
    async def _try_with_fallback(self, method_name: str, *args, **kwargs) -> Any:
        """
        Try a method with primary provider, fall back if needed.
        
        Returns result or raises exception if both providers fail.
        """
        primary_error = None
        fallback_error = None
        
        # Try primary provider with retries unless circuit is open
        if self._health_tracker.can_attempt(self._primary_provider):
            for attempt in range(settings.AI_RETRY_ATTEMPTS + 1):
                try:
                    client, provider = self._get_client(self._primary_provider)
                    if client:
                        logger.debug(f"[{provider}] Attempting {method_name} (attempt={attempt + 1})...")
                        method = getattr(client, method_name)
                        result = await method(*args, **kwargs)

                        self._health_tracker.record_success(self._primary_provider)
                        self._current_provider = self._primary_provider
                        logger.info(f"✓ [{provider}] {method_name} succeeded")
                        return result
                except Exception as e:
                    primary_error = str(e)
                    self._health_tracker.record_failure(self._primary_provider, primary_error)
                    is_rate_limit = self._health_tracker.is_rate_limit_error(primary_error)
                    logger.warning(
                        f"✗ [{self._primary_provider}] {method_name} failed on attempt {attempt + 1}: {primary_error}; "
                        f"rate_limit={is_rate_limit}"
                    )

                    if attempt < settings.AI_RETRY_ATTEMPTS:
                        await asyncio.sleep(settings.AI_RETRY_BASE_DELAY_SECONDS * (2 ** attempt))
        else:
            primary_error = (
                f"Circuit open for {self._primary_provider}; cooldown active for "
                f"{settings.AI_CIRCUIT_BREAKER_COOLDOWN_SECONDS}s"
            )
            logger.warning(primary_error)
        
        # Try fallback provider
        logger.info(f"Attempting fallback to {self._fallback_provider}...")
        if self._health_tracker.can_attempt(self._fallback_provider):
            for attempt in range(settings.AI_RETRY_ATTEMPTS + 1):
                try:
                    client, provider = self._get_client(self._fallback_provider)
                    if client:
                        self._health_tracker.record_switch(
                            self._primary_provider,
                            self._fallback_provider,
                            f"Primary failed: {(primary_error or 'unknown')[:70]}"
                        )

                        logger.debug(f"[{provider}] Attempting {method_name} (fallback, attempt={attempt + 1})...")
                        method = getattr(client, method_name)
                        result = await method(*args, **kwargs)

                        self._health_tracker.record_success(self._fallback_provider)
                        self._current_provider = self._fallback_provider

                        logger.info(f"✓ [{provider}] {method_name} succeeded (fallback)")
                        return result
                except Exception as e:
                    fallback_error = str(e)
                    self._health_tracker.record_failure(self._fallback_provider, fallback_error)
                    logger.error(
                        f"✗ [{self._fallback_provider}] {method_name} failed on attempt {attempt + 1}: {fallback_error}"
                    )
                    if attempt < settings.AI_RETRY_ATTEMPTS:
                        await asyncio.sleep(settings.AI_RETRY_BASE_DELAY_SECONDS * (2 ** attempt))
        else:
            fallback_error = (
                f"Circuit open for {self._fallback_provider}; cooldown active for "
                f"{settings.AI_CIRCUIT_BREAKER_COOLDOWN_SECONDS}s"
            )
        
        # Both providers failed
        error_summary = (
            f"Both AI providers failed:\n"
            f"  Primary ({self._primary_provider}): {primary_error}\n"
            f"  Fallback ({self._fallback_provider}): {fallback_error}"
        )
        logger.error(error_summary)
        raise Exception(error_summary)
    
    @property
    def current_provider(self) -> str:
        """Get currently active provider"""
        return self._current_provider
    
    @property
    def primary_provider(self) -> str:
        """Get primary provider"""
        return self._primary_provider
    
    @property
    def fallback_provider(self) -> str:
        """Get fallback provider"""
        return self._fallback_provider
    
    def get_health_status(self) -> Dict:
        """Get health status of all providers"""
        return self._health_tracker.get_status()
    
    async def chat(self, message: str, history: Optional[List[Dict]] = None) -> str:
        """Chat with automatic fallback"""
        return await self._try_with_fallback("chat", message, history)
    
    async def summarize(self, text: str) -> str:
        """Summarize with automatic fallback"""
        return await self._try_with_fallback("summarize", text)
    
    async def generate_quiz(
        self,
        topic: str,
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict]:
        """Generate quiz with automatic fallback"""
        return await self._try_with_fallback(
            "generate_quiz",
            topic,
            num_questions,
            difficulty
        )
    
    async def generate_flashcards(
        self,
        text: str,
        num_cards: int = 10
    ) -> List[Dict]:
        """Generate flashcards with automatic fallback"""
        return await self._try_with_fallback(
            "generate_flashcards",
            text,
            num_cards
        )
    
    async def highlight_notes(self, text: str) -> Dict:
        """Highlight notes with automatic fallback"""
        return await self._try_with_fallback("highlight_notes", text)


# Singleton instance
ai_fallback_wrapper = AIFallbackWrapper()
