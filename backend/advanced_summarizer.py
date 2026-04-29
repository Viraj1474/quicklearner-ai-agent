"""
Advanced Text Summarizer - Multiple summarization styles and metrics

Features:
- Multiple styles: Extractive, Abstractive, Bullet Points, Outline, Cornell Notes, ELI5, Academic
- Custom length control with precise ratio targeting
- Advanced keyword extraction using TF-IDF-like scoring
- Comprehensive readability metrics (Flesch-Kincaid, word complexity)
- Hierarchical outline generation
- Key takeaways extraction
- Topic identification
- Source/citation preservation
- Comparison statistics

Author: AI Study Assistant
"""

import logging
import re
import math
from typing import List, Dict, Optional, Tuple
from enum import Enum
from collections import Counter

logger = logging.getLogger(__name__)


class SummaryStyle(Enum):
    """Available summarization styles"""
    EXTRACTIVE = "extractive"        # Key sentences from original
    ABSTRACTIVE = "abstractive"      # AI-paraphrased summary
    BULLET_POINTS = "bullet_points"  # Bullet-point format
    OUTLINE = "outline"              # Hierarchical outline
    CORNELL = "cornell"              # Cornell notes format
    ELI5 = "eli5"                    # Explain Like I'm 5
    ACADEMIC = "academic"            # Formal academic style
    KEY_TAKEAWAYS = "key_takeaways"  # Main takeaways only


class SummaryLength(Enum):
    """Summary length control with ratios"""
    BRIEF = 0.15      # 15% of original - very concise
    SHORT = 0.25      # 25% of original
    MEDIUM = 0.40     # 40% of original  
    LONG = 0.60       # 60% of original
    DETAILED = 0.75   # 75% of original - comprehensive


class AdvancedSummarizer:
    """Advanced text summarization with multiple styles and analysis"""
    
    def __init__(self):
        self.min_sentence_length = 8   # Minimum words per sentence
        self.max_sentence_length = 50  # Maximum words for single point
        
        # Common stopwords for keyword extraction
        self.stopwords = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
            'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
            'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
            'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
            'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
            'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
            'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there'
        }
        
        # Importance signal words
        self.importance_signals = {
            'high': ['crucial', 'essential', 'critical', 'important', 'key', 'main', 
                     'primary', 'fundamental', 'significant', 'vital', 'major'],
            'medium': ['notable', 'relevant', 'useful', 'related', 'associated'],
            'transition': ['however', 'therefore', 'consequently', 'furthermore', 
                          'moreover', 'additionally', 'in conclusion', 'finally']
        }
    
    async def summarize_advanced(
        self,
        text: str,
        style: str = "abstractive",
        length: str = "medium",
        with_keywords: bool = True,
        with_outline: bool = False,
        with_takeaways: bool = True,
        preserve_citations: bool = False,
        target_audience: str = "general"
    ) -> Dict:
        """
        Advanced summarization with multiple styles and comprehensive analysis
        
        Args:
            text: Text to summarize
            style: Summary style (extractive, abstractive, bullet_points, outline, cornell, eli5, academic, key_takeaways)
            length: Target length (brief, short, medium, long, detailed)
            with_keywords: Extract and rank keywords
            with_outline: Generate hierarchical outline
            with_takeaways: Extract key takeaways
            preserve_citations: Keep citation references
            target_audience: Audience level (general, academic, technical, beginner)
            
        Returns:
            Dictionary with summary, analysis, and metadata
        """
        try:
            # Parse and validate style
            try:
                summary_style = SummaryStyle(style.lower())
            except ValueError:
                summary_style = SummaryStyle.ABSTRACTIVE
            
            # Parse length
            try:
                length_ratio = SummaryLength[length.upper()].value
            except KeyError:
                length_ratio = SummaryLength.MEDIUM.value
            
            # Pre-process text
            cleaned_text = self._preprocess_text(text)
            sentences = self._extract_sentences(cleaned_text)
            
            # Extract citations if needed
            citations = self._extract_citations(text) if preserve_citations else []
            
            # Calculate sentence scores for extractive methods
            sentence_scores = self._score_sentences(sentences, cleaned_text)
            
            # Generate summary based on style
            if summary_style == SummaryStyle.EXTRACTIVE:
                summary = self._extractive_summary(sentences, sentence_scores, length_ratio)
            elif summary_style == SummaryStyle.BULLET_POINTS:
                summary = self._bullet_point_summary(sentences, sentence_scores, length_ratio)
            elif summary_style == SummaryStyle.OUTLINE:
                summary = self._outline_summary(text, sentences, sentence_scores)
            elif summary_style == SummaryStyle.CORNELL:
                summary = self._cornell_notes_summary(sentences, sentence_scores, length_ratio)
            elif summary_style == SummaryStyle.ELI5:
                summary = await self._eli5_summary(text, length_ratio)
            elif summary_style == SummaryStyle.ACADEMIC:
                summary = await self._academic_summary(text, length_ratio)
            elif summary_style == SummaryStyle.KEY_TAKEAWAYS:
                summary = self._key_takeaways_summary(sentences, sentence_scores)
            else:  # ABSTRACTIVE
                summary = await self._abstractive_summary(text, length_ratio, target_audience)
            
            # Extract keywords with TF-IDF-like scoring
            keywords = self._extract_keywords_advanced(cleaned_text, sentences) if with_keywords else []
            
            # Generate structural outline
            outline = self._generate_outline_advanced(text, sentences) if with_outline else None
            
            # Extract key takeaways
            takeaways = self._extract_takeaways(sentences, sentence_scores) if with_takeaways else []
            
            # Identify main topics
            topics = self._identify_topics(cleaned_text, keywords)
            
            # Calculate comprehensive metrics
            readability = self._calculate_readability_advanced(summary)
            original_readability = self._calculate_readability_advanced(text)
            
            # Compression statistics
            original_words = len(text.split())
            summary_words = len(summary.split())
            
            result = {
                "summary": summary,
                "style": style,
                "length": length,
                "word_count": summary_words,
                "original_word_count": original_words,
                "compression_ratio": round(summary_words / original_words, 3) if original_words > 0 else 0,
                "reduction_percent": round((1 - summary_words / original_words) * 100, 1) if original_words > 0 else 0,
                "keywords": keywords,
                "topics": topics,
                "takeaways": takeaways,
                "outline": outline,
                "citations": citations if preserve_citations else None,
                "readability": readability,
                "original_readability": original_readability,
                "sentence_count": {
                    "original": len(sentences),
                    "summary": len([s for s in summary.split('.') if s.strip()])
                },
                "quality_score": self._calculate_quality_score(summary, text, keywords)
            }
            
            logger.info(f"✓ Advanced summarization complete ({style}, {length}): {summary_words}/{original_words} words")
            return result
            
        except Exception as e:
            logger.error(f"Error in advanced summarization: {e}", exc_info=True)
            return {
                "summary": text[:500] + "..." if len(text) > 500 else text,
                "style": style,
                "length": length,
                "error": str(e),
                "keywords": [],
                "topics": [],
                "takeaways": [],
                "outline": None,
                "word_count": len(text.split()),
                "original_word_count": len(text.split()),
                "compression_ratio": 1.0
            }
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and normalize text for processing"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?;:\'\"-]', '', text)
        return text.strip()
    
    def _extract_sentences(self, text: str) -> List[str]:
        """Extract sentences with proper handling of abbreviations"""
        # Handle common abbreviations
        abbreviations = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'etc.', 'e.g.', 'i.e.', 'vs.', 'Fig.']
        temp_text = text
        for abbr in abbreviations:
            temp_text = temp_text.replace(abbr, abbr.replace('.', '<DOT>'))
        
        # Split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', temp_text)
        
        # Restore abbreviations and clean
        sentences = [s.replace('<DOT>', '.').strip() for s in sentences]
        sentences = [s for s in sentences if len(s.split()) >= self.min_sentence_length]
        
        return sentences
    
    def _extract_citations(self, text: str) -> List[Dict]:
        """Extract citation references from text"""
        citations = []
        
        # Academic citations: (Author, Year) or [1], [2]
        academic_pattern = r'\(([A-Z][a-z]+(?:\s+(?:et\s+al\.?|&)\s*)?(?:,?\s*\d{4}))\)'
        numeric_pattern = r'\[(\d+)\]'
        
        for match in re.finditer(academic_pattern, text):
            citations.append({"type": "academic", "reference": match.group(1), "position": match.start()})
        
        for match in re.finditer(numeric_pattern, text):
            citations.append({"type": "numeric", "reference": match.group(1), "position": match.start()})
        
        return citations
    
    def _score_sentences(self, sentences: List[str], full_text: str) -> Dict[int, float]:
        """Score sentences using multiple factors"""
        if not sentences:
            return {}
        
        # Build word frequency map
        words = re.findall(r'\b\w+\b', full_text.lower())
        word_freq = Counter(words)
        max_freq = max(word_freq.values()) if word_freq else 1
        
        scores = {}
        total_sentences = len(sentences)
        
        for i, sentence in enumerate(sentences):
            score = 0.0
            words_in_sentence = re.findall(r'\b\w+\b', sentence.lower())
            
            if not words_in_sentence:
                scores[i] = 0
                continue
            
            # 1. Word frequency score (TF component)
            freq_score = sum(word_freq.get(w, 0) / max_freq for w in words_in_sentence 
                           if w not in self.stopwords) / len(words_in_sentence)
            score += freq_score * 0.3
            
            # 2. Position score (first and last sentences more important)
            position = i / total_sentences
            if position < 0.2:  # First 20%
                score += 0.25
            elif position > 0.85:  # Last 15%
                score += 0.15
            
            # 3. Sentence length score (prefer medium length)
            word_count = len(words_in_sentence)
            if 15 <= word_count <= 30:
                score += 0.2
            elif 10 <= word_count <= 40:
                score += 0.1
            
            # 4. Importance signal words
            sentence_lower = sentence.lower()
            for word in self.importance_signals['high']:
                if word in sentence_lower:
                    score += 0.15
                    break
            
            for word in self.importance_signals['transition']:
                if word in sentence_lower:
                    score += 0.1
                    break
            
            # 5. Contains proper nouns (likely important entities)
            proper_nouns = len([w for w in sentence.split() if w[0].isupper() and w.lower() not in self.stopwords])
            score += min(proper_nouns * 0.03, 0.15)
            
            # 6. Contains numbers/data
            if re.search(r'\d+%|\$\d+|\d+\.\d+', sentence):
                score += 0.1
            
            scores[i] = round(min(score, 1.0), 3)
        
        return scores
    
    def _extractive_summary(self, sentences: List[str], scores: Dict[int, float], ratio: float) -> str:
        """Extract key sentences from text based on scores"""
        if not sentences:
            return ""
        
        # Calculate number of sentences to extract
        num_sentences = max(1, int(len(sentences) * ratio))
        
        # Get top scoring sentence indices
        top_indices = sorted(scores.keys(), key=lambda x: scores.get(x, 0), reverse=True)[:num_sentences]
        
        # Return in original order for coherence
        top_indices.sort()
        selected = [sentences[i] for i in top_indices if i < len(sentences)]
        
        return ' '.join(selected)
    
    def _bullet_point_summary(self, sentences: List[str], scores: Dict[int, float], ratio: float) -> str:
        """Create bullet-point summary with ranked points"""
        if not sentences:
            return "• No content to summarize"
        
        num_points = max(3, int(len(sentences) * ratio))
        
        # Get top scoring sentences
        top_indices = sorted(scores.keys(), key=lambda x: scores.get(x, 0), reverse=True)[:num_points]
        top_indices.sort()  # Maintain order
        
        bullet_points = []
        for idx in top_indices:
            if idx < len(sentences):
                sentence = sentences[idx].strip()
                # Clean up sentence for bullet point
                if not sentence.endswith(('.', '!', '?')):
                    sentence += '.'
                bullet_points.append(f"• {sentence}")
        
        return '\n'.join(bullet_points)
    
    def _outline_summary(self, text: str, sentences: List[str], scores: Dict[int, float]) -> str:
        """Generate hierarchical outline summary"""
        if not sentences:
            return "I. No content to summarize"
        
        outline_parts = []
        
        # Split into sections (by paragraphs or double newlines)
        paragraphs = text.split('\n\n')
        if len(paragraphs) < 2:
            paragraphs = text.split('\n')
        
        section_num = 1
        for para in paragraphs[:7]:  # Max 7 sections
            para = para.strip()
            if len(para) < 30:
                continue
            
            # First sentence as section header
            para_sentences = self._extract_sentences(para)
            if not para_sentences:
                continue
            
            # Main heading
            main_point = para_sentences[0][:80]
            if len(para_sentences[0]) > 80:
                main_point += "..."
            
            outline_parts.append(f"{self._roman_numeral(section_num)}. {main_point}")
            
            # Sub-points from remaining sentences
            for j, sent in enumerate(para_sentences[1:4], 1):  # Max 3 sub-points
                sub_point = sent[:60]
                if len(sent) > 60:
                    sub_point += "..."
                outline_parts.append(f"   {chr(96+j)}. {sub_point}")
            
            section_num += 1
        
        return '\n'.join(outline_parts) if outline_parts else "I. Unable to generate outline"
    
    def _roman_numeral(self, num: int) -> str:
        """Convert number to roman numeral"""
        numerals = [(10, 'X'), (9, 'IX'), (5, 'V'), (4, 'IV'), (1, 'I')]
        result = ''
        for value, numeral in numerals:
            while num >= value:
                result += numeral
                num -= value
        return result
    
    def _cornell_notes_summary(self, sentences: List[str], scores: Dict[int, float], ratio: float) -> str:
        """Generate Cornell Notes format summary"""
        if not sentences:
            return "CORNELL NOTES\n============\n\nNo content to summarize"
        
        num_points = max(3, int(len(sentences) * ratio))
        top_indices = sorted(scores.keys(), key=lambda x: scores.get(x, 0), reverse=True)[:num_points]
        
        # Build Cornell format
        lines = ["CORNELL NOTES", "=" * 50, ""]
        
        # Main Notes Section
        lines.append("📝 MAIN NOTES:")
        lines.append("-" * 30)
        for idx in sorted(top_indices)[:5]:
            if idx < len(sentences):
                lines.append(f"  • {sentences[idx]}")
        lines.append("")
        
        # Cue Column (questions/keywords)
        lines.append("❓ CUE QUESTIONS:")
        lines.append("-" * 30)
        questions = self._generate_cue_questions(sentences, top_indices[:3])
        for q in questions:
            lines.append(f"  • {q}")
        lines.append("")
        
        # Summary Section
        lines.append("📋 SUMMARY:")
        lines.append("-" * 30)
        summary_sentences = [sentences[i] for i in sorted(top_indices)[:2] if i < len(sentences)]
        lines.append(f"  {' '.join(summary_sentences)}")
        
        return '\n'.join(lines)
    
    def _generate_cue_questions(self, sentences: List[str], top_indices: List[int]) -> List[str]:
        """Generate study questions from key sentences"""
        questions = []
        question_starters = ["What is", "Why does", "How does", "What are the main"]
        
        for idx in top_indices[:3]:
            if idx < len(sentences):
                sent = sentences[idx]
                # Extract key noun phrases and form questions
                words = sent.split()[:5]
                subject = ' '.join(words)
                questions.append(f"{question_starters[len(questions) % 4]} {subject.lower()}...?")
        
        return questions if questions else ["What is the main topic?", "What are the key points?"]
    
    async def _eli5_summary(self, text: str, ratio: float) -> str:
        """Generate ELI5 (Explain Like I'm 5) summary"""
        from ai_wrapper import ai_wrapper
        
        try:
            target_sentences = max(2, int(len(text.split()) / 50 * ratio))
            
            prompt = f"""Explain the following text in very simple terms that a 5-year-old could understand.
Use simple words, short sentences, and maybe a fun comparison or example.
Keep it to about {target_sentences} simple sentences.

Text:
{text[:3000]}

Simple explanation:"""
            
            result = await ai_wrapper.generate_text(prompt, max_tokens=300)
            return result.strip()
            
        except Exception as e:
            logger.error(f"ELI5 summary error: {e}")
            # Fallback to simple extractive
            sentences = self._extract_sentences(text)
            scores = self._score_sentences(sentences, text)
            return "Here's the simple version: " + self._extractive_summary(sentences, scores, ratio * 0.5)
    
    async def _academic_summary(self, text: str, ratio: float) -> str:
        """Generate formal academic-style summary"""
        from ai_wrapper import ai_wrapper
        
        try:
            word_target = max(50, int(len(text.split()) * ratio))
            
            prompt = f"""Write a formal academic summary of the following text.
Use scholarly language, passive voice where appropriate, and maintain objectivity.
Target approximately {word_target} words.

Text:
{text[:4000]}

Academic Summary:"""
            
            result = await ai_wrapper.generate_text(prompt, max_tokens=word_target + 100)
            return result.strip()
            
        except Exception as e:
            logger.error(f"Academic summary error: {e}")
            sentences = self._extract_sentences(text)
            scores = self._score_sentences(sentences, text)
            return self._extractive_summary(sentences, scores, ratio)
    
    def _key_takeaways_summary(self, sentences: List[str], scores: Dict[int, float]) -> str:
        """Extract only the key takeaways"""
        if not sentences:
            return "No key takeaways identified."
        
        # Get top 5 most important sentences
        top_indices = sorted(scores.keys(), key=lambda x: scores.get(x, 0), reverse=True)[:5]
        
        lines = ["🔑 KEY TAKEAWAYS:", ""]
        for i, idx in enumerate(sorted(top_indices), 1):
            if idx < len(sentences):
                lines.append(f"{i}. {sentences[idx]}")
        
        return '\n'.join(lines)
    
    async def _abstractive_summary(self, text: str, ratio: float, audience: str = "general") -> str:
        """Generate abstractive summary using AI"""
        from ai_wrapper import ai_wrapper
        
        try:
            word_target = max(30, int(len(text.split()) * ratio))
            
            audience_instructions = {
                "general": "Use clear, accessible language for a general audience.",
                "academic": "Use formal, scholarly language with precise terminology.",
                "technical": "Maintain technical accuracy and domain-specific terms.",
                "beginner": "Use simple language and explain any complex concepts."
            }
            
            instruction = audience_instructions.get(audience, audience_instructions["general"])
            
            prompt = f"""Create a coherent, well-written summary of the following text.
{instruction}
Target approximately {word_target} words.
Focus on the main ideas, key arguments, and important conclusions.

Text:
{text[:4000]}

Summary:"""
            
            summary = await ai_wrapper.generate_text(prompt, max_tokens=word_target + 100)
            return summary.strip()
            
        except Exception as e:
            logger.error(f"Error in abstractive summary: {e}")
            # Fallback to extractive
            sentences = self._extract_sentences(text)
            scores = self._score_sentences(sentences, text)
            return self._extractive_summary(sentences, scores, ratio)
    
    def _extract_keywords_advanced(self, text: str, sentences: List[str]) -> List[Dict]:
        """Extract keywords with TF-IDF-like scoring and ranking"""
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Calculate term frequency
        word_count = Counter(words)
        total_words = len(words)
        
        # Filter and score keywords
        keywords = []
        seen = set()
        
        for word, count in word_count.most_common(50):
            if word in self.stopwords or word in seen:
                continue
            
            # TF score
            tf = count / total_words
            
            # Simple IDF approximation (words that appear in fewer sentences are more important)
            sentences_with_word = sum(1 for s in sentences if word in s.lower())
            idf = math.log((len(sentences) + 1) / (sentences_with_word + 1))
            
            # Combined score
            score = tf * idf * 100
            
            # Boost for capitalized words (likely proper nouns)
            original_forms = [w for w in text.split() if w.lower() == word]
            if any(w[0].isupper() for w in original_forms if w):
                score *= 1.3
            
            if score > 0.1:  # Threshold
                keywords.append({
                    "word": word,
                    "score": round(score, 2),
                    "frequency": count,
                    "importance": "high" if score > 1.0 else "medium" if score > 0.5 else "low"
                })
                seen.add(word)
        
        # Sort by score and return top keywords
        keywords.sort(key=lambda x: x["score"], reverse=True)
        return keywords[:15]
    
    def _identify_topics(self, text: str, keywords: List[Dict]) -> List[str]:
        """Identify main topics from text and keywords"""
        topics = []
        
        # Use top keywords as topic indicators
        for kw in keywords[:5]:
            topics.append(kw["word"].title())
        
        # Look for topic patterns
        topic_patterns = [
            r'(?:topic|subject|about|discusses?|covers?)\s+(?:of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|are|refers)',
        ]
        
        for pattern in topic_patterns:
            matches = re.findall(pattern, text[:1000])
            for match in matches[:2]:
                if match and match not in topics:
                    topics.append(match)
        
        return topics[:5]
    
    def _extract_takeaways(self, sentences: List[str], scores: Dict[int, float]) -> List[Dict]:
        """Extract key takeaways with context"""
        if not sentences:
            return []
        
        takeaways = []
        top_indices = sorted(scores.keys(), key=lambda x: scores.get(x, 0), reverse=True)[:5]
        
        for rank, idx in enumerate(top_indices, 1):
            if idx < len(sentences):
                takeaways.append({
                    "rank": rank,
                    "text": sentences[idx],
                    "importance_score": scores.get(idx, 0),
                    "word_count": len(sentences[idx].split())
                })
        
        return takeaways
    
    def _generate_outline_advanced(self, text: str, sentences: List[str]) -> List[Dict]:
        """Generate structured outline with sections"""
        sections = []
        
        # Split into paragraphs
        paragraphs = re.split(r'\n\n+', text)
        if len(paragraphs) < 2:
            paragraphs = re.split(r'\n', text)
        
        for i, para in enumerate(paragraphs[:8], 1):
            para = para.strip()
            if len(para) < 40:
                continue
            
            para_sentences = self._extract_sentences(para)
            if not para_sentences:
                continue
            
            # First sentence as title
            title = para_sentences[0]
            if len(title) > 80:
                title = title[:77] + "..."
            
            # Extract key points
            key_points = []
            for sent in para_sentences[1:4]:
                point = sent if len(sent) <= 100 else sent[:97] + "..."
                key_points.append(point)
            
            sections.append({
                "section": i,
                "title": title,
                "key_points": key_points,
                "word_count": len(para.split())
            })
        
        return sections
    
    def _calculate_readability_advanced(self, text: str) -> Dict:
        """Calculate comprehensive readability metrics"""
        if not text or not text.strip():
            return {
                "flesch_score": 0,
                "grade_level": "N/A",
                "reading_time_minutes": 0,
                "avg_words_per_sentence": 0,
                "avg_syllables_per_word": 0,
                "complex_word_percentage": 0,
                "difficulty": "unknown"
            }
        
        words = text.split()
        sentences = [s for s in re.split(r'[.!?]+', text) if s.strip()]
        
        if not words or not sentences:
            return self._empty_readability()
        
        # Count syllables
        def count_syllables(word):
            word = word.lower().strip('.,!?;:')
            if not word:
                return 1
            vowels = "aeiouy"
            count = 0
            prev_vowel = False
            for char in word:
                is_vowel = char in vowels
                if is_vowel and not prev_vowel:
                    count += 1
                prev_vowel = is_vowel
            # Handle silent e
            if word.endswith('e') and count > 1:
                count -= 1
            return max(1, count)
        
        total_syllables = sum(count_syllables(w) for w in words)
        avg_syllables = total_syllables / len(words)
        avg_words_per_sentence = len(words) / len(sentences)
        
        # Flesch Reading Ease
        flesch = 206.835 - 1.015 * avg_words_per_sentence - 84.6 * avg_syllables
        flesch = max(0, min(100, flesch))
        
        # Flesch-Kincaid Grade Level
        grade = 0.39 * avg_words_per_sentence + 11.8 * avg_syllables - 15.59
        grade = max(1, min(18, grade))
        
        # Complex words (3+ syllables)
        complex_words = sum(1 for w in words if count_syllables(w) >= 3)
        complex_percentage = (complex_words / len(words)) * 100
        
        # Determine difficulty level
        if flesch >= 80:
            difficulty = "very_easy"
        elif flesch >= 60:
            difficulty = "easy"
        elif flesch >= 40:
            difficulty = "moderate"
        elif flesch >= 20:
            difficulty = "difficult"
        else:
            difficulty = "very_difficult"
        
        # Reading time (average 200 words per minute)
        reading_time = len(words) / 200
        
        return {
            "flesch_score": round(flesch, 1),
            "grade_level": f"Grade {round(grade)}",
            "reading_time_minutes": round(reading_time, 1),
            "avg_words_per_sentence": round(avg_words_per_sentence, 1),
            "avg_syllables_per_word": round(avg_syllables, 2),
            "complex_word_percentage": round(complex_percentage, 1),
            "difficulty": difficulty,
            "total_words": len(words),
            "total_sentences": len(sentences)
        }
    
    def _empty_readability(self) -> Dict:
        """Return empty readability metrics"""
        return {
            "flesch_score": 0, "grade_level": "N/A", "reading_time_minutes": 0,
            "avg_words_per_sentence": 0, "avg_syllables_per_word": 0,
            "complex_word_percentage": 0, "difficulty": "unknown"
        }
    
    def _calculate_quality_score(self, summary: str, original: str, keywords: List[Dict]) -> Dict:
        """Calculate summary quality metrics"""
        summary_words = set(summary.lower().split())
        original_words = set(original.lower().split())
        
        # Content coverage (how much of original content is represented)
        keyword_coverage = sum(1 for kw in keywords if kw["word"] in summary.lower()) / max(len(keywords), 1)
        
        # Vocabulary overlap
        vocab_overlap = len(summary_words & original_words) / max(len(summary_words), 1)
        
        # Length appropriateness (not too short, not too long)
        compression = len(summary.split()) / max(len(original.split()), 1)
        length_score = 1.0 - abs(compression - 0.3)  # Optimal around 30%
        length_score = max(0, length_score)
        
        # Overall quality
        overall = (keyword_coverage * 0.4 + vocab_overlap * 0.3 + length_score * 0.3) * 100
        
        return {
            "keyword_coverage": round(keyword_coverage * 100, 1),
            "content_retention": round(vocab_overlap * 100, 1),
            "length_appropriateness": round(length_score * 100, 1),
            "overall_score": round(overall, 1)
        }
    
    # Legacy methods for backward compatibility
    def _extract_keywords(self, text: str) -> List[str]:
        """Legacy keyword extraction (returns list of strings)"""
        keywords = self._extract_keywords_advanced(text, self._extract_sentences(text))
        return [kw["word"] for kw in keywords]
    
    def _generate_outline(self, text: str) -> List[Dict]:
        """Legacy outline generation"""
        sentences = self._extract_sentences(text)
        return self._generate_outline_advanced(text, sentences)
    
    def _calculate_readability(self, text: str) -> Dict:
        """Legacy readability calculation"""
        result = self._calculate_readability_advanced(text)
        return {
            "avg_words_per_sentence": result["avg_words_per_sentence"],
            "readability_level": result["difficulty"],
            "score": result["flesch_score"]
        }


# Singleton instance
advanced_summarizer = AdvancedSummarizer()
