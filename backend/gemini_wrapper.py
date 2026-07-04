"""
Centralized wrapper for Google Gemini API calls with timeout, error handling, and logging.
Ensures all AI requests are safe, timeout-protected, and return user-friendly errors.

IMPORTANT: Uses gemini-2.5-flash model.
API calls are rate-limited to 1 request per second minimum.
No auto-retry logic - single call per user action.
"""
import asyncio
import logging
import json
import time
from typing import Optional, List, Dict, Any
from datetime import datetime

from config import settings

# Configure logging
logger = logging.getLogger("gemini_wrapper")

# Hardcoded model name - do not override via env or config
MODEL_NAME = "gemini-2.5-flash"

# Rate limiting: minimum seconds between API calls
MIN_CALL_INTERVAL_SECONDS = 1.0

class GeminiAPIError(Exception):
    """Custom exception for Gemini API errors"""
    def __init__(self, message: str, error_type: str = "api_error"):
        self.message = message
        self.error_type = error_type
        super().__init__(self.message)


class GeminiWrapper:
    """Wrapper for safe, timeout-protected Gemini API calls
    
    Features:
    - Lazy initialization (client created on first use, not at import)
    - Rate limiting (minimum 1 second between calls)
    - No auto-retry (single call per user action)
    - Empty prompt rejection
    - Request logging for duplicate detection
    """
    
    # Configuration constants
    TIMEOUT_SECONDS = 60  # Increased for complex queries like roadmaps
    MAX_CHAT_MESSAGE = 5000
    MAX_TEXT_INPUT = 50000
    MAX_TOPIC_LENGTH = 200
    MAX_NUM_ITEMS = 50
    
    def __init__(self):
        """Initialize wrapper - client created lazily on first use"""
        self._client = None  # Lazy initialization
        self._last_call_time = 0.0  # For rate limiting
        self._call_count = 0  # For logging
        logger.info(f"✓ GeminiWrapper created (model: {MODEL_NAME}, lazy init)")
    
    def _get_client(self):
        """Get or create the Gemini client (lazy initialization)"""
        if self._client is None:
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                raise GeminiAPIError(
                    "GEMINI_API_KEY not configured in environment",
                    "config_error"
                )
            try:
                from google import genai
                self._client = genai.Client(api_key=api_key)
                logger.info(f"✓ Gemini client initialized (model: {MODEL_NAME})")
            except Exception as e:
                logger.error(f"✗ Failed to initialize Gemini client: {str(e)}")
                raise GeminiAPIError(
                    "Failed to initialize AI service. Check API key.",
                    "init_error"
                )
        return self._client
    
    async def _enforce_rate_limit(self):
        """Enforce minimum delay between API calls"""
        now = time.time()
        elapsed = now - self._last_call_time
        if elapsed < MIN_CALL_INTERVAL_SECONDS:
            wait_time = MIN_CALL_INTERVAL_SECONDS - elapsed
            logger.debug(f"Rate limiting: waiting {wait_time:.2f}s")
            await asyncio.to_thread(time.sleep, wait_time)
        self._last_call_time = time.time()
    
    def validate_api_key(self) -> bool:
        """Check if API key is configured"""
        if not settings.GEMINI_API_KEY:
            logger.error("✗ GEMINI_API_KEY not configured in environment")
            return False
        return True
    
    def _log_request(self, operation: str, input_size: int, context: str = ""):
        """Log AI request attempt"""
        timestamp = datetime.utcnow().isoformat()
        logger.info(f"[{timestamp}] AI Request: {operation} | Input: {input_size} chars | {context}")
    
    def _log_response(self, operation: str, success: bool, output_size: int = 0, error_msg: str = ""):
        """Log AI response result"""
        timestamp = datetime.utcnow().isoformat()
        if success:
            logger.info(f"[{timestamp}] AI Response: {operation} ✓ | Output: {output_size} chars")
        else:
            logger.error(f"[{timestamp}] AI Error: {operation} ✗ | {error_msg}")
    
    async def _call_gemini(self, prompt: str, max_tokens: int = 2000) -> str:
        """
        Make a Gemini API call with timeout protection.
        
        IMPORTANT: Single call per user action - NO auto-retry.
        Rate limited to minimum 1 second between calls.
        
        Args:
            prompt: The prompt to send to Gemini
            max_tokens: Maximum tokens in response
            
        Returns:
            Generated text response
            
        Raises:
            GeminiAPIError: On API failure
        """
        # Validate prompt is not empty
        if not prompt or len(prompt.strip()) == 0:
            raise GeminiAPIError("Prompt cannot be empty", "validation_error")
        
        if not self.validate_api_key():
            raise GeminiAPIError(
                "AI service is not properly configured. Please check GEMINI_API_KEY.",
                "config_error"
            )
        
        # Enforce rate limiting
        await self._enforce_rate_limit()
        
        # Increment call counter and log
        self._call_count += 1
        logger.info(f"[API CALL #{self._call_count}] Model: {MODEL_NAME}, Prompt length: {len(prompt)} chars")
        
        try:
            # Get client (lazy initialization)
            client = self._get_client()
            
            def _sync_call():
                """Synchronous wrapper for Gemini call using new SDK - NO RETRY"""
                from google.genai import types
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        max_output_tokens=max_tokens,
                        temperature=0.7,
                    )
                )
                return response.text
            
            # Execute with timeout - SINGLE CALL, NO RETRY
            response_text = await asyncio.wait_for(
                asyncio.to_thread(_sync_call),
                timeout=self.TIMEOUT_SECONDS
            )
            
            return response_text
            
        except asyncio.TimeoutError:
            logger.error(f"✗ Gemini API timeout (>{self.TIMEOUT_SECONDS}s)")
            raise GeminiAPIError(
                "The AI service took too long to respond. Please try again.",
                "timeout_error"
            )
        except json.JSONDecodeError as e:
            logger.error(f"✗ JSON parsing error: {str(e)}")
            raise GeminiAPIError(
                "Invalid response format from AI service. Please try again.",
                "parse_error"
            )
        except ValueError as e:
            # Often a rate limit or billing error
            error_str = str(e).lower()
            if "quota" in error_str or "rate" in error_str or "429" in error_str or "exhausted" in error_str:
                logger.error(f"✗ Rate limit or quota exceeded: {str(e)}")
                raise GeminiAPIError(
                    "AI service quota exhausted. Your free tier daily limit has been reached. Please try again after midnight Pacific Time, or upgrade to a paid plan.",
                    "quota_exhausted"
                )
            elif "billing" in error_str or "api_key" in error_str:
                logger.error(f"✗ API billing/authentication issue: {str(e)}")
                raise GeminiAPIError(
                    "AI service authentication issue. Please contact support.",
                    "auth_error"
                )
            else:
                logger.error(f"✗ API value error: {str(e)}")
                raise GeminiAPIError(
                    f"AI service error: {str(e)}",
                    "api_error"
                )
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "quota" in error_str or "exhausted" in error_str:
                logger.error(f"✗ Quota exhausted: {str(e)}")
                raise GeminiAPIError(
                    "AI service quota exhausted. Your free tier daily limit has been reached. Please try again after midnight Pacific Time, or upgrade to a paid plan.",
                    "quota_exhausted"
                )
            elif "connection" in error_str or "network" in error_str:
                logger.error(f"✗ Network error: {str(e)}")
                raise GeminiAPIError(
                    "Network error connecting to AI service. Please check your connection.",
                    "network_error"
                )
            else:
                logger.error(f"✗ Unexpected error: {str(e)}")
                raise GeminiAPIError(
                    "An unexpected error occurred. Please try again.",
                    "unknown_error"
                )
    
    # ===== PUBLIC API METHODS =====
    
    async def generate_text(self, prompt: str, max_tokens: int = 2000) -> str:
        """
        Generate raw text response from prompt.
        
        This is a public wrapper around _call_gemini for general text generation.
        Useful for custom prompts in quiz generation, summarization, etc.
        
        Args:
            prompt: The prompt to send to the AI
            max_tokens: Maximum tokens in response
            
        Returns:
            Generated text response
        """
        self._log_request("generate_text", len(prompt))
        response = await self._call_gemini(prompt, max_tokens)
        self._log_response("generate_text", True, len(response))
        return response
    
    async def chat(self, message: str, history: Optional[List[Dict]] = None) -> str:
        """
        Chat with AI using conversation history.
        
        Args:
            message: User's message
            history: Conversation history
            
        Returns:
            AI response
            
        Raises:
            GeminiAPIError: On API failure or validation error
        """
        # Validate input
        if not message or len(message.strip()) == 0:
            raise GeminiAPIError("Message cannot be empty", "validation_error")
        if len(message) > self.MAX_CHAT_MESSAGE:
            raise GeminiAPIError(
                f"Message exceeds maximum length of {self.MAX_CHAT_MESSAGE} characters",
                "validation_error"
            )
        
        self._log_request("chat", len(message), f"session_history={len(history) if history else 0}")
        
        try:
            # Build conversation context
            if history and len(history) > 0:
                context = "\n".join([
                    f"{'User' if msg['sender'] == 'user' else 'AI'}: {msg['content']}"
                    for msg in history[-10:]  # Last 10 messages for context
                ])
                full_prompt = f"{context}\nUser: {message}\nAI:"
            else:
                full_prompt = f"You are a helpful AI study assistant. User: {message}\nAI:"
            
            response = await self._call_gemini(full_prompt, max_tokens=1500)
            self._log_response("chat", True, len(response))
            return response.strip()
            
        except GeminiAPIError:
            raise
        except Exception as e:
            logger.error(f"✗ Unexpected error in chat: {str(e)}")
            raise GeminiAPIError("Chat processing failed. Please try again.", "unknown_error")
    
    async def summarize(self, text: str) -> str:
        """
        Generate a summary of text.
        
        Args:
            text: Text to summarize
            
        Returns:
            Summary text
            
        Raises:
            GeminiAPIError: On API failure or validation error
        """
        # Validate input
        if not text or len(text.strip()) == 0:
            raise GeminiAPIError("Text cannot be empty", "validation_error")
        if len(text) > self.MAX_TEXT_INPUT:
            raise GeminiAPIError(
                f"Text exceeds maximum length of {self.MAX_TEXT_INPUT} characters",
                "validation_error"
            )
        
        self._log_request("summarize", len(text))
        
        try:
            prompt = f"""Please provide a concise and comprehensive summary of the following text. 
Focus on the main points, key concepts, and important details.

Text to summarize:
{text}

Summary:"""
            
            response = await self._call_gemini(prompt, max_tokens=1000)
            self._log_response("summarize", True, len(response))
            return response.strip()
            
        except GeminiAPIError:
            raise
        except Exception as e:
            logger.error(f"✗ Unexpected error in summarize: {str(e)}")
            raise GeminiAPIError("Summarization failed. Please try again.", "unknown_error")
    
    async def highlight_notes(self, text: str) -> Dict[str, Any]:
        """
        Analyze notes and highlight important concepts.
        
        Args:
            text: Notes text
            
        Returns:
            Dictionary with highlights, key_concepts, summary
            
        Raises:
            GeminiAPIError: On API failure or validation error
        """
        # Validate input
        if not text or len(text.strip()) == 0:
            raise GeminiAPIError("Notes text cannot be empty", "validation_error")
        if len(text) > self.MAX_TEXT_INPUT:
            raise GeminiAPIError(
                f"Notes exceed maximum length of {self.MAX_TEXT_INPUT} characters",
                "validation_error"
            )
        
        self._log_request("highlight_notes", len(text))
        
        try:
            prompt = f"""Analyze the following notes and provide:
1. A list of the most important highlights (mark each as high, medium, or low importance)
2. Key concepts covered
3. A brief summary

Format your response as JSON with keys: highlights, key_concepts, summary
Each highlight should have: text, importance, category

Notes:
{text}

Response (JSON):"""
            
            response = await self._call_gemini(prompt, max_tokens=1500)
            
            # Try to parse JSON
            try:
                result = json.loads(response)
                self._log_response("highlight_notes", True, len(response))
                return result
            except json.JSONDecodeError:
                # Fallback: create structured response from text
                logger.warning("✓ highlight_notes: JSON parsing failed, returning structured fallback")
                return {
                    "highlights": [
                        {"text": "Key concept", "importance": "high", "category": "main"}
                    ],
                    "key_concepts": ["Main concept"],
                    "summary": response[:200]
                }
            
        except GeminiAPIError:
            raise
        except Exception as e:
            logger.error(f"✗ Unexpected error in highlight_notes: {str(e)}")
            raise GeminiAPIError("Note analysis failed. Please try again.", "unknown_error")
    
    async def generate_quiz(self, topic: str, context: Optional[str] = None,
                           num_questions: int = 5, difficulty: str = "medium") -> List[Dict]:
        """
        Generate quiz questions.
        
        Args:
            topic: Quiz topic
            context: Optional study material context
            num_questions: Number of questions to generate
            difficulty: Quiz difficulty level
            
        Returns:
            List of quiz questions
            
        Raises:
            GeminiAPIError: On API failure or validation error
        """
        # Validate inputs
        if not topic or len(topic.strip()) == 0:
            raise GeminiAPIError("Topic cannot be empty", "validation_error")
        if len(topic) > self.MAX_TOPIC_LENGTH:
            raise GeminiAPIError(
                f"Topic exceeds maximum length of {self.MAX_TOPIC_LENGTH} characters",
                "validation_error"
            )
        if num_questions < 1 or num_questions > self.MAX_NUM_ITEMS:
            raise GeminiAPIError(
                f"Number of questions must be between 1 and {self.MAX_NUM_ITEMS}",
                "validation_error"
            )
        if context and len(context) > self.MAX_TEXT_INPUT:
            raise GeminiAPIError(
                f"Context text exceeds maximum length of {self.MAX_TEXT_INPUT} characters",
                "validation_error"
            )
        
        context_desc = f"with {len(context)} chars context" if context else "no context"
        self._log_request("generate_quiz", len(topic), f"topic={topic}, questions={num_questions}, {context_desc}")
        
        try:
            context_text = f"\n\nContext/Study Material:\n{context}" if context else ""
            
            prompt = f"""Create a {difficulty} difficulty quiz about {topic} with {num_questions} multiple-choice questions.
{context_text}

Format each question as JSON with:
- question: the question text
- options: array of 4 answer choices
- correct_answer: index (0-3) of the correct option
- explanation: brief explanation of the correct answer

Return a JSON array of questions.

Quiz Questions (JSON):"""
            
            response = await self._call_gemini(prompt, max_tokens=2000)
            
            # Try to parse JSON
            try:
                questions = json.loads(response)
                if not isinstance(questions, list):
                    questions = []
                self._log_response("generate_quiz", True, len(response))
                return questions
            except json.JSONDecodeError:
                # Fallback: return sample question
                logger.warning("✓ generate_quiz: JSON parsing failed, returning sample question")
                return [
                    {
                        "question": f"What is {topic}?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": 0,
                        "explanation": "This is a fallback question."
                    }
                ]
            
        except GeminiAPIError:
            raise
        except Exception as e:
            logger.error(f"✗ Unexpected error in generate_quiz: {str(e)}")
            raise GeminiAPIError("Quiz generation failed. Please try again.", "unknown_error")
    
    async def generate_flashcards(self, text: str, num_cards: int = 10) -> List[Dict]:
        """
        Generate flashcards from study material.
        
        Args:
            text: Study material text
            num_cards: Number of flashcards to generate
            
        Returns:
            List of flashcard dictionaries with 'front' and 'back' keys
            
        Raises:
            GeminiAPIError: On API failure or validation error
        """
        # Validate inputs
        if not text or len(text.strip()) == 0:
            raise GeminiAPIError("Study material cannot be empty", "validation_error")
        if len(text) > self.MAX_TEXT_INPUT:
            raise GeminiAPIError(
                f"Study material exceeds maximum length of {self.MAX_TEXT_INPUT} characters",
                "validation_error"
            )
        if num_cards < 1 or num_cards > self.MAX_NUM_ITEMS:
            raise GeminiAPIError(
                f"Number of cards must be between 1 and {self.MAX_NUM_ITEMS}",
                "validation_error"
            )
        
        self._log_request("generate_flashcards", len(text), f"num_cards={num_cards}")
        
        try:
            prompt = f"""Create {num_cards} flashcards from the following study material.
Each flashcard should have a question/term on the front and the answer/definition on the back.

Format as JSON array with 'front' and 'back' keys.

Study Material:
{text}

Flashcards (JSON):"""
            
            response = await self._call_gemini(prompt, max_tokens=2000)
            
            # Try to parse JSON
            try:
                cards = json.loads(response)
                if not isinstance(cards, list):
                    cards = []
                self._log_response("generate_flashcards", True, len(response))
                return cards
            except json.JSONDecodeError:
                # Fallback: return sample flashcard
                logger.warning("✓ generate_flashcards: JSON parsing failed, returning sample card")
                return [
                    {"front": "What is the main topic?", "back": "A key concept from the study material."}
                ]
            
        except GeminiAPIError:
            raise
        except Exception as e:
            logger.error(f"✗ Unexpected error in generate_flashcards: {str(e)}")
            raise GeminiAPIError("Flashcard generation failed. Please try again.", "unknown_error")


# Singleton instance
gemini_wrapper = GeminiWrapper()
