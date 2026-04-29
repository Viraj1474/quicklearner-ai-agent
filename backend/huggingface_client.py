"""
Hugging Face API Client for AI Study Assistant

This module provides an alternative AI backend using Hugging Face's Inference API.
It mirrors the functionality of gemini_client.py for easy swapping between providers.

Uses the huggingface_hub InferenceClient for modern API compatibility.

Author: AI Study Assistant
"""

from huggingface_hub import InferenceClient
import json
from typing import Optional, List, Dict
from config import settings
import logging

logger = logging.getLogger(__name__)

# Model name is read from HUGGINGFACE_MODEL env var (default: Qwen/Qwen2.5-72B-Instruct)


class HuggingFaceClient:
    """Client for interacting with Hugging Face Inference API"""
    
    def __init__(self):
        self.model_name = settings.HUGGINGFACE_MODEL
        self.api_key = settings.HUGGINGFACE_API_KEY
        
        if not self.api_key:
            logger.warning("HUGGINGFACE_API_KEY not set. Hugging Face API calls will fail.")
            self.client = None
        else:
            # Use the official huggingface_hub InferenceClient
            self.client = InferenceClient(
                token=self.api_key,
                timeout=60
            )
            logger.info(f"✓ HuggingFaceClient initialized (model: {self.model_name})")

    def _model_candidates(self) -> List[str]:
        """Return ordered model candidates for resilient generation."""
        candidates = [
            self.model_name,
            "microsoft/DialoGPT-medium",
            "gpt2",
        ]

        unique: List[str] = []
        for name in candidates:
            if name and name not in unique:
                unique.append(name)
        return unique

    @staticmethod
    def _is_model_compat_error(error: Exception) -> bool:
        message = str(error).lower()
        return (
            "404 client error" in message
            or "not found for url" in message
            or "not supported for task" in message
            or "model" in message and "not supported" in message
        )

    def _generate_via_conversational(
        self,
        prompt: str,
        model_name: str,
        max_tokens: int = 2000,
        past_user_inputs: Optional[List[str]] = None,
        generated_responses: Optional[List[str]] = None
    ) -> str:
        """Generate text using Hugging Face conversational API for a specific model."""
        if not self.client:
            raise RuntimeError("Hugging Face API key not configured.")

        response = self.client.conversational(
            prompt,
            past_user_inputs=past_user_inputs,
            generated_responses=generated_responses,
            parameters={
                "max_new_tokens": min(max_tokens, 4096),
                "temperature": 0.7,
            },
            model=model_name,
        )

        if hasattr(response, "generated_text"):
            return response.generated_text
        if isinstance(response, dict):
            return response.get("generated_text", str(response))
        return str(response)

    def _generate_via_text_generation(self, prompt: str, model_name: str, max_tokens: int = 2000) -> str:
        """Fallback generation path for models that don't support conversational task."""
        if not self.client:
            raise RuntimeError("Hugging Face API key not configured.")

        response = self.client.text_generation(
            prompt,
            model=model_name,
            max_new_tokens=min(max_tokens, 1024),
            temperature=0.7,
            return_full_text=False,
            do_sample=True,
        )

        return response if isinstance(response, str) else str(response)
    
    def _generate_text(self, prompt: str, max_tokens: int = 2000) -> str:
        """Generate text using chat completion API"""
        if not self.client:
            raise RuntimeError("Hugging Face API key not configured.")

        errors: List[str] = []
        for model_name in self._model_candidates():
            try:
                return self._generate_via_conversational(prompt, model_name, max_tokens)
            except Exception as conversational_err:
                errors.append(f"[{model_name}/conversational] {conversational_err}")
                if not self._is_model_compat_error(conversational_err):
                    continue

            try:
                return self._generate_via_text_generation(prompt, model_name, max_tokens)
            except Exception as text_err:
                errors.append(f"[{model_name}/text_generation] {text_err}")

        error_summary = " ; ".join(errors[:6])
        logger.error(f"Hugging Face API error after model fallbacks: {error_summary}")
        raise RuntimeError(f"All Hugging Face model candidates failed: {error_summary}")
    
    async def generate_text(self, prompt: str, max_tokens: int = 2000) -> str:
        """Async wrapper for generate_text"""
        return self._generate_text(prompt, max_tokens)
    
    async def chat(self, message: str, history: Optional[List[Dict]] = None) -> str:
        """Send a chat message and get a response"""
        try:
            if not self.client:
                raise RuntimeError("Hugging Face API key not configured.")

            past_user_inputs: List[str] = []
            generated_responses: List[str] = []

            if history and len(history) > 0:
                for msg in history[-10:]:
                    sender = msg.get('sender', 'user')
                    content = msg.get('content', '')
                    if sender == 'user':
                        past_user_inputs.append(content)
                    else:
                        generated_responses.append(content)

            prompt = (
                "You are a helpful AI study assistant. Provide clear, educational responses.\n\n"
                f"User: {message}"
            )

            errors: List[str] = []
            for model_name in self._model_candidates():
                try:
                    return self._generate_via_conversational(
                        prompt,
                        model_name,
                        2000,
                        past_user_inputs=past_user_inputs or None,
                        generated_responses=generated_responses or None,
                    )
                except Exception as conversational_err:
                    errors.append(f"[{model_name}/conversational] {conversational_err}")
                    if not self._is_model_compat_error(conversational_err):
                        continue

                try:
                    transcript = []
                    for idx in range(max(len(past_user_inputs), len(generated_responses))):
                        if idx < len(past_user_inputs):
                            transcript.append(f"User: {past_user_inputs[idx]}")
                        if idx < len(generated_responses):
                            transcript.append(f"Assistant: {generated_responses[idx]}")
                    transcript.append(f"User: {message}")
                    transcript.append("Assistant:")
                    text_prompt = "\n".join(transcript)

                    return self._generate_via_text_generation(text_prompt, model_name, 512)
                except Exception as text_err:
                    errors.append(f"[{model_name}/text_generation] {text_err}")

            raise RuntimeError("All Hugging Face model candidates failed: " + " ; ".join(errors[:6]))
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            raise
    
    async def summarize(self, text: str) -> str:
        """Generate a summary of the given text"""
        prompt = f"""Please provide a concise and comprehensive summary of the following text. 
Focus on the main points, key concepts, and important details.

Text to summarize:
{text}

Summary:"""
        
        return await self.generate_text(prompt, max_tokens=1000)
    
    async def highlight_notes(self, text: str) -> Dict:
        """Analyze notes and highlight important concepts"""
        prompt = f"""Analyze the following notes and provide a JSON response with:
1. "highlights": array of objects with "text", "importance" (high/medium/low), "category"
2. "key_concepts": array of key concept strings
3. "summary": brief summary string

Notes:
{text}

Respond ONLY with valid JSON (no markdown, no explanation):"""
        
        try:
            response = await self.generate_text(prompt, max_tokens=1500)
            # Try to parse JSON from response
            try:
                # Try to find JSON in the response
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    return json.loads(json_str)
                return json.loads(response)
            except json.JSONDecodeError:
                # Fallback: create structured response
                return {
                    "highlights": [
                        {"text": "Key concept identified", "importance": "high", "category": "main"},
                        {"text": "Supporting detail", "importance": "medium", "category": "supporting"}
                    ],
                    "key_concepts": ["Main concept", "Supporting concept"],
                    "summary": response[:300] if response else "Unable to generate summary"
                }
        except Exception as e:
            logger.error(f"Error highlighting notes: {e}")
            return {
                "highlights": [],
                "key_concepts": [],
                "summary": f"Error analyzing notes: {str(e)}"
            }
    
    async def generate_quiz(self, topic: str, num_questions: int = 5, difficulty: str = "medium") -> List[Dict]:
        """Generate quiz questions on a topic"""
        prompt = f"""Generate {num_questions} {difficulty} difficulty quiz questions about: {topic}

For each question, provide:
1. The question text
2. Four answer options (a, b, c, d)
3. The correct answer letter
4. A brief explanation

Format as JSON array with objects containing: "question", "options" (object with a,b,c,d), "correct_answer", "explanation"

Respond ONLY with valid JSON array (no markdown, no explanation):"""

        try:
            response = await self.generate_text(prompt, max_tokens=2000)
            # Try to parse JSON
            try:
                json_start = response.find('[')
                json_end = response.rfind(']') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    return json.loads(json_str)
                return json.loads(response)
            except json.JSONDecodeError:
                # Return a sample question if parsing fails
                return [{
                    "question": f"What is an important concept in {topic}?",
                    "options": {"a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D"},
                    "correct_answer": "a",
                    "explanation": "This is a sample question. The AI response couldn't be parsed."
                }]
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            return []
    
    async def generate_flashcards(self, topic: str, num_cards: int = 10) -> List[Dict]:
        """Generate flashcards for studying a topic"""
        prompt = f"""Generate {num_cards} flashcards for studying: {topic}

Each flashcard should have a front (question/term) and back (answer/definition).

Format as JSON array with objects containing: "front", "back"

Respond ONLY with valid JSON array (no markdown, no explanation):"""

        try:
            response = await self.generate_text(prompt, max_tokens=2000)
            # Try to parse JSON
            try:
                json_start = response.find('[')
                json_end = response.rfind(']') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response[json_start:json_end]
                    return json.loads(json_str)
                return json.loads(response)
            except json.JSONDecodeError:
                # Return sample flashcards if parsing fails
                return [
                    {"front": f"What is {topic}?", "back": "Definition to be provided"},
                    {"front": f"Key concept in {topic}", "back": "Explanation to be provided"}
                ]
        except Exception as e:
            logger.error(f"Error generating flashcards: {e}")
            return []


# Create a singleton instance
huggingface_client = HuggingFaceClient()
