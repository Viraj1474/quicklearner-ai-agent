"""
Advanced Note Highlighter - Enhanced highlighting with categories and confidence scoring

Features:
- Category-based highlighting (Concepts, Examples, Definitions, Formulas, Questions, Important)
- Confidence scoring for each highlight with multi-factor analysis
- Related concepts linking with semantic grouping
- Readability analysis (Flesch-Kincaid)
- Quick summaries with key takeaways
- Text position tracking for inline highlighting
- Export to multiple formats
- Duplicate/overlap detection

Author: AI Study Assistant
"""

import json
import logging
import re
from typing import List, Dict, Optional, Tuple
from config import settings

logger = logging.getLogger(__name__)


class AdvancedHighlighter:
    """Advanced note highlighting with categories and analysis"""
    
    def __init__(self):
        # Enhanced categories with more keywords and patterns
        self.categories = {
            "concepts": {
                "keywords": ["is", "defines", "refers to", "called", "represents", "consists of", "involves", "comprises"],
                "patterns": [r"\b\w+\s+is\s+a\s+\w+", r"the\s+concept\s+of", r"known\s+as"],
                "color": "#FF6B6B",
                "icon": "lightbulb",
                "priority": 3
            },
            "examples": {
                "keywords": ["for example", "such as", "e.g.", "like", "for instance", "including", "namely", "consider"],
                "patterns": [r"for\s+example[,:]", r"e\.g\.", r"such\s+as\s+\w+"],
                "color": "#4ECDC4",
                "icon": "puzzle",
                "priority": 2
            },
            "definitions": {
                "keywords": ["means", "defined as", "concept of", "definition", "refers to", "is the", "describes"],
                "patterns": [r"is\s+defined\s+as", r"the\s+definition\s+of", r"\w+\s+means\s+\w+"],
                "color": "#45B7D1",
                "icon": "book",
                "priority": 4
            },
            "formulas": {
                "keywords": ["=", "formula", "equation", "calculate", "computed", "equals", "sum", "product"],
                "patterns": [r"\w+\s*=\s*\w+", r"formula\s+is", r"equation\s+\d+"],
                "color": "#F7DC6F",
                "icon": "calculator",
                "priority": 5
            },
            "questions": {
                "keywords": ["why", "how", "what", "when", "where", "which", "who"],
                "patterns": [r"\?$", r"^(why|how|what|when|where|which|who)\s"],
                "color": "#9B59B6",
                "icon": "question",
                "priority": 1
            },
            "important": {
                "keywords": ["important", "crucial", "essential", "key", "critical", "significant", "note that", "remember"],
                "patterns": [r"important(ly)?[:\s]", r"note\s*:", r"remember\s+that"],
                "color": "#E74C3C",
                "icon": "alert",
                "priority": 6
            },
            "steps": {
                "keywords": ["first", "second", "third", "then", "next", "finally", "step", "procedure"],
                "patterns": [r"step\s+\d+", r"^\d+\.", r"first(ly)?[,:]"],
                "color": "#1ABC9C",
                "icon": "list",
                "priority": 2
            }
        }
        
        # Importance indicators
        self.importance_keywords = {
            "high": ["crucial", "essential", "critical", "must", "always", "never", "important", "key", "fundamental"],
            "medium": ["should", "recommended", "often", "typically", "generally", "usually"],
            "low": ["may", "can", "sometimes", "occasionally", "possibly", "might"]
        }
    
    async def highlight_advanced(
        self, 
        text: str, 
        categories: Optional[List[str]] = None,
        with_summary: bool = True,
        max_highlights: int = 25,
        min_confidence: float = 0.4
    ) -> Dict:
        """
        Advanced highlighting with categories and analysis
        
        Args:
            text: Text to analyze
            categories: Filter by categories (default: all)
            with_summary: Include generated summary
            max_highlights: Maximum number of highlights to return
            min_confidence: Minimum confidence threshold (0-1)
            
        Returns:
            Dictionary with categorized highlights, concepts, and analysis
        """
        try:
            if not categories:
                categories = list(self.categories.keys())
            
            # Extract highlights with position tracking
            highlights = self._extract_highlights_with_positions(text, categories, min_confidence)
            
            # Remove overlapping highlights (keep higher confidence)
            highlights = self._remove_overlapping_highlights(highlights)
            
            # Limit to max highlights
            highlights = highlights[:max_highlights]
            
            key_concepts = self._extract_concepts(text, highlights)
            related_concepts = self._find_related_concepts(key_concepts)
            readability = self._calculate_readability(text)
            
            # Calculate statistics
            stats = self._calculate_statistics(highlights, text)
            
            result = {
                "highlights": highlights,
                "key_concepts": key_concepts,
                "related_concepts": related_concepts,
                "summary": await self._generate_summary(text) if with_summary else None,
                "readability_score": readability["score"],
                "readability_level": readability["level"],
                "avg_sentence_length": readability.get("words_per_sentence", 0),
                "total_highlights": len(highlights),
                "by_category": self._group_by_category(highlights),
                "statistics": stats,
                "category_colors": {cat: info["color"] for cat, info in self.categories.items()}
            }
            
            logger.info(f"✓ Advanced highlighting complete: {len(highlights)} highlights found")
            return result
            
        except Exception as e:
            logger.error(f"Error in advanced highlighting: {e}")
            return {
                "highlights": [],
                "key_concepts": [],
                "related_concepts": [],
                "summary": None,
                "error": str(e)
            }
    
    def _extract_highlights_with_positions(
        self, 
        text: str, 
        categories: List[str],
        min_confidence: float
    ) -> List[Dict]:
        """Extract highlights with text positions for inline highlighting"""
        highlights = []
        
        # Split into sentences while tracking positions
        sentence_pattern = re.compile(r'([^.!?]+[.!?]+)')
        current_pos = 0
        
        for match in sentence_pattern.finditer(text):
            sentence = match.group(1).strip()
            start_pos = match.start()
            end_pos = match.end()
            
            if len(sentence) < 10:
                continue
            
            # Determine category and confidence
            category, match_details = self._classify_sentence_advanced(sentence, categories)
            
            if category:
                confidence = self._calculate_confidence_advanced(sentence, category, match_details)
                
                if confidence >= min_confidence:
                    importance = self._determine_importance(sentence, confidence)
                    
                    highlights.append({
                        "text": sentence,
                        "category": category,
                        "importance": importance,
                        "confidence": round(confidence, 2),
                        "start_pos": start_pos,
                        "end_pos": end_pos,
                        "word_count": len(sentence.split()),
                        "color": self.categories[category]["color"],
                        "icon": self.categories[category].get("icon", ""),
                        "matched_keywords": match_details.get("keywords", []),
                        "matched_patterns": match_details.get("patterns", [])
                    })
        
        # Sort by priority and confidence
        highlights.sort(key=lambda x: (
            -self.categories.get(x["category"], {}).get("priority", 0),
            -x["confidence"]
        ))
        
        return highlights
    
    def _classify_sentence_advanced(
        self, 
        sentence: str, 
        categories: List[str]
    ) -> Tuple[Optional[str], Dict]:
        """Classify sentence with detailed match info"""
        sentence_lower = sentence.lower()
        best_match = None
        best_score = 0
        match_details = {"keywords": [], "patterns": []}
        
        for category in categories:
            if category not in self.categories:
                continue
                
            cat_info = self.categories[category]
            score = 0
            current_details = {"keywords": [], "patterns": []}
            
            # Check keywords
            keywords = cat_info["keywords"]
            for kw in keywords:
                if kw.lower() in sentence_lower:
                    score += 1
                    current_details["keywords"].append(kw)
            
            # Check patterns
            patterns = cat_info.get("patterns", [])
            for pattern in patterns:
                if re.search(pattern, sentence_lower):
                    score += 2  # Patterns worth more
                    current_details["patterns"].append(pattern)
            
            # Add priority boost
            score += cat_info.get("priority", 0) * 0.1
            
            if score > best_score:
                best_score = score
                best_match = category
                match_details = current_details
        
        return best_match, match_details
    
    def _remove_overlapping_highlights(self, highlights: List[Dict]) -> List[Dict]:
        """Remove overlapping highlights, keeping highest confidence"""
        if not highlights:
            return []
        
        # Sort by start position
        sorted_highlights = sorted(highlights, key=lambda x: x["start_pos"])
        result = []
        
        for highlight in sorted_highlights:
            # Check if overlaps with any existing highlight
            overlaps = False
            for existing in result:
                if (highlight["start_pos"] < existing["end_pos"] and 
                    highlight["end_pos"] > existing["start_pos"]):
                    # Overlaps - keep higher confidence
                    if highlight["confidence"] > existing["confidence"]:
                        result.remove(existing)
                        result.append(highlight)
                    overlaps = True
                    break
            
            if not overlaps:
                result.append(highlight)
        
        # Re-sort by priority and confidence
        result.sort(key=lambda x: (
            -self.categories.get(x["category"], {}).get("priority", 0),
            -x["confidence"]
        ))
        
        return result
    
    def _calculate_statistics(self, highlights: List[Dict], text: str) -> Dict:
        """Calculate highlight statistics"""
        if not highlights:
            return {
                "total_words": len(text.split()),
                "highlighted_words": 0,
                "coverage_percent": 0,
                "avg_confidence": 0,
                "category_distribution": {},
                "importance_distribution": {"high": 0, "medium": 0, "low": 0}
            }
        
        total_words = len(text.split())
        highlighted_words = sum(h["word_count"] for h in highlights)
        
        # Category distribution
        cat_dist = {}
        for h in highlights:
            cat = h["category"]
            cat_dist[cat] = cat_dist.get(cat, 0) + 1
        
        # Importance distribution
        imp_dist = {"high": 0, "medium": 0, "low": 0}
        for h in highlights:
            imp_dist[h["importance"]] += 1
        
        return {
            "total_words": total_words,
            "highlighted_words": highlighted_words,
            "coverage_percent": round((highlighted_words / total_words) * 100, 1) if total_words > 0 else 0,
            "avg_confidence": round(sum(h["confidence"] for h in highlights) / len(highlights), 2),
            "category_distribution": cat_dist,
            "importance_distribution": imp_dist
        }
    
    def _calculate_confidence_advanced(
        self, 
        sentence: str, 
        category: str, 
        match_details: Dict
    ) -> float:
        """Calculate confidence score with multiple factors (0-1)"""
        sentence_lower = sentence.lower()
        
        # Base confidence from matches
        keyword_count = len(match_details.get("keywords", []))
        pattern_count = len(match_details.get("patterns", []))
        
        # Base score from matches (max 0.5)
        base_score = min((keyword_count * 0.1 + pattern_count * 0.15), 0.5)
        
        # Bonus factors
        bonus = 0.0
        
        # 1. Sentence length (optimal 15-25 words) - up to 0.15
        word_count = len(sentence.split())
        if 15 <= word_count <= 25:
            bonus += 0.15
        elif 10 <= word_count <= 30:
            bonus += 0.08
        
        # 2. Contains important keywords - up to 0.15
        for importance, keywords in self.importance_keywords.items():
            if any(kw in sentence_lower for kw in keywords):
                if importance == "high":
                    bonus += 0.15
                elif importance == "medium":
                    bonus += 0.08
                break
        
        # 3. Contains proper nouns (capitalized words) - up to 0.1
        capital_words = sum(1 for word in sentence.split() if word and word[0].isupper())
        if capital_words > 3:
            bonus += 0.1
        elif capital_words > 1:
            bonus += 0.05
        
        # 4. Contains numbers or data - up to 0.1
        if re.search(r'\d+%|\d+\.\d+|\$\d+|\d{4}', sentence):
            bonus += 0.1
        
        # 5. Sentence structure quality - up to 0.1
        if sentence.endswith('.') and sentence[0].isupper():
            bonus += 0.05
        if ':' in sentence or '—' in sentence:
            bonus += 0.05
        
        return min(base_score + bonus + 0.3, 1.0)  # Base 0.3, max 1.0
    
    def _extract_highlights(self, text: str, categories: List[str]) -> List[Dict]:
        """Extract highlights from text by category (legacy method)"""
        highlights = []
        sentences = text.split('.')
        
        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if not sentence or len(sentence) < 10:
                continue
            
            # Determine category
            category = self._classify_sentence(sentence, categories)
            if category:
                # Calculate confidence based on keyword presence
                confidence = self._calculate_confidence(sentence, category)
                
                highlights.append({
                    "text": sentence,
                    "category": category,
                    "importance": self._determine_importance(sentence, confidence),
                    "confidence": confidence,
                    "sentence_index": i,
                    "word_count": len(sentence.split())
                })
        
        # Sort by confidence
        highlights.sort(key=lambda x: x["confidence"], reverse=True)
        return highlights[:20]  # Top 20 highlights
    
    def _classify_sentence(self, sentence: str, categories: List[str]) -> Optional[str]:
        """Classify sentence into a category"""
        sentence_lower = sentence.lower()
        
        for category in categories:
            if category in self.categories:
                keywords = self.categories[category]["keywords"]
                if any(kw in sentence_lower for kw in keywords):
                    return category
        
        return None
    
    def _calculate_confidence(self, sentence: str, category: str) -> float:
        """Calculate confidence score (0-1) - legacy method"""
        sentence_lower = sentence.lower()
        
        # Base confidence
        confidence = 0.5
        
        # Increase if keywords present
        keywords = self.categories[category]["keywords"]
        matching_keywords = sum(1 for kw in keywords if kw in sentence_lower)
        confidence += (matching_keywords / len(keywords)) * 0.3
        
        # Increase based on sentence length (sweet spot: 10-30 words)
        word_count = len(sentence.split())
        if 10 <= word_count <= 30:
            confidence += 0.2
        
        # Increase if contains capital letters (proper nouns)
        if sum(1 for c in sentence if c.isupper()) > 2:
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _determine_importance(self, sentence: str, confidence: float) -> str:
        """Determine importance level"""
        if confidence >= 0.8:
            return "high"
        elif confidence >= 0.6:
            return "medium"
        else:
            return "low"
    
    def _extract_concepts(self, text: str, highlights: List[Dict]) -> List[str]:
        """Extract key concepts from text and highlights"""
        concepts = set()
        
        # From highlights
        for highlight in highlights[:10]:  # Top 10 highlights
            words = highlight["text"].split()
            # Extract capitalized words (likely proper nouns/concepts)
            for i, word in enumerate(words):
                clean_word = re.sub(r'[^\w]', '', word)
                if len(clean_word) > 3 and clean_word[0].isupper():
                    # Try to get multi-word concepts
                    if i + 1 < len(words):
                        next_word = re.sub(r'[^\w]', '', words[i + 1])
                        if next_word and next_word[0].isupper():
                            concepts.add(f"{clean_word} {next_word}")
                    concepts.add(clean_word)
        
        # Extract from definitions specifically
        for highlight in highlights:
            if highlight.get("category") == "definitions":
                # Try to extract the term being defined
                match = re.search(r'^(\w+(?:\s+\w+)?)\s+(?:is|means|refers)', highlight["text"])
                if match:
                    concepts.add(match.group(1))
        
        return sorted(list(concepts))[:15]  # Return top 15 concepts
    
    def _find_related_concepts(self, concepts: List[str]) -> List[Dict]:
        """Find related concepts with improved grouping"""
        if not concepts:
            return []
        
        related = []
        
        # Group concepts by common words
        word_groups = {}
        for concept in concepts:
            words = concept.lower().split()
            for word in words:
                if len(word) > 3:
                    if word not in word_groups:
                        word_groups[word] = []
                    word_groups[word].append(concept)
        
        # Create relationship entries
        for concept in concepts[:5]:  # Top 5 concepts
            related_to = []
            concept_words = set(concept.lower().split())
            
            for other in concepts:
                if other != concept:
                    other_words = set(other.lower().split())
                    common = concept_words & other_words
                    if common:
                        related_to.append(other)
            
            if related_to:
                related.append({
                    "concept": concept,
                    "related_to": related_to[:3],
                    "similarity": round(len(related_to) / len(concepts), 2)
                })
        
        return related
    
    def _calculate_readability(self, text: str) -> Dict:
        """Calculate Flesch-Kincaid reading level"""
        sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
        words = text.split()
        
        if not sentences or not words:
            return {"score": 0, "level": "unknown", "words_per_sentence": 0}
        
        # Calculate syllables (simplified)
        def count_syllables(word):
            word = word.lower()
            count = 0
            vowels = "aeiouy"
            prev_vowel = False
            for char in word:
                is_vowel = char in vowels
                if is_vowel and not prev_vowel:
                    count += 1
                prev_vowel = is_vowel
            return max(1, count)
        
        total_syllables = sum(count_syllables(w) for w in words)
        avg_words_per_sentence = len(words) / len(sentences)
        avg_syllables_per_word = total_syllables / len(words)
        
        # Flesch Reading Ease formula
        flesch_score = 206.835 - 1.015 * avg_words_per_sentence - 84.6 * avg_syllables_per_word
        flesch_score = max(0, min(100, flesch_score))
        
        # Determine level
        if flesch_score >= 80:
            level = "easy"
        elif flesch_score >= 60:
            level = "medium"
        elif flesch_score >= 40:
            level = "difficult"
        else:
            level = "very_difficult"
        
        return {
            "score": round(flesch_score),
            "level": level,
            "words_per_sentence": round(avg_words_per_sentence, 1),
            "syllables_per_word": round(avg_syllables_per_word, 2),
            "total_sentences": len(sentences),
            "total_words": len(words)
        }
    
    def _group_by_category(self, highlights: List[Dict]) -> Dict:
        """Group highlights by category with stats"""
        grouped = {}
        
        for highlight in highlights:
            category = highlight["category"]
            if category not in grouped:
                grouped[category] = {
                    "items": [],
                    "count": 0,
                    "color": self.categories.get(category, {}).get("color", "#888888"),
                    "avg_confidence": 0
                }
            grouped[category]["items"].append(highlight)
            grouped[category]["count"] += 1
        
        # Calculate average confidence per category
        for category, data in grouped.items():
            if data["items"]:
                data["avg_confidence"] = round(
                    sum(h["confidence"] for h in data["items"]) / len(data["items"]), 
                    2
                )
        
        return grouped
    
    async def _generate_summary(self, text: str) -> str:
        """Generate a quick summary"""
        from ai_wrapper import ai_wrapper
        
        try:
            summary = await ai_wrapper.summarize(text)
            return summary
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return None
    
    def export_highlights(
        self, 
        highlights: List[Dict], 
        format: str = "json",
        include_metadata: bool = True
    ) -> str:
        """
        Export highlights to various formats
        
        Args:
            highlights: List of highlight dictionaries
            format: Export format (json, markdown, html, text)
            include_metadata: Include confidence scores and categories
            
        Returns:
            Formatted string of highlights
        """
        if format == "json":
            return json.dumps(highlights, indent=2)
        
        elif format == "markdown":
            lines = ["# Highlighted Notes\n"]
            
            # Group by category
            by_category = {}
            for h in highlights:
                cat = h.get("category", "other")
                if cat not in by_category:
                    by_category[cat] = []
                by_category[cat].append(h)
            
            for category, items in by_category.items():
                lines.append(f"\n## {category.title()}\n")
                for item in items:
                    importance = item.get("importance", "medium")
                    marker = "🔴" if importance == "high" else "🟡" if importance == "medium" else "⚪"
                    lines.append(f"- {marker} {item['text']}")
                    if include_metadata:
                        lines.append(f"  - *Confidence: {item.get('confidence', 0):.0%}*\n")
            
            return "\n".join(lines)
        
        elif format == "html":
            html = ['<div class="highlights">']
            
            by_category = {}
            for h in highlights:
                cat = h.get("category", "other")
                if cat not in by_category:
                    by_category[cat] = []
                by_category[cat].append(h)
            
            for category, items in by_category.items():
                color = self.categories.get(category, {}).get("color", "#888888")
                html.append(f'<div class="category" style="border-left: 4px solid {color}; padding-left: 12px; margin: 16px 0;">')
                html.append(f'<h3 style="color: {color};">{category.title()}</h3>')
                html.append('<ul>')
                for item in items:
                    importance = item.get("importance", "medium")
                    opacity = "1" if importance == "high" else "0.8" if importance == "medium" else "0.6"
                    html.append(f'<li style="opacity: {opacity}; margin: 8px 0;">')
                    html.append(f'<span class="highlight-text">{item["text"]}</span>')
                    if include_metadata:
                        html.append(f'<span class="confidence" style="color: #888; font-size: 0.8em;"> ({item.get("confidence", 0):.0%})</span>')
                    html.append('</li>')
                html.append('</ul></div>')
            
            html.append('</div>')
            return "\n".join(html)
        
        else:  # plain text
            lines = ["HIGHLIGHTED NOTES", "=" * 40, ""]
            
            for h in highlights:
                importance = h.get("importance", "medium").upper()
                lines.append(f"[{importance}] {h['text']}")
                if include_metadata:
                    lines.append(f"    Category: {h.get('category', 'N/A')} | Confidence: {h.get('confidence', 0):.0%}")
                lines.append("")
            
            return "\n".join(lines)
    
    def get_category_info(self) -> Dict:
        """Return category information for frontend"""
        return {
            name: {
                "color": info["color"],
                "icon": info.get("icon", ""),
                "keywords": info["keywords"][:3]  # Sample keywords
            }
            for name, info in self.categories.items()
        }


# Singleton instance
advanced_highlighter = AdvancedHighlighter()
