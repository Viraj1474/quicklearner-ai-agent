import google.generativeai as genai
from typing import Optional, List, Dict
import json
import os
from config import settings

# Configure the Gemini API - Use GEMINI_API_KEY
genai.configure(api_key=settings.GEMINI_API_KEY)

# HARDCODED MODEL NAME - gemini-2.5-flash for best free-tier quota
# Do NOT use pro models - they have lower free-tier limits
MODEL_NAME = "gemini-2.5-flash"
model = genai.GenerativeModel(MODEL_NAME)

class GeminiClient:
    """Client for interacting with Google Gemini API"""
    

    def __init__(self):
        self.model = model
        self.chat_session = None
    
    async def generate_text(self, prompt: str, max_tokens: int = 2000) -> str:
        """Generate text from a prompt"""
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=0.7,
                )
            )
            return response.text
        except Exception as e:
            print(f"Error generating text: {e}")
            return f"Error: Unable to generate response. {str(e)}"
    
    async def chat(self, message: str, history: Optional[List[Dict]] = None) -> str:
        """Send a chat message and get a response"""
        try:
            if history and len(history) > 0:
                # Build conversation context
                context = "\n".join([
                    f"{'User' if msg['sender'] == 'user' else 'AI'}: {msg['content']}"
                    for msg in history[-10:]  # Last 10 messages for context
                ])
                full_prompt = f"{context}\nUser: {message}\nAI:"
            else:
                full_prompt = f"You are a helpful AI study assistant. User: {message}\nAI:"
            
            response = await self.generate_text(full_prompt)
            return response
        except Exception as e:
            print(f"Error in chat: {e}")
            return "I'm sorry, I encountered an error. Please try again."
    
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
        prompt = f"""Analyze the following notes and provide:
1. A list of the most important highlights (mark each as high, medium, or low importance)
2. Key concepts covered
3. A brief summary

Format your response as JSON with keys: highlights, key_concepts, summary

Notes:
{text}

Response (JSON):"""
        
        try:
            response = await self.generate_text(prompt, max_tokens=1500)
            # Try to parse JSON, fallback to structured response if needed
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                # Fallback: create structured response
                return {
                    "highlights": [
                        {"text": "Key concept 1", "importance": "high", "category": "main"},
                        {"text": "Key concept 2", "importance": "medium", "category": "supporting"}
                    ],
                    "key_concepts": ["Concept 1", "Concept 2", "Concept 3"],
                    "summary": response[:200]
                }
        except Exception as e:
            print(f"Error highlighting notes: {e}")
            return {
                "highlights": [],
                "key_concepts": [],
                "summary": "Error processing notes"
            }
    
    async def generate_quiz(self, topic: str, context: Optional[str] = None, 
                           num_questions: int = 5, difficulty: str = "medium") -> List[Dict]:
        """Generate a quiz based on topic or context"""
        
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
        
        try:
            response = await self.generate_text(prompt, max_tokens=2000)
            # Try to parse JSON
            try:
                questions = json.loads(response)
                return questions if isinstance(questions, list) else []
            except json.JSONDecodeError:
                # Fallback: create sample questions
                return [
                    {
                        "question": f"Sample question about {topic}",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": 0,
                        "explanation": "This is a placeholder question."
                    }
                ]
        except Exception as e:
            print(f"Error generating quiz: {e}")
            return []
    
    async def generate_flashcards(self, text: str, num_cards: int = 10) -> List[Dict]:
        """Generate flashcards from study material"""
        prompt = f"""Create {num_cards} flashcards from the following study material.
Each flashcard should have a question/term on the front and the answer/definition on the back.

Format as JSON array with 'front' and 'back' keys.

Study Material:
{text}

Flashcards (JSON):"""
        
        try:
            response = await self.generate_text(prompt, max_tokens=2000)
            try:
                cards = json.loads(response)
                return cards if isinstance(cards, list) else []
            except json.JSONDecodeError:
                # Fallback: create sample cards
                return [
                    {"front": "Sample question", "back": "Sample answer"}
                ]
        except Exception as e:
            print(f"Error generating flashcards: {e}")
            return []

# Singleton instance
gemini_client = GeminiClient()

