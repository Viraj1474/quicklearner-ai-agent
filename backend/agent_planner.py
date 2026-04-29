"""
Agent Planner Module - Deterministic Action Routing

This module provides a deterministic decision layer that analyzes user input
and routes to the appropriate tool/action. It uses simple keyword + intent logic,
NOT machine learning or dynamic learning from user data.

IMPORTANT: The Google Gemini API is used for inference ONLY. It is NOT trained,
fine-tuned, or modified in any way. All "memory" is session-based context that
is prepended to prompts - the underlying model never learns from user data.

Available Actions:
    - chat: General conversation and Q&A
    - summarize: Text summarization requests
    - generate_quiz: Quiz generation from content
    - generate_flashcards: Flashcard creation from content
    - highlight_notes: Key point extraction from notes

Author: AI Study Assistant
Version: 1.0.0
"""

from dataclasses import dataclass
from typing import Optional, List, Tuple
from enum import Enum
import re
import logging

# Configure module logger
logger = logging.getLogger(__name__)


class AgentAction(Enum):
    """
    Enumeration of available agent actions.
    Each action maps to a specific tool/endpoint in the backend.
    """
    CHAT = "chat"
    SUMMARIZE = "summarize"
    GENERATE_QUIZ = "generate_quiz"
    GENERATE_FLASHCARDS = "generate_flashcards"
    HIGHLIGHT_NOTES = "highlight_notes"


@dataclass
class PlannerResult:
    """
    Result of the planning/intent analysis step.
    
    Attributes:
        action: The determined action to take
        confidence: A simple confidence score (0.0 to 1.0) based on keyword matches
        reasoning: Human-readable explanation of why this action was chosen
        extracted_params: Any parameters extracted from the input (e.g., topic, num_questions)
    """
    action: AgentAction
    confidence: float
    reasoning: str
    extracted_params: dict


# =============================================================================
# KEYWORD PATTERNS FOR INTENT DETECTION
# These are simple, deterministic patterns - no ML involved
# =============================================================================

# Keywords that suggest summarization intent
SUMMARIZE_KEYWORDS = [
    r'\bsummar(y|ize|ise|izing|isation)\b',
    r'\bbrief\b',
    r'\btl;?dr\b',
    r'\bcondense\b',
    r'\bshorten\b',
    r'\bkey\s*points?\b',
    r'\bmain\s*ideas?\b',
    r'\boverview\b',
    r'\bdigest\b',
    r'\brecap\b',
]

# Keywords that suggest quiz generation intent
QUIZ_KEYWORDS = [
    r'\bquiz(zes)?\b',
    r'\btest\s*me\b',
    r'\bquestions?\b',
    r'\bexam\b',
    r'\bassess(ment)?\b',
    r'\bmultiple\s*choice\b',
    r'\bmcq\b',
    r'\bpractice\s*(test|questions?)\b',
    r'\bself[- ]?test\b',
]

# Keywords that suggest flashcard generation intent
FLASHCARD_KEYWORDS = [
    r'\bflash\s*cards?\b',
    r'\bcards?\b.*\b(study|learn|review)\b',
    r'\bstudy\s*cards?\b',
    r'\banki\b',
    r'\bmemorize\b',
    r'\bmemorization\b',
    r'\bspaced\s*repetition\b',
    r'\breview\s*cards?\b',
    r'\bterm\s*(and|&)\s*definition\b',
]

# Keywords that suggest note highlighting intent
HIGHLIGHT_KEYWORDS = [
    r'\bhighlight\b',
    r'\bimportant\s*(parts?|sections?|points?)\b',
    r'\bmark\b.*\b(key|important)\b',
    r'\bextract\b.*\b(key|important|main)\b',
    r'\bnotes?\b.*\bhighlight\b',
    r'\bkey\s*takeaways?\b',
]

# Action request patterns (explicit commands)
ACTION_COMMANDS = {
    AgentAction.SUMMARIZE: [r'^summarize\b', r'^create\s+a?\s*summary\b'],
    AgentAction.GENERATE_QUIZ: [r'^(create|generate|make)\s+a?\s*quiz\b', r'^quiz\s+me\b'],
    AgentAction.GENERATE_FLASHCARDS: [r'^(create|generate|make)\s+(flash\s*)?cards?\b'],
    AgentAction.HIGHLIGHT_NOTES: [r'^highlight\b', r'^extract\s+key\b'],
}


def _count_keyword_matches(text: str, patterns: List[str]) -> Tuple[int, List[str]]:
    """
    Count how many keyword patterns match in the given text.
    
    Args:
        text: The input text to analyze
        patterns: List of regex patterns to match
        
    Returns:
        Tuple of (match_count, list_of_matched_patterns)
    """
    text_lower = text.lower()
    matches = []
    for pattern in patterns:
        if re.search(pattern, text_lower, re.IGNORECASE):
            matches.append(pattern)
    return len(matches), matches


def _check_explicit_commands(text: str) -> Optional[AgentAction]:
    """
    Check if the input starts with an explicit action command.
    These take priority over keyword matching.
    
    Args:
        text: The input text to analyze
        
    Returns:
        The matching AgentAction if found, None otherwise
    """
    text_lower = text.lower().strip()
    for action, patterns in ACTION_COMMANDS.items():
        for pattern in patterns:
            if re.match(pattern, text_lower, re.IGNORECASE):
                return action
    return None


def _extract_quiz_params(text: str) -> dict:
    """
    Extract quiz-related parameters from the input text.
    
    Args:
        text: The input text to analyze
        
    Returns:
        Dictionary with extracted parameters (num_questions, topic, etc.)
    """
    params = {}
    
    # Try to extract number of questions
    num_match = re.search(r'(\d+)\s*(questions?|items?|problems?)', text, re.IGNORECASE)
    if num_match:
        params['num_questions'] = min(int(num_match.group(1)), 20)  # Cap at 20
    
    # Try to extract topic if mentioned with "about" or "on"
    topic_match = re.search(r'(?:about|on|regarding|for)\s+([^.,!?]+)', text, re.IGNORECASE)
    if topic_match:
        params['topic'] = topic_match.group(1).strip()
    
    return params


def _extract_flashcard_params(text: str) -> dict:
    """
    Extract flashcard-related parameters from the input text.
    
    Args:
        text: The input text to analyze
        
    Returns:
        Dictionary with extracted parameters (num_cards, topic, etc.)
    """
    params = {}
    
    # Try to extract number of cards
    num_match = re.search(r'(\d+)\s*(cards?|flash\s*cards?|items?)', text, re.IGNORECASE)
    if num_match:
        params['num_cards'] = min(int(num_match.group(1)), 30)  # Cap at 30
    
    return params


def analyze_intent(user_input: str, context: Optional[str] = None) -> PlannerResult:
    """
    Analyze user input and determine the appropriate action.
    
    This is the main entry point for the planner. It uses a deterministic
    rule-based approach to classify user intent:
    
    1. First, check for explicit action commands (highest priority)
    2. Then, count keyword matches for each action type
    3. Select the action with the most matches
    4. Default to CHAT if no clear intent is detected
    
    IMPORTANT: This is NOT machine learning. It's simple pattern matching
    that will give consistent, predictable results for the same inputs.
    
    Args:
        user_input: The user's message/request
        context: Optional conversation context (not used for classification,
                 but could be used for parameter extraction in future)
    
    Returns:
        PlannerResult with the determined action and metadata
    """
    if not user_input or not user_input.strip():
        logger.debug("Empty input received, defaulting to CHAT")
        return PlannerResult(
            action=AgentAction.CHAT,
            confidence=0.0,
            reasoning="Empty input - defaulting to chat mode",
            extracted_params={}
        )
    
    text = user_input.strip()
    logger.debug(f"Analyzing intent for input: {text[:100]}...")
    
    # Step 1: Check for explicit commands (highest priority)
    explicit_action = _check_explicit_commands(text)
    if explicit_action:
        logger.info(f"Explicit command detected: {explicit_action.value}")
        
        # Extract params based on action type
        params = {}
        if explicit_action == AgentAction.GENERATE_QUIZ:
            params = _extract_quiz_params(text)
        elif explicit_action == AgentAction.GENERATE_FLASHCARDS:
            params = _extract_flashcard_params(text)
        
        return PlannerResult(
            action=explicit_action,
            confidence=1.0,
            reasoning=f"Explicit '{explicit_action.value}' command detected in input",
            extracted_params=params
        )
    
    # Step 2: Count keyword matches for each action type
    scores = {
        AgentAction.SUMMARIZE: _count_keyword_matches(text, SUMMARIZE_KEYWORDS),
        AgentAction.GENERATE_QUIZ: _count_keyword_matches(text, QUIZ_KEYWORDS),
        AgentAction.GENERATE_FLASHCARDS: _count_keyword_matches(text, FLASHCARD_KEYWORDS),
        AgentAction.HIGHLIGHT_NOTES: _count_keyword_matches(text, HIGHLIGHT_KEYWORDS),
    }
    
    # Log scores for debugging
    for action, (count, _) in scores.items():
        if count > 0:
            logger.debug(f"  {action.value}: {count} keyword matches")
    
    # Step 3: Find the action with the most matches
    best_action = AgentAction.CHAT
    best_score = 0
    best_matches = []
    
    for action, (count, matches) in scores.items():
        if count > best_score:
            best_score = count
            best_action = action
            best_matches = matches
    
    # Step 4: Determine confidence and extract params
    if best_score == 0:
        # No keywords matched - default to chat
        logger.debug("No specific intent detected, defaulting to CHAT")
        return PlannerResult(
            action=AgentAction.CHAT,
            confidence=0.5,  # Medium confidence for chat (it's the fallback)
            reasoning="No specific action keywords detected - treating as general chat",
            extracted_params={}
        )
    
    # Calculate confidence based on number of matches (more matches = higher confidence)
    # Max confidence is 0.95 for keyword matches (1.0 is reserved for explicit commands)
    confidence = min(0.5 + (best_score * 0.15), 0.95)
    
    # Extract action-specific parameters
    params = {}
    if best_action == AgentAction.GENERATE_QUIZ:
        params = _extract_quiz_params(text)
    elif best_action == AgentAction.GENERATE_FLASHCARDS:
        params = _extract_flashcard_params(text)
    
    reasoning = f"Detected {best_score} keyword match(es) for '{best_action.value}' action"
    
    logger.info(f"Intent analysis complete: action={best_action.value}, confidence={confidence:.2f}")
    
    return PlannerResult(
        action=best_action,
        confidence=confidence,
        reasoning=reasoning,
        extracted_params=params
    )


def get_action_prompt_prefix(action: AgentAction) -> str:
    """
    Get a system prompt prefix that helps guide the AI for the given action.
    
    This provides context to Gemini about what type of response is expected,
    but does NOT train or modify the model in any way.
    
    Args:
        action: The action type
        
    Returns:
        A prompt prefix string
    """
    prefixes = {
        AgentAction.CHAT: (
            "You are a helpful AI study assistant. Engage in natural conversation "
            "and help the user with their learning goals. Be encouraging and supportive."
        ),
        AgentAction.SUMMARIZE: (
            "You are a summarization expert. Create clear, concise summaries that "
            "capture the key points while being easy to understand and remember."
        ),
        AgentAction.GENERATE_QUIZ: (
            "You are an educational assessment expert. Create well-structured quiz "
            "questions that test understanding, not just memorization. Include a mix "
            "of difficulty levels."
        ),
        AgentAction.GENERATE_FLASHCARDS: (
            "You are a flashcard creation expert. Create effective flashcards with "
            "clear, concise questions/terms on one side and comprehensive but "
            "digestible answers/definitions on the other."
        ),
        AgentAction.HIGHLIGHT_NOTES: (
            "You are a study notes expert. Identify and highlight the most important "
            "concepts, definitions, and facts that a student should focus on."
        ),
    }
    return prefixes.get(action, prefixes[AgentAction.CHAT])


# =============================================================================
# REFLECTION HELPERS
# These help the agent "reflect" on its response after generating it
# =============================================================================

def generate_reflection_prompt(
    user_input: str,
    action_taken: AgentAction,
    response_preview: str
) -> str:
    """
    Generate a prompt for the agent to reflect on its response.
    
    Reflection is a key part of the agent loop - it allows the agent to
    assess whether it addressed the user's needs effectively. This is
    used for logging and context, NOT for training.
    
    Args:
        user_input: The original user request
        action_taken: The action that was executed
        response_preview: First 500 chars of the generated response
        
    Returns:
        A reflection prompt string
    """
    return f"""Briefly assess (in 1-2 sentences) whether this response adequately addressed the user's request.

User asked: {user_input[:200]}
Action taken: {action_taken.value}
Response preview: {response_preview[:500]}

Did the response address the user's needs? What could be improved?"""


def create_execution_plan(planner_result: PlannerResult) -> List[str]:
    """
    Create a simple execution plan based on the planner result.
    
    This is mostly for logging/debugging to show what steps the agent
    will take to fulfill the request.
    
    Args:
        planner_result: The result from analyze_intent()
        
    Returns:
        List of step descriptions
    """
    steps = []
    
    # Step 1: Load context (always)
    steps.append("Load session memory and conversation context")
    
    # Step 2: Action-specific steps
    if planner_result.action == AgentAction.CHAT:
        steps.append("Process user message with conversation context")
        steps.append("Generate conversational response via Gemini API")
    elif planner_result.action == AgentAction.SUMMARIZE:
        steps.append("Extract text content to summarize")
        steps.append("Generate summary via Gemini API")
    elif planner_result.action == AgentAction.GENERATE_QUIZ:
        num_q = planner_result.extracted_params.get('num_questions', 5)
        steps.append(f"Prepare quiz generation for {num_q} questions")
        steps.append("Generate quiz questions via Gemini API")
        steps.append("Parse and validate quiz format")
    elif planner_result.action == AgentAction.GENERATE_FLASHCARDS:
        num_c = planner_result.extracted_params.get('num_cards', 10)
        steps.append(f"Prepare flashcard generation for {num_c} cards")
        steps.append("Generate flashcards via Gemini API")
        steps.append("Parse and validate flashcard format")
    elif planner_result.action == AgentAction.HIGHLIGHT_NOTES:
        steps.append("Analyze text for key concepts")
        steps.append("Generate highlighted notes via Gemini API")
    
    # Step 3: Post-processing (always)
    steps.append("Update session memory with interaction")
    steps.append("Log interaction for analytics")
    
    return steps


# =============================================================================
# EXAMPLE USAGE (for testing)
# =============================================================================

if __name__ == "__main__":
    # Configure logging for testing
    logging.basicConfig(level=logging.DEBUG)
    
    test_inputs = [
        "Hello, how are you?",
        "Can you summarize this article for me?",
        "Create a quiz about photosynthesis with 10 questions",
        "I need flashcards for my biology exam",
        "Quiz me on the French Revolution",
        "What are the key points in these notes?",
        "Generate flashcards from this chapter",
        "tl;dr of this document",
        "Make 5 flashcards about Python programming",
        "Help me study for my test",
    ]
    
    print("=" * 60)
    print("Agent Planner - Intent Analysis Tests")
    print("=" * 60)
    
    for test_input in test_inputs:
        result = analyze_intent(test_input)
        print(f"\nInput: \"{test_input}\"")
        print(f"  Action: {result.action.value}")
        print(f"  Confidence: {result.confidence:.2f}")
        print(f"  Reasoning: {result.reasoning}")
        if result.extracted_params:
            print(f"  Params: {result.extracted_params}")
        
        # Show execution plan
        plan = create_execution_plan(result)
        print(f"  Execution Plan:")
        for i, step in enumerate(plan, 1):
            print(f"    {i}. {step}")
