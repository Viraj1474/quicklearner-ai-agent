"""
Agent State Management for AI Study Assistant

This module implements session-based agent state that enables the backend
to behave like a REAL AI AGENT with:
  - Short-term memory (recent conversation context)
  - Long-term memory (summarized knowledge from past interactions)
  - Goal tracking
  - Action reflection

IMPORTANT: This is NOT model training or fine-tuning.
- Gemini is called via API and is NOT modified or trained.
- Memory is used purely for CONTEXT in prompts (RAG-like behavior).
- The database stores conversation history and agent state, NOT training data.

Architecture:
  User message → Load AgentState → Build context prompt → Call Gemini → 
  Store response → Reflect → Update state → Return response
"""

import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from dataclasses import dataclass, field

logger = logging.getLogger("agent_state")


@dataclass
class AgentState:
    """
    Represents the state of an AI agent for a specific chat session.
    
    This enables the agent to:
    - Remember recent messages (short_term_memory)
    - Retain summarized knowledge (long_term_memory)
    - Track conversation goals
    - Record last action for reflection
    
    NOTE: This is context management, NOT model training.
    The Gemini model is called via API and remains unchanged.
    """
    
    session_id: int
    goal: str = ""
    short_term_memory: List[Dict[str, str]] = field(default_factory=list)
    long_term_memory: str = ""
    last_action: str = ""
    last_reflection: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    # Configuration
    MAX_SHORT_TERM_MESSAGES: int = 10
    SUMMARIZE_THRESHOLD: int = 8  # Summarize when short_term reaches this count
    
    def add_message(self, sender: str, content: str) -> None:
        """
        Add a message to short-term memory and trim if necessary.
        
        Args:
            sender: "user" or "ai"
            content: Message content
        """
        self.short_term_memory.append({
            "sender": sender,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Trim to last N messages
        if len(self.short_term_memory) > self.MAX_SHORT_TERM_MESSAGES:
            self.short_term_memory = self.short_term_memory[-self.MAX_SHORT_TERM_MESSAGES:]
        
        self.updated_at = datetime.utcnow()
        logger.debug(f"Session {self.session_id}: Added {sender} message, memory size: {len(self.short_term_memory)}")
    
    def should_summarize(self) -> bool:
        """Check if short-term memory should be summarized into long-term."""
        return len(self.short_term_memory) >= self.SUMMARIZE_THRESHOLD
    
    def update_long_term_memory(self, summary: str) -> None:
        """
        Update long-term memory with a new summary.
        Appends to existing long-term memory with timestamp.
        
        Args:
            summary: Summarized content from short-term memory
        """
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
        if self.long_term_memory:
            self.long_term_memory += f"\n\n[{timestamp}] {summary}"
        else:
            self.long_term_memory = f"[{timestamp}] {summary}"
        
        # Trim long-term memory if too long (keep last 2000 chars)
        if len(self.long_term_memory) > 2000:
            self.long_term_memory = "..." + self.long_term_memory[-1900:]
        
        self.updated_at = datetime.utcnow()
        logger.info(f"Session {self.session_id}: Updated long-term memory ({len(self.long_term_memory)} chars)")
    
    def set_goal(self, goal: str) -> None:
        """Set the current conversation goal."""
        self.goal = goal
        self.updated_at = datetime.utcnow()
        logger.debug(f"Session {self.session_id}: Goal set to '{goal[:50]}...'")
    
    def record_action(self, action: str, reflection: str = "") -> None:
        """
        Record the last action taken and optional reflection.
        
        Args:
            action: Action type (e.g., "chat", "summarize", "generate_quiz")
            reflection: Optional reflection on the action's relevance
        """
        self.last_action = action
        self.last_reflection = reflection
        self.updated_at = datetime.utcnow()
        logger.debug(f"Session {self.session_id}: Action '{action}' recorded")
    
    def build_context_prompt(self) -> str:
        """
        Build a context prompt combining short-term and long-term memory.
        
        Returns:
            A formatted string to prepend to the AI prompt for context.
        
        NOTE: This is prompt engineering, NOT training.
        We provide context so Gemini can generate relevant responses.
        """
        context_parts = []
        
        # Add long-term memory (summarized past knowledge)
        if self.long_term_memory:
            context_parts.append(
                "=== LONG-TERM MEMORY (Previous Session Summary) ===\n"
                f"{self.long_term_memory}\n"
            )
        
        # Add goal if set
        if self.goal:
            context_parts.append(f"=== CURRENT GOAL ===\n{self.goal}\n")
        
        # Add recent conversation history (short-term memory)
        if self.short_term_memory:
            history_lines = []
            for msg in self.short_term_memory[-5:]:  # Last 5 for context
                role = "User" if msg["sender"] == "user" else "AI"
                history_lines.append(f"{role}: {msg['content'][:200]}")
            
            context_parts.append(
                "=== RECENT CONVERSATION ===\n" + "\n".join(history_lines) + "\n"
            )
        
        return "\n".join(context_parts) if context_parts else ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize state to dictionary for storage."""
        return {
            "session_id": self.session_id,
            "goal": self.goal,
            "short_term_memory": self.short_term_memory,
            "long_term_memory": self.long_term_memory,
            "last_action": self.last_action,
            "last_reflection": self.last_reflection,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AgentState":
        """Deserialize state from dictionary."""
        state = cls(session_id=data["session_id"])
        state.goal = data.get("goal", "")
        state.short_term_memory = data.get("short_term_memory", [])
        state.long_term_memory = data.get("long_term_memory", "")
        state.last_action = data.get("last_action", "")
        state.last_reflection = data.get("last_reflection", "")
        if "created_at" in data:
            state.created_at = datetime.fromisoformat(data["created_at"])
        if "updated_at" in data:
            state.updated_at = datetime.fromisoformat(data["updated_at"])
        return state


class AgentStateManager:
    """
    Manages agent states across sessions.
    
    Uses in-memory cache with optional database persistence.
    Each chat session has its own AgentState.
    
    NOTE: This is state management for prompt context, NOT model training.
    """
    
    def __init__(self):
        """Initialize the state manager with an in-memory cache."""
        self._states: Dict[str, AgentState] = {}
        logger.info("✓ AgentStateManager initialized")
    
    def get_state(self, session_key: str) -> AgentState:
        """
        Get or create agent state for a session.
        
        Args:
            session_key: Session identifier (e.g., "session_123")
            
        Returns:
            AgentState for the session
        """
        if session_key not in self._states:
            # Extract numeric ID if present, otherwise use hash
            try:
                session_id = int(session_key.split("_")[-1]) if "_" in session_key else hash(session_key)
            except ValueError:
                session_id = hash(session_key)
            
            self._states[session_key] = AgentState(session_id=session_id)
            logger.info(f"Created new AgentState for {session_key}")
        return self._states[session_key]
    
    def save_state(self, state: AgentState, session_key: str = None) -> None:
        """
        Save agent state (updates in-memory cache).
        
        For persistence, this could be extended to save to database.
        Currently uses in-memory storage for simplicity.
        """
        if session_key is None:
            session_key = f"session_{state.session_id}"
        self._states[session_key] = state
        logger.debug(f"Saved AgentState for {session_key}")
    
    def clear_state(self, session_key: str) -> None:
        """Clear agent state for a session."""
        if session_key in self._states:
            del self._states[session_key]
            logger.info(f"Cleared AgentState for {session_key}")
    
    def get_all_sessions(self) -> List[str]:
        """Get all active session keys."""
        return list(self._states.keys())
    
    def get_active_session_count(self) -> int:
        """Get the number of active agent sessions."""
        return len(self._states)


# Singleton instance for global access
agent_state_manager = AgentStateManager()
