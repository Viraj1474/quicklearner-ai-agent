"""
Advanced Quiz Generator - Multiple question types with hints and explanations

Features:
- Mixed question types (MCQ, True/False, Short Answer, Fill-in-blank, Matching, Ordering, Code)
- Answer explanations and learning resources
- Adaptive difficulty progression
- Time estimates per question
- Progressive hint system
- Performance prediction
- Concept tagging and categorization
- Spaced repetition integration
- Question confidence scoring
- Review recommendations

Author: AI Study Assistant
"""

import logging
import re
import math
from typing import List, Dict, Optional, Tuple, Any
from enum import Enum
import random
from collections import defaultdict

logger = logging.getLogger(__name__)

# Common academic subjects for better categorization
SUBJECT_CATEGORIES = {
    'science': ['physics', 'chemistry', 'biology', 'astronomy', 'geology', 'environmental'],
    'math': ['algebra', 'calculus', 'statistics', 'geometry', 'trigonometry', 'probability'],
    'technology': ['programming', 'computer', 'software', 'algorithm', 'data', 'network'],
    'history': ['ancient', 'medieval', 'modern', 'war', 'civilization', 'revolution'],
    'language': ['grammar', 'vocabulary', 'literature', 'writing', 'reading', 'linguistics'],
    'social': ['psychology', 'sociology', 'economics', 'politics', 'anthropology', 'philosophy']
}

# Bloom's taxonomy levels for question depth
BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']


class QuestionType(Enum):
    """Available question types"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"
    FILL_IN_BLANK = "fill_in_blank"
    MATCHING = "matching"
    ORDERING = "ordering"
    CODE_COMPLETION = "code_completion"
    ESSAY = "essay"


class DifficultyLevel(Enum):
    """Difficulty levels with numeric values"""
    BEGINNER = ("beginner", 1)
    EASY = ("easy", 2)
    MEDIUM = ("medium", 3)
    HARD = ("hard", 4)
    EXPERT = ("expert", 5)
    
    def __init__(self, label: str, value: int):
        self._label = label
        self._value = value
    
    @property
    def label(self) -> str:
        return self._label
    
    @property
    def value(self) -> int:
        return self._value


class AdvancedQuizGenerator:
    """Advanced quiz generation with multiple question types and adaptive features"""
    
    def __init__(self):
        self.time_estimates = {
            "multiple_choice": 45,
            "true_false": 30,
            "short_answer": 90,
            "fill_in_blank": 40,
            "matching": 60,
            "ordering": 50,
            "code_completion": 120,
            "essay": 300
        }
        
        self.points_by_difficulty = {
            "beginner": 5,
            "easy": 10,
            "medium": 15,
            "hard": 25,
            "expert": 40
        }
        
        self.difficulty_order = ["beginner", "easy", "medium", "hard", "expert"]
    
    async def generate_advanced_quiz(
        self,
        topic: str,
        num_questions: int = 10,
        difficulty: str = "medium",
        question_types: Optional[List[str]] = None,
        with_hints: bool = True,
        with_explanations: bool = True,
        with_takeaways: bool = False,
        adaptive_difficulty: bool = True,
        bloom_level: Optional[str] = None,
        time_limit_minutes: Optional[int] = None,
        shuffle_questions: bool = True,
        shuffle_options: bool = True
    ) -> Dict:
        """
        Generate advanced quiz with multiple question types and adaptive features
        
        Args:
            topic: Quiz topic
            num_questions: Number of questions to generate
            difficulty: Base difficulty level
            question_types: List of question types to include
            with_hints: Include progressive hints
            with_explanations: Include answer explanations
            with_takeaways: Include key learning takeaways
            adaptive_difficulty: Gradually increase difficulty
            bloom_level: Target Bloom's taxonomy level
            time_limit_minutes: Optional time limit
            shuffle_questions: Randomize question order
            shuffle_options: Randomize answer options
            
        Returns:
            Dictionary with quiz data and metadata
        """
        try:
            # Default question types
            if not question_types:
                question_types = [
                    QuestionType.MULTIPLE_CHOICE.value,
                    QuestionType.TRUE_FALSE.value,
                    QuestionType.SHORT_ANSWER.value,
                    QuestionType.FILL_IN_BLANK.value
                ]
            
            # Detect subject category
            subject_category = self._detect_subject_category(topic)
            
            # Generate difficulty curve
            difficulty_sequence = self._generate_difficulty_sequence(
                num_questions, difficulty, adaptive_difficulty
            )
            
            # Generate questions
            questions = []
            total_time = 0
            total_points = 0
            concepts_covered = set()
            
            from ai_wrapper import ai_wrapper
            
            for i in range(num_questions):
                # Select question type with balanced distribution
                question_type = self._select_question_type(question_types, i, questions)
                current_difficulty = difficulty_sequence[i]
                
                # Generate question based on type
                question = await self._generate_question_by_type(
                    question_type, topic, current_difficulty,
                    with_hints, with_explanations, bloom_level
                )
                
                if question:
                    question["id"] = i + 1
                    question["question_id"] = f"q_{i+1}_{question_type[:3]}"
                    question["time_estimate"] = self.time_estimates.get(question_type, 60)
                    question["points"] = self.points_by_difficulty.get(current_difficulty, 15)
                    question["difficulty"] = current_difficulty
                    question["category"] = subject_category
                    question["concepts"] = self._extract_concepts(question.get("question", ""))
                    
                    total_time += question["time_estimate"]
                    total_points += question["points"]
                    concepts_covered.update(question["concepts"])
                    questions.append(question)
            
            # Shuffle if requested
            if shuffle_questions:
                random.shuffle(questions)
                # Re-number after shuffle
                for i, q in enumerate(questions):
                    q["id"] = i + 1
            
            if shuffle_options:
                for q in questions:
                    if q.get("type") == "multiple_choice" and q.get("options"):
                        correct = q.get("correct_answer", "a")
                        options = q["options"]
                        if isinstance(options, dict):
                            correct_val = options.get(correct)
                            items = list(options.items())
                            random.shuffle(items)
                            q["options"] = dict(items)
                            # Find new correct answer key
                            for k, v in q["options"].items():
                                if v == correct_val:
                                    q["correct_answer"] = k
                                    break
            
            # Generate key takeaways if requested
            takeaways = []
            if with_takeaways:
                takeaways = await self._generate_takeaways(topic, questions)
            
            result = {
                "topic": topic,
                "difficulty": difficulty,
                "total_questions": len(questions),
                "questions": questions,
                "total_points": total_points,
                "passing_score": int(total_points * 0.7),
                "estimated_time_minutes": total_time // 60,
                "estimated_time_seconds": total_time % 60,
                "time_limit_minutes": time_limit_minutes,
                "question_type_distribution": self._get_type_distribution(questions),
                "difficulty_distribution": self._get_difficulty_distribution(questions),
                "difficulty_curve": self._generate_difficulty_curve(questions),
                "concepts_covered": list(concepts_covered),
                "subject_category": subject_category,
                "bloom_level": bloom_level or "understand",
                "key_takeaways": takeaways,
                "with_hints": with_hints,
                "with_explanations": with_explanations,
                "review_recommendations": self._generate_review_recommendations(topic, concepts_covered),
                "metadata": {
                    "generated_at": self._get_timestamp(),
                    "version": "2.0",
                    "adaptive": adaptive_difficulty
                }
            }
            
            logger.info(f"✓ Advanced quiz generated: {len(questions)} questions on '{topic}' ({total_points} points)")
            return result
            
        except Exception as e:
            logger.error(f"Error in advanced quiz generation: {e}")
            return {
                "topic": topic,
                "error": str(e),
                "questions": [],
                "total_questions": 0
            }
    
    def _detect_subject_category(self, topic: str) -> str:
        """Detect subject category from topic"""
        topic_lower = topic.lower()
        for category, keywords in SUBJECT_CATEGORIES.items():
            for keyword in keywords:
                if keyword in topic_lower:
                    return category
        return "general"
    
    def _generate_difficulty_sequence(
        self, num_questions: int, base_difficulty: str, adaptive: bool
    ) -> List[str]:
        """Generate sequence of difficulty levels"""
        if not adaptive:
            return [base_difficulty] * num_questions
        
        sequence = []
        base_idx = self.difficulty_order.index(base_difficulty) if base_difficulty in self.difficulty_order else 2
        
        for i in range(num_questions):
            progress = i / max(1, num_questions - 1)
            
            # Start slightly easier, progress to harder
            if progress < 0.2:
                idx = max(0, base_idx - 1)
            elif progress < 0.5:
                idx = base_idx
            elif progress < 0.8:
                idx = min(len(self.difficulty_order) - 1, base_idx + 1)
            else:
                idx = min(len(self.difficulty_order) - 1, base_idx + 1)
            
            # Add some variation
            if random.random() < 0.2:
                idx = max(0, min(len(self.difficulty_order) - 1, idx + random.choice([-1, 1])))
            
            sequence.append(self.difficulty_order[idx])
        
        return sequence
    
    def _select_question_type(
        self, available_types: List[str], index: int, existing: List[Dict]
    ) -> str:
        """Select question type with balanced distribution"""
        type_counts = defaultdict(int)
        for q in existing:
            type_counts[q.get("type", "")] += 1
        
        # Prefer types that have been used less
        min_count = min(type_counts.get(t, 0) for t in available_types) if type_counts else 0
        candidates = [t for t in available_types if type_counts.get(t, 0) <= min_count + 1]
        
        return random.choice(candidates) if candidates else random.choice(available_types)
    
    async def _generate_question_by_type(
        self, question_type: str, topic: str, difficulty: str,
        with_hints: bool, with_explanations: bool, bloom_level: Optional[str]
    ) -> Optional[Dict]:
        """Generate question based on type"""
        
        generators = {
            QuestionType.MULTIPLE_CHOICE.value: self._generate_mcq,
            QuestionType.TRUE_FALSE.value: self._generate_true_false,
            QuestionType.SHORT_ANSWER.value: self._generate_short_answer,
            QuestionType.FILL_IN_BLANK.value: self._generate_fill_in_blank,
            QuestionType.MATCHING.value: self._generate_matching,
            QuestionType.ORDERING.value: self._generate_ordering,
            QuestionType.CODE_COMPLETION.value: self._generate_code_completion,
        }
        
        generator = generators.get(question_type)
        if generator:
            return await generator(topic, difficulty, with_hints, with_explanations, bloom_level)
        return None
    
    def _extract_concepts(self, text: str) -> List[str]:
        """Extract key concepts from question text"""
        # Remove common words and extract potential concepts
        stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                    'should', 'may', 'might', 'must', 'shall', 'can', 'of', 'in', 'to',
                    'for', 'with', 'on', 'at', 'by', 'from', 'as', 'into', 'which', 'what',
                    'when', 'where', 'why', 'how', 'this', 'that', 'these', 'those'}
        
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        concepts = [w for w in words if w not in stopwords]
        
        # Return unique concepts (up to 5)
        return list(dict.fromkeys(concepts))[:5]
    
    async def _generate_takeaways(self, topic: str, questions: List[Dict]) -> List[Dict]:
        """Generate key learning takeaways"""
        takeaways = []
        concepts = set()
        
        for q in questions:
            concepts.update(q.get("concepts", []))
        
        for i, concept in enumerate(list(concepts)[:5]):
            takeaways.append({
                "id": i + 1,
                "concept": concept.title(),
                "importance": "high" if i < 2 else "medium",
                "review_priority": 5 - i
            })
        
        return takeaways
    
    def _generate_review_recommendations(self, topic: str, concepts: set) -> List[Dict]:
        """Generate review recommendations"""
        return [
            {
                "type": "review",
                "title": f"Review {topic} fundamentals",
                "priority": "high",
                "estimated_time": "10 minutes"
            },
            {
                "type": "practice",
                "title": "Practice with more questions",
                "priority": "medium",
                "estimated_time": "15 minutes"
            }
        ]
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()

    
    async def _generate_mcq(
        self,
        topic: str,
        difficulty: str,
        with_hints: bool,
        with_explanations: bool,
        bloom_level: Optional[str] = None
    ) -> Dict:
        """Generate multiple choice question with progressive hints"""
        from ai_wrapper import ai_wrapper
        
        bloom_instruction = f"Target Bloom's taxonomy level: {bloom_level}. " if bloom_level else ""
        
        try:
            prompt = f"""You are an expert educator. Generate a {difficulty} difficulty multiple choice question about: {topic}

{bloom_instruction}STRICT RULES:
- Do NOT create questions about the phrase itself
- Do NOT repeat the topic text mechanically
- Do NOT use template wording like "What is the purpose of X?" or "Which of the following describes X?"
- Questions must test REAL understanding of the subject
- Make questions specific, meaningful, and factually correct
- If technical, test concepts and applications with code examples where appropriate
- Distractors must be plausible but clearly wrong

Requirements:
1. A clear, specific question testing real knowledge
2. Four answer options (a, b, c, d) with plausible distractors
3. The correct answer letter (lowercase)
4. A detailed explanation of why the answer is correct
5. Three progressive hints (general → specific → almost revealing answer)
6. Key concept being tested

Format as JSON:
{{
    "question": "...",
    "options": {{"a": "...", "b": "...", "c": "...", "d": "..."}},
    "correct_answer": "a/b/c/d",
    "explanation": "...",
    "hints": ["hint1", "hint2", "hint3"],
    "concept": "key concept name"
}}

Respond ONLY with valid JSON:"""
            
            response = await ai_wrapper.generate_text(prompt, max_tokens=600)
            
            try:
                import json
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    question_data = json.loads(response[json_start:json_end])
                else:
                    question_data = json.loads(response)
                
                hints = question_data.get("hints", [])
                if isinstance(hints, str):
                    hints = [hints]
                elif not hints:
                    hints = [question_data.get("hint", "Think about the definition.")]
                
                return {
                    "type": "multiple_choice",
                    "question": question_data.get("question", ""),
                    "options": question_data.get("options", {}),
                    "correct_answer": question_data.get("correct_answer", "a").lower(),
                    "explanation": question_data.get("explanation") if with_explanations else None,
                    "hints": hints if with_hints else [],
                    "hints_used": 0,
                    "concept": question_data.get("concept", topic),
                    "confidence_weight": 1.0
                }
            except:
                return self._get_sample_mcq(topic, difficulty)
                
        except Exception as e:
            logger.error(f"Error generating MCQ: {e}")
            return self._get_sample_mcq(topic, difficulty)
    
    async def _generate_true_false(
        self,
        topic: str,
        difficulty: str,
        with_hints: bool,
        with_explanations: bool,
        bloom_level: Optional[str] = None
    ) -> Dict:
        """Generate true/false question"""
        from ai_wrapper import ai_wrapper
        
        try:
            prompt = f"""You are an expert educator. Generate a {difficulty} true/false question about: {topic}

STRICT RULES:
- Do NOT create generic statements like "X is important" or "X is used for Y"
- Do NOT repeat the topic mechanically
- The statement must test REAL factual knowledge
- Make statements specific and academically sound
- Include subtle nuances that require actual understanding
- Statements should be clearly true OR false, not ambiguous

Requirements:
1. A clear, specific factual statement (not a question)
2. Whether it's true or false (boolean)
3. Detailed explanation of why it's true or false
4. A helpful hint that doesn't give away the answer
5. Common misconception that makes people get this wrong

Format as JSON:
{{
    "statement": "...",
    "correct_answer": true/false,
    "explanation": "...",
    "hint": "...",
    "misconception": "..." 
}}

Respond ONLY with valid JSON:"""
            
            response = await ai_wrapper.generate_text(prompt, max_tokens=400)
            
            try:
                import json
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    question_data = json.loads(response[json_start:json_end])
                else:
                    question_data = json.loads(response)
                
                is_true = question_data.get("correct_answer", True)
                if isinstance(is_true, str):
                    is_true = is_true.lower() == "true"
                
                return {
                    "type": "true_false",
                    "question": question_data.get("statement", ""),
                    "statement": question_data.get("statement", ""),
                    "options": {"a": "True", "b": "False"},
                    "correct_answer": "a" if is_true else "b",
                    "explanation": question_data.get("explanation") if with_explanations else None,
                    "hints": [question_data.get("hint", "")] if with_hints else [],
                    "misconception": question_data.get("misconception"),
                    "confidence_weight": 0.8
                }
            except:
                return self._get_sample_true_false(topic, difficulty)
                
        except Exception as e:
            logger.error(f"Error generating True/False: {e}")
            return self._get_sample_true_false(topic, difficulty)
    
    async def _generate_short_answer(
        self,
        topic: str,
        difficulty: str,
        with_hints: bool,
        with_explanations: bool,
        bloom_level: Optional[str] = None
    ) -> Dict:
        """Generate short answer question with rubric"""
        from ai_wrapper import ai_wrapper
        
        try:
            prompt = f"""You are an expert educator. Generate a {difficulty} short answer question about: {topic}

STRICT RULES:
- Do NOT ask "What is X?" or "Explain X" in a generic way
- Do NOT create template-style questions
- Ask questions that require REASONING and UNDERSTANDING
- Questions should test application of knowledge, not just definitions
- Be specific about what aspect of the topic you're asking about
- For technical topics, ask about real scenarios, comparisons, or problem-solving

Requirements:
1. An open-ended question requiring 1-3 sentences to answer properly
2. Model answer demonstrating ideal response
3. Key points to look for (3-5 specific points)
4. Grading rubric with clear criteria
5. Progressive hints that guide thinking

Format as JSON:
{{
    "question": "...",
    "model_answer": "...",
    "key_points": ["point1", "point2", "point3"],
    "rubric": {{
        "excellent": "criteria...",
        "good": "criteria...",
        "partial": "criteria...",
        "incorrect": "criteria..."
    }},
    "hints": ["hint1", "hint2"]
}}

Respond ONLY with valid JSON:"""
            
            response = await ai_wrapper.generate_text(prompt, max_tokens=600)
            
            try:
                import json
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    question_data = json.loads(response[json_start:json_end])
                else:
                    question_data = json.loads(response)
                
                return {
                    "type": "short_answer",
                    "question": question_data.get("question", ""),
                    "model_answer": question_data.get("model_answer") if with_explanations else None,
                    "key_points": question_data.get("key_points", []) if with_explanations else None,
                    "rubric": question_data.get("rubric") if with_explanations else None,
                    "hints": question_data.get("hints", []) if with_hints else [],
                    "requires_manual_grading": True,
                    "confidence_weight": 1.2
                }
            except:
                return self._get_sample_short_answer(topic, difficulty)
                
        except Exception as e:
            logger.error(f"Error generating Short Answer: {e}")
            return self._get_sample_short_answer(topic, difficulty)
    
    async def _generate_fill_in_blank(
        self,
        topic: str,
        difficulty: str,
        with_hints: bool,
        with_explanations: bool,
        bloom_level: Optional[str] = None
    ) -> Dict:
        """Generate fill-in-blank question"""
        from ai_wrapper import ai_wrapper
        
        try:
            prompt = f"""You are an expert educator. Generate a {difficulty} fill-in-the-blank question about: {topic}

STRICT RULES:
- Do NOT create generic definitional sentences
- The blank should test a KEY CONCEPT or TERM, not trivial words
- The sentence must make sense and be factually accurate
- Distractors should be plausible terms from the same domain
- For technical topics, test terminology, syntax, or important values

Requirements:
1. A meaningful statement with one blank indicated by _____ (5 underscores)
2. Four answer choices (a, b, c, d) - all plausible terms
3. The correct answer letter
4. Brief explanation of why this answer is correct
5. A helpful hint

Format as JSON:
{{
    "statement": "In Python, the _____ keyword is used to...",
    "options": {{"a": "...", "b": "...", "c": "...", "d": "..."}},
    "correct_answer": "a/b/c/d",
    "explanation": "...",
    "hint": "..."
}}

Respond ONLY with valid JSON:"""
            
            response = await ai_wrapper.generate_text(prompt, max_tokens=400)
            
            try:
                import json
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    question_data = json.loads(response[json_start:json_end])
                else:
                    question_data = json.loads(response)
                
                statement = question_data.get("statement", "")
                # Normalize blank marker
                statement = re.sub(r'_+|\[BLANK\]|\{BLANK\}', '_____', statement)
                
                return {
                    "type": "fill_in_blank",
                    "question": statement,
                    "statement": statement,
                    "options": question_data.get("options", {}),
                    "correct_answer": question_data.get("correct_answer", "a").lower(),
                    "explanation": question_data.get("explanation") if with_explanations else None,
                    "hints": [question_data.get("hint", "")] if with_hints else [],
                    "confidence_weight": 0.9
                }
            except:
                return self._get_sample_fill_in_blank(topic, difficulty)
                
        except Exception as e:
            logger.error(f"Error generating Fill-in-Blank: {e}")
            return self._get_sample_fill_in_blank(topic, difficulty)
    
    async def _generate_matching(
        self,
        topic: str,
        difficulty: str,
        with_hints: bool,
        with_explanations: bool,
        bloom_level: Optional[str] = None
    ) -> Dict:
        """Generate matching question with pairs"""
        from ai_wrapper import ai_wrapper
        
        try:
            prompt = f"""Generate a {difficulty} matching question about {topic}.

Create 4-5 pairs where items in column A match with items in column B.

Format as JSON:
{{
    "instruction": "Match the items in Column A with their corresponding items in Column B",
    "column_a": ["item1", "item2", "item3", "item4"],
    "column_b": ["match1", "match2", "match3", "match4"],
    "correct_matches": {{"0": 0, "1": 1, "2": 2, "3": 3}},
    "explanation": "...",
    "hint": "..."
}}

Respond ONLY with valid JSON:"""
            
            response = await ai_wrapper.generate_text(prompt, max_tokens=500)
            
            try:
                import json
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    question_data = json.loads(response[json_start:json_end])
                else:
                    question_data = json.loads(response)
                
                return {
                    "type": "matching",
                    "question": question_data.get("instruction", f"Match the {topic} concepts"),
                    "column_a": question_data.get("column_a", []),
                    "column_b": question_data.get("column_b", []),
                    "correct_matches": question_data.get("correct_matches", {}),
                    "explanation": question_data.get("explanation") if with_explanations else None,
                    "hints": [question_data.get("hint", "")] if with_hints else [],
                    "confidence_weight": 1.1
                }
            except:
                return self._get_sample_matching(topic, difficulty)
                
        except Exception as e:
            logger.error(f"Error generating Matching: {e}")
            return self._get_sample_matching(topic, difficulty)
    
    async def _generate_ordering(
        self,
        topic: str,
        difficulty: str,
        with_hints: bool,
        with_explanations: bool,
        bloom_level: Optional[str] = None
    ) -> Dict:
        """Generate ordering/sequencing question"""
        from ai_wrapper import ai_wrapper
        
        try:
            prompt = f"""Generate a {difficulty} ordering/sequencing question about {topic}.

Create 4-5 items that should be arranged in a specific order (chronological, logical, or procedural).

Format as JSON:
{{
    "instruction": "Arrange the following in correct order:",
    "items": ["item1", "item2", "item3", "item4"],
    "correct_order": [0, 1, 2, 3],
    "order_type": "chronological/procedural/logical",
    "explanation": "...",
    "hint": "..."
}}

Respond ONLY with valid JSON:"""
            
            response = await ai_wrapper.generate_text(prompt, max_tokens=500)
            
            try:
                import json
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    question_data = json.loads(response[json_start:json_end])
                else:
                    question_data = json.loads(response)
                
                items = question_data.get("items", [])
                # Shuffle for display
                shuffled_items = items.copy()
                random.shuffle(shuffled_items)
                
                return {
                    "type": "ordering",
                    "question": question_data.get("instruction", f"Put these {topic} items in order"),
                    "items": shuffled_items,
                    "original_items": items,
                    "correct_order": question_data.get("correct_order", list(range(len(items)))),
                    "order_type": question_data.get("order_type", "logical"),
                    "explanation": question_data.get("explanation") if with_explanations else None,
                    "hints": [question_data.get("hint", "")] if with_hints else [],
                    "confidence_weight": 1.0
                }
            except:
                return self._get_sample_ordering(topic, difficulty)
                
        except Exception as e:
            logger.error(f"Error generating Ordering: {e}")
            return self._get_sample_ordering(topic, difficulty)
    
    async def _generate_code_completion(
        self,
        topic: str,
        difficulty: str,
        with_hints: bool,
        with_explanations: bool,
        bloom_level: Optional[str] = None
    ) -> Dict:
        """Generate code completion question"""
        from ai_wrapper import ai_wrapper
        
        try:
            prompt = f"""Generate a {difficulty} code completion question about {topic}.

Create a code snippet with a missing part that the user needs to complete.

Format as JSON:
{{
    "instruction": "Complete the following code:",
    "code_before": "def example():\\n    x = 10\\n    ",
    "blank_description": "Add code to...",
    "code_after": "\\n    return result",
    "correct_answer": "result = x * 2",
    "language": "python",
    "explanation": "...",
    "hints": ["hint1", "hint2"]
}}

Respond ONLY with valid JSON:"""
            
            response = await ai_wrapper.generate_text(prompt, max_tokens=600)
            
            try:
                import json
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    question_data = json.loads(response[json_start:json_end])
                else:
                    question_data = json.loads(response)
                
                return {
                    "type": "code_completion",
                    "question": question_data.get("instruction", "Complete the code"),
                    "code_before": question_data.get("code_before", ""),
                    "blank_description": question_data.get("blank_description", ""),
                    "code_after": question_data.get("code_after", ""),
                    "correct_answer": question_data.get("correct_answer", ""),
                    "language": question_data.get("language", "python"),
                    "explanation": question_data.get("explanation") if with_explanations else None,
                    "hints": question_data.get("hints", []) if with_hints else [],
                    "requires_manual_grading": True,
                    "confidence_weight": 1.3
                }
            except:
                return self._get_sample_code_completion(topic, difficulty)
                
        except Exception as e:
            logger.error(f"Error generating Code Completion: {e}")
            return self._get_sample_code_completion(topic, difficulty)
    
    # Sample questions for fallback
    def _get_sample_mcq(self, topic: str, difficulty: str = "medium") -> Dict:
        return {
            "type": "multiple_choice",
            "question": f"Which of the following best describes a key characteristic of {topic}?",
            "options": {"a": f"Core principle of {topic}", "b": "Unrelated concept A", "c": "Unrelated concept B", "d": "Unrelated concept C"},
            "correct_answer": "a",
            "explanation": f"This answer correctly identifies a core principle of {topic}.",
            "hints": [
                "Think about the fundamental definition.",
                f"Consider what makes {topic} unique.",
                "The answer relates to the core concept."
            ],
            "concept": topic,
            "confidence_weight": 1.0
        }
    
    def _get_sample_true_false(self, topic: str, difficulty: str = "medium") -> Dict:
        return {
            "type": "true_false",
            "question": f"{topic.title()} is considered a fundamental concept in this field.",
            "statement": f"{topic.title()} is considered a fundamental concept in this field.",
            "options": {"a": "True", "b": "False"},
            "correct_answer": "a",
            "explanation": f"{topic.title()} is indeed fundamental because...",
            "hints": ["Consider the main applications of this concept."],
            "misconception": None,
            "confidence_weight": 0.8
        }
    
    def _get_sample_short_answer(self, topic: str, difficulty: str = "medium") -> Dict:
        return {
            "type": "short_answer",
            "question": f"Explain the key concepts of {topic} in your own words.",
            "model_answer": f"{topic.title()} involves understanding the core principles and their applications.",
            "key_points": ["Core definition", "Main applications", "Key characteristics"],
            "rubric": {
                "excellent": "Covers all key points with examples",
                "good": "Covers most key points",
                "partial": "Mentions some relevant concepts",
                "incorrect": "Does not address the topic"
            },
            "hints": [
                "Focus on the main definition.",
                "Include practical applications."
            ],
            "requires_manual_grading": True,
            "confidence_weight": 1.2
        }
    
    def _get_sample_fill_in_blank(self, topic: str, difficulty: str = "medium") -> Dict:
        return {
            "type": "fill_in_blank",
            "question": f"The main concept of {topic} is closely related to _____.",
            "statement": f"The main concept of {topic} is closely related to _____.",
            "options": {"a": "its core principle", "b": "unrelated A", "c": "unrelated B", "d": "unrelated C"},
            "correct_answer": "a",
            "explanation": f"The core principle is fundamental to understanding {topic}.",
            "hints": ["Think about the definition."],
            "confidence_weight": 0.9
        }
    
    def _get_sample_matching(self, topic: str, difficulty: str = "medium") -> Dict:
        return {
            "type": "matching",
            "question": f"Match the {topic} concepts with their descriptions",
            "column_a": [f"{topic} concept 1", f"{topic} concept 2", f"{topic} concept 3", f"{topic} concept 4"],
            "column_b": ["Description 1", "Description 2", "Description 3", "Description 4"],
            "correct_matches": {"0": 0, "1": 1, "2": 2, "3": 3},
            "explanation": "Each concept matches its corresponding description.",
            "hints": ["Start with the concepts you know best."],
            "confidence_weight": 1.1
        }
    
    def _get_sample_ordering(self, topic: str, difficulty: str = "medium") -> Dict:
        items = [f"Step 1 of {topic}", f"Step 2 of {topic}", f"Step 3 of {topic}", f"Step 4 of {topic}"]
        shuffled = items.copy()
        random.shuffle(shuffled)
        return {
            "type": "ordering",
            "question": f"Arrange these {topic} steps in the correct order",
            "items": shuffled,
            "original_items": items,
            "correct_order": [0, 1, 2, 3],
            "order_type": "procedural",
            "explanation": "The correct order follows the standard procedure.",
            "hints": ["Think about what comes first logically."],
            "confidence_weight": 1.0
        }
    
    def _get_sample_code_completion(self, topic: str, difficulty: str = "medium") -> Dict:
        return {
            "type": "code_completion",
            "question": "Complete the following code snippet:",
            "code_before": f"# {topic} example\ndef process_data(data):\n    ",
            "blank_description": "Add code to process the data",
            "code_after": "\n    return result",
            "correct_answer": "result = data * 2",
            "language": "python",
            "explanation": "The code processes the data by doubling it.",
            "hints": ["Think about the expected output.", "Use basic operations."],
            "requires_manual_grading": True,
            "confidence_weight": 1.3
        }
    
    def _get_type_distribution(self, questions: List[Dict]) -> Dict:
        """Get distribution of question types"""
        distribution = {}
        for q in questions:
            qtype = q.get("type", "unknown")
            distribution[qtype] = distribution.get(qtype, 0) + 1
        return distribution
    
    def _get_difficulty_distribution(self, questions: List[Dict]) -> Dict:
        """Get distribution of difficulty levels"""
        distribution = {}
        for q in questions:
            diff = q.get("difficulty", "medium")
            distribution[diff] = distribution.get(diff, 0) + 1
        return distribution
    
    def _generate_difficulty_curve(self, questions: List[Dict]) -> List[Dict]:
        """Generate difficulty progression visualization data"""
        curve = []
        difficulty_values = {"beginner": 1, "easy": 2, "medium": 3, "hard": 4, "expert": 5}
        
        for i, question in enumerate(questions):
            progress = (i + 1) / len(questions) if questions else 0
            difficulty = question.get("difficulty", "medium")
            
            curve.append({
                "question_number": i + 1,
                "difficulty": difficulty,
                "difficulty_value": difficulty_values.get(difficulty, 3),
                "progress": round(progress * 100, 1),
                "question_type": question.get("type", "unknown"),
                "points": question.get("points", 0)
            })
        
        return curve
    
    async def evaluate_answer(
        self,
        question: Dict,
        user_answer: str,
        time_taken_seconds: Optional[int] = None
    ) -> Dict:
        """Evaluate a user's answer and provide feedback"""
        question_type = question.get("type", "multiple_choice")
        correct_answer = question.get("correct_answer", "")
        
        is_correct = False
        partial_credit = 0.0
        feedback = ""
        
        if question_type in ["multiple_choice", "true_false", "fill_in_blank"]:
            is_correct = user_answer.lower().strip() == correct_answer.lower().strip()
            feedback = question.get("explanation", "") if is_correct else f"The correct answer was: {correct_answer}"
            partial_credit = 1.0 if is_correct else 0.0
            
        elif question_type == "matching":
            correct_matches = question.get("correct_matches", {})
            try:
                user_matches = eval(user_answer) if isinstance(user_answer, str) else user_answer
                correct_count = sum(1 for k, v in correct_matches.items() if user_matches.get(k) == v)
                total = len(correct_matches)
                partial_credit = correct_count / total if total > 0 else 0
                is_correct = partial_credit == 1.0
                feedback = f"You matched {correct_count} out of {total} correctly."
            except:
                partial_credit = 0.0
                feedback = "Could not evaluate matching answer."
                
        elif question_type == "ordering":
            correct_order = question.get("correct_order", [])
            try:
                user_order = eval(user_answer) if isinstance(user_answer, str) else user_answer
                correct_positions = sum(1 for i, v in enumerate(user_order) if v == correct_order[i])
                total = len(correct_order)
                partial_credit = correct_positions / total if total > 0 else 0
                is_correct = partial_credit == 1.0
                feedback = f"You placed {correct_positions} out of {total} items correctly."
            except:
                partial_credit = 0.0
                feedback = "Could not evaluate ordering answer."
                
        elif question_type in ["short_answer", "code_completion"]:
            # Basic keyword matching for automated partial grading
            key_points = question.get("key_points", [])
            model_answer = question.get("model_answer", question.get("correct_answer", ""))
            
            user_lower = user_answer.lower()
            model_lower = model_answer.lower()
            
            # Check for key concepts
            matches = sum(1 for kp in key_points if kp.lower() in user_lower)
            partial_credit = min(1.0, matches / len(key_points)) if key_points else 0.5
            is_correct = partial_credit >= 0.7
            feedback = f"Matched {matches}/{len(key_points)} key points. Review recommended."
        
        # Calculate points earned
        max_points = question.get("points", 10)
        points_earned = int(max_points * partial_credit)
        
        # Time bonus/penalty (optional)
        time_bonus = 0
        if time_taken_seconds and question.get("time_estimate"):
            expected_time = question["time_estimate"]
            if time_taken_seconds < expected_time * 0.5 and is_correct:
                time_bonus = int(max_points * 0.1)  # 10% bonus for fast correct answers
        
        return {
            "is_correct": is_correct,
            "partial_credit": round(partial_credit, 2),
            "points_earned": points_earned + time_bonus,
            "max_points": max_points,
            "time_bonus": time_bonus,
            "feedback": feedback,
            "explanation": question.get("explanation", ""),
            "correct_answer": correct_answer,
            "hints_available": len(question.get("hints", [])),
            "review_recommended": not is_correct or partial_credit < 0.8
        }
    
    async def get_quiz_summary(self, quiz_results: List[Dict]) -> Dict:
        """Generate summary statistics for a completed quiz"""
        total_questions = len(quiz_results)
        correct_count = sum(1 for r in quiz_results if r.get("is_correct"))
        total_points = sum(r.get("points_earned", 0) for r in quiz_results)
        max_points = sum(r.get("max_points", 0) for r in quiz_results)
        
        # Group by question type
        by_type = defaultdict(lambda: {"correct": 0, "total": 0})
        for r in quiz_results:
            qtype = r.get("question_type", "unknown")
            by_type[qtype]["total"] += 1
            if r.get("is_correct"):
                by_type[qtype]["correct"] += 1
        
        # Identify weak areas
        weak_areas = []
        for qtype, stats in by_type.items():
            if stats["total"] > 0:
                accuracy = stats["correct"] / stats["total"]
                if accuracy < 0.6:
                    weak_areas.append({
                        "type": qtype,
                        "accuracy": round(accuracy * 100, 1),
                        "recommendation": f"Practice more {qtype.replace('_', ' ')} questions"
                    })
        
        return {
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "accuracy_percentage": round((correct_count / total_questions) * 100, 1) if total_questions > 0 else 0,
            "total_points": total_points,
            "max_points": max_points,
            "score_percentage": round((total_points / max_points) * 100, 1) if max_points > 0 else 0,
            "performance_by_type": dict(by_type),
            "weak_areas": weak_areas,
            "grade": self._calculate_grade(total_points, max_points),
            "passed": (total_points / max_points) >= 0.7 if max_points > 0 else False,
            "recommendations": self._generate_study_recommendations(weak_areas, quiz_results)
        }
    
    def _calculate_grade(self, points: int, max_points: int) -> str:
        """Calculate letter grade"""
        if max_points == 0:
            return "N/A"
        percentage = (points / max_points) * 100
        if percentage >= 90:
            return "A"
        elif percentage >= 80:
            return "B"
        elif percentage >= 70:
            return "C"
        elif percentage >= 60:
            return "D"
        else:
            return "F"
    
    def _generate_study_recommendations(
        self, weak_areas: List[Dict], results: List[Dict]
    ) -> List[str]:
        """Generate personalized study recommendations"""
        recommendations = []
        
        if weak_areas:
            for area in weak_areas[:3]:
                recommendations.append(area["recommendation"])
        
        # Check for concepts that need review
        concepts_to_review = set()
        for r in results:
            if not r.get("is_correct"):
                concepts_to_review.update(r.get("concepts", []))
        
        if concepts_to_review:
            recommendations.append(f"Review these concepts: {', '.join(list(concepts_to_review)[:5])}")
        
        if not recommendations:
            recommendations.append("Great job! Continue practicing to maintain your knowledge.")
        
        return recommendations


# Singleton instance
advanced_quiz_generator = AdvancedQuizGenerator()
