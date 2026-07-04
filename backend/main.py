"""
AI Study Assistant Backend API - AI Agent Architecture

This is a REAL AI AGENT backend, not just an API wrapper. It implements:

1. AGENT STATE: Session-based state with short-term memory (conversation history)
   and long-term memory (summarized context). See agent_state.py

2. PLANNER: Deterministic intent detection that routes user requests to the
   appropriate tool (chat, summarize, quiz, flashcards). See agent_planner.py

3. TOOL EXECUTION: Each action is executed via the Gemini API wrapper with
   proper context from the agent's memory.

4. REFLECTION: After each response, the agent optionally reflects on whether
   it adequately addressed the user's needs.

IMPORTANT CLARIFICATION - NO TRAINING:
The Google Gemini API is used for INFERENCE ONLY. It is NOT trained, fine-tuned,
or modified in any way by this application. All "memory" is session-based context
that is prepended to prompts - the underlying model never learns from user data.

Author: AI Study Assistant
Version: 2.0.0 (Agent Architecture)
"""
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import asyncio
import json
import logging
import traceback
import psutil  # For system metrics
import os

from config import settings, setup_logging

# Import middleware components
from middleware import (
    limiter,
    rate_limit_exceeded_handler,
    SecurityHeadersMiddleware,
    RequestLoggingMiddleware,
    RequestStatsMiddleware,
    get_cache_stats,
    get_request_stats,
    clear_cache,
    CHAT_RATE_LIMIT,
    AI_RATE_LIMIT
)
from slowapi.errors import RateLimitExceeded
from database import get_db, init_db, User, UserRole, ChatSession, ChatMessage, Summary, Quiz, Flashcard, Analytics
from schemas import (
    ChatRequest, ChatResponse, SummaryRequest, SummaryResponse,
    NotesHighlightRequest, NotesHighlightResponse, QuizRequest, QuizResponse,
    FlashcardCreate, FlashcardResponse, FlashcardGenerateRequest, FlashcardReview,
    AnalyticsResponse, MessageResponse, ErrorResponse, QuizQuestion,
    # Advanced schemas
    AdvancedHighlightRequest, AdvancedHighlightResponse,
    AdvancedSummaryRequest, AdvancedSummaryResponse,
    AdvancedQuizRequest, AdvancedQuizResponse,
    AnalyticsDashboardResponse, AnalyticsPerformanceResponse, AnalyticsTrendsResponse
)
from gemini_wrapper import GeminiAPIError
from ai_fallback_wrapper import ai_fallback_wrapper
from job_queue import job_queue

# === AUTHENTICATION ===
from auth_routes import router as auth_router
from billing_routes import router as billing_router
from auth import get_current_user, get_current_user_optional, require_role, require_premium, require_premium_or_quota

# === AGENT COMPONENTS ===
# These implement the AI Agent architecture with memory and planning
from agent_state import AgentStateManager, AgentState
from agent_planner import (
    analyze_intent, 
    AgentAction, 
    PlannerResult,
    get_action_prompt_prefix,
    create_execution_plan
)

# ===== LOGGING SETUP =====
setup_logging()
logger = logging.getLogger(__name__)

# ===== AGENT STATE MANAGER =====
# Singleton that manages session-based agent states with memory
# Each session has its own AgentState with short-term and long-term memory
agent_manager = AgentStateManager()


def _stream_sse_event(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, default=str)}\n\n"


def _chunk_text(text: str, chunk_size: int = 64):
    for start in range(0, len(text), chunk_size):
        yield text[start:start + chunk_size]


def validate_non_empty_text(text: Optional[str], field_name: str) -> None:
    """Validate that a required text field is present and non-empty."""
    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail=f"{field_name} cannot be empty")


def validate_max_length(text: Optional[str], max_length: int, detail: str) -> None:
    """Validate an optional text field does not exceed max length."""
    if text and len(text) > max_length:
        raise HTTPException(status_code=400, detail=detail)


def validate_range(value: int, min_value: int, max_value: int, detail: str) -> None:
    """Validate numeric values fall within an allowed range."""
    if value < min_value or value > max_value:
        raise HTTPException(status_code=400, detail=detail)

# ===== DATABASE INITIALIZATION =====
# Initialize SQLite database and create tables if they don't exist
try:
    init_db()
    logger.info("✓ Database initialized successfully")
except Exception as e:
    logger.error(f"✗ Error initializing database: {e}")
    traceback.print_exc()

# ===== APP LIFESPAN HANDLER =====
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handle app startup and shutdown events.
    This context manager runs when the app starts and shuts down.
    """
    # === STARTUP ===
    logger.info("=" * 70)
    logger.info("✓ Server started successfully!")
    logger.info(f"✓ Running on {settings.HOST}:{settings.PORT}")
    logger.info(f"✓ Debug mode: {settings.DEBUG}")
    logger.info(f"✓ Gemini timeout: {settings.GEMINI_TIMEOUT_SECONDS}s")
    logger.info("✓ Application is ready to handle requests")
    logger.info("=" * 70)
    
    # Yield control to the app (it runs while yielded)
    yield
    
    # === SHUTDOWN ===
    logger.info("=" * 70)
    logger.info("✓ Shutting down gracefully...")
    logger.info("=" * 70)

# Initialize FastAPI app with lifespan
# In production, disable debug mode to prevent information leakage
app = FastAPI(
    title="AI Study Assistant API",
    description="AI Agent backend with memory, planning, and tool routing for study assistance",
    version="2.0.0",
    debug=(settings.DEBUG and settings.ENVIRONMENT != "production"),  # Never debug in production
    lifespan=lifespan,
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",  # Disable /docs in production
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",  # Disable /redoc in production
    openapi_url=None if settings.ENVIRONMENT == "production" else "/openapi.json"  # Disable OpenAPI schema in production
)

# ===== CORS CONFIGURATION =====
# In development: Allow localhost on multiple ports
# In production: Only allow specific domain(s) via environment variable
if settings.ENVIRONMENT == "production":
    # Production: Restrict to explicitly configured origin(s)
    cors_origins = os.getenv("ALLOWED_ORIGIN", "https://yourdomain.com").split(",")
    if not cors_origins or cors_origins == ["https://yourdomain.com"]:
        # Warn if using default
        logger.warning("⚠️  CORS is using default domain. Set ALLOWED_ORIGIN environment variable for production.")
else:
    # Development: Allow common local ports
    cors_origins = settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add request statistics middleware
app.add_middleware(RequestStatsMiddleware)

# Include authentication router
app.include_router(auth_router)

# Include billing router
app.include_router(billing_router)

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API health check"""
    logger.debug("Root endpoint accessed")
    return {
        "message": "AI Study Assistant API is running!",
        "version": app.version,
        "status": "healthy",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health"
        }
    }

# === Health Check (Independent of AI Service) ===
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Comprehensive health check endpoint with system metrics.
    
    Returns:
        - status: overall health status
        - database: database connection status
        - agent: agent state manager status
        - system: CPU, memory, disk metrics
        - cache: cache statistics
        - requests: request statistics
    """
    try:
        # Check database connection
        db = next(get_db())
        db.close()
        db_status = "healthy"
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        db_status = "unhealthy"
    
    # Get agent manager stats
    active_sessions = agent_manager.get_active_session_count()
    
    # Get system metrics
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        system_metrics = {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_mb": round(memory.available / (1024 * 1024), 1),
            "disk_percent": disk.percent
        }
    except Exception:
        system_metrics = {"status": "unavailable"}
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "api_version": "2.0.0",
        "architecture": "AI Agent with Memory + Planning",
        "database": db_status,
        "agent": {
            "status": "active",
            "active_sessions": active_sessions
        },
        "system": system_metrics,
        "cache": get_cache_stats(),
        "requests": get_request_stats(),
        "service": "backend"
    }

# === Quota Status Endpoint ===
@app.get("/api/quota/status", tags=["Quota"])
async def quota_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return per-feature quota status for the current user."""
    from billing import get_quota_info
    return get_quota_info(db, current_user)


# === Admin Endpoints ===
@app.post("/api/admin/clear-cache", tags=["Admin"])
async def admin_clear_cache(admin_user: User = Depends(require_role([UserRole.ADMIN.value]))):
    """Clear the response cache (Admin only)"""
    clear_cache()
    logger.info(f"Response cache cleared by admin request: user_id={admin_user.id}")
    return {"message": "Cache cleared successfully", "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/admin/reset-ai-health", tags=["Admin"])
async def admin_reset_ai_health(admin_user: User = Depends(require_role([UserRole.ADMIN.value]))):
    """Reset AI provider health tracker (clear failures and open circuits).

    Admin-only endpoint to immediately clear circuit-breaker state for both
    AI providers (`gemini` and `huggingface`). Useful for emergency recovery
    when providers are temporarily marked unavailable.
    """
    try:
        # Use the health tracker methods to mark providers as healthy
        ai_fallback_wrapper._health_tracker.record_success("gemini")
        ai_fallback_wrapper._health_tracker.record_success("huggingface")
        logger.warning(f"AI health reset via admin by user_id={admin_user.id}")
        return {"message": "AI provider health reset. Circuits closed.", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.exception("Failed to reset AI health tracker")
        raise HTTPException(status_code=500, detail=str(e))


# Development helper: reset AI health without authentication when in development
@app.post("/api/dev/reset-ai-health", tags=["Dev"])
async def dev_reset_ai_health():
    """Development-only endpoint to reset AI provider health tracker.

    This endpoint is intentionally unauthenticated and is only enabled when
    `ENVIRONMENT` is `development`. It is useful for local debugging and
    should never be exposed in production.
    """
    if settings.ENVIRONMENT != "development":
        raise HTTPException(status_code=403, detail="Dev reset is disabled in non-development environments")

    try:
        ai_fallback_wrapper._health_tracker.record_success("gemini")
        ai_fallback_wrapper._health_tracker.record_success("huggingface")
        logger.warning("AI health reset via /api/dev/reset-ai-health (development only)")
        return {"message": "AI provider health reset (development). Circuits closed.", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.exception("Failed to reset AI health tracker (dev)")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats", tags=["Stats"])
async def get_stats():
    """Get API statistics including request counts, cache stats, and system metrics"""
    try:
        # Get system metrics
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        system_metrics = {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_used_mb": round(memory.used / (1024 * 1024), 1),
            "memory_available_mb": round(memory.available / (1024 * 1024), 1)
        }
    except Exception:
        system_metrics = {"status": "unavailable"}
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "system": system_metrics,
        "cache": get_cache_stats(),
        "requests": get_request_stats(),
        "rate_limits": {
            "chat": CHAT_RATE_LIMIT,
            "ai_endpoints": AI_RATE_LIMIT
        }
    }

# === AI Provider Status Endpoint ===
@app.get("/api/providers/status", tags=["Providers"])
async def get_provider_status():
    """
    Get AI provider health status and availability
    
    Shows:
    - Current active provider
    - Primary and fallback providers
    - Health status of each provider
    - Failure counts and recent issues
    - Provider switch history
    """
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "current_provider": ai_fallback_wrapper.current_provider,
        "primary_provider": ai_fallback_wrapper.primary_provider,
        "fallback_provider": ai_fallback_wrapper.fallback_provider,
        "health_status": ai_fallback_wrapper.get_health_status()
    }

# === Chat Endpoints ===
@app.post("/api/chat", tags=["Chat"])
@limiter.limit(CHAT_RATE_LIMIT)
async def chat(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium_or_quota("chat"))
):
    """AI Agent Chat Endpoint — accepts JSON or multipart/form-data with files."""
    user_id = current_user.id

    # Parse incoming payload: support JSON or multipart/form-data
    content_type = request.headers.get('content-type', '')
    chat_message = ''
    session_id = None
    attachments = []

    try:
        if content_type.startswith('multipart/'):
            form = await request.form()
            chat_message = (form.get('message') or '').strip()
            session_id = form.get('session_id')
            # collect UploadFile objects
            for k, v in form.items():
                if hasattr(v, 'filename') and v.filename:
                    attachments.append(v)
        else:
            body = await request.json()
            chat_message = (body.get('message') or '').strip()
            session_id = body.get('session_id')
    except Exception:
        logger.exception("Failed to parse chat request body")
        raise HTTPException(status_code=400, detail="Invalid request body")

    logger.info("[/api/chat] Incoming request: user_id=%s session_id=%s message_length=%s attachments=%s",
                user_id, session_id, len(chat_message or ""), len(attachments))

    # Basic validation
    validate_non_empty_text(chat_message, "Message")
    validate_max_length(chat_message, settings.MAX_CHAT_MESSAGE_LENGTH,
                        f"Message exceeds maximum length of {settings.MAX_CHAT_MESSAGE_LENGTH} characters")

    try:
        # === STEP 1: SESSION & STATE MANAGEMENT ===
        session = None
        if session_id:
            try:
                sid_int = int(session_id)
            except Exception:
                sid_int = None
            if sid_int:
                session = db.query(ChatSession).filter(
                    ChatSession.id == sid_int,
                    ChatSession.user_id == user_id
                ).first()
            if not session and sid_int:
                raise HTTPException(status_code=404, detail="Session not found")

        if not session:
            session = ChatSession(user_id=user_id, title=(chat_message or '')[:50])
            db.add(session)
            db.commit()
            db.refresh(session)
            logger.info(f"Created new chat session {session.id} for user {user_id}")

        # Get or create agent state
        session_key = f"session_{session.id}"
        agent_state = agent_manager.get_state(session_key)
        if not agent_state.goal:
            agent_state.goal = f"Help user with their study needs. Session: {session.title}"

        # === STEP 2: INTENT ANALYSIS ===
        planner_result = analyze_intent(user_input=chat_message, context=agent_state.build_context_prompt())
        logger.info(f"[Agent] Intent: {planner_result.action.value} Confidence: {planner_result.confidence:.2f}")

        # === STEP 3: BUILD CONTEXT & STORE USER MESSAGE ===
        messages = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.timestamp).all()
        history = [{"sender": msg.sender, "content": msg.content} for msg in messages]
        context_prompt = agent_state.build_context_prompt()

        # Optionally extract text from attachments and append to message context
        attachment_texts = []
        for up in attachments:
            try:
                content_type = getattr(up, 'content_type', '') or ''
                if content_type.startswith('text/'):
                    data = await up.read()
                    text = data.decode('utf-8', errors='replace')
                    attachment_texts.append(f"== Attachment: {up.filename} ==\n{text}")
                elif up.filename.lower().endswith('.pdf'):
                    try:
                        try:
                            import importlib
                            PyPDF2 = importlib.import_module('PyPDF2')
                            PdfReader = getattr(PyPDF2, 'PdfReader', None)
                        except Exception:
                            PdfReader = None
                        if PdfReader:
                            stream = up.file
                            stream.seek(0)
                            reader = PdfReader(stream)
                            pages_text = []
                            for p in reader.pages:
                                pages_text.append(p.extract_text() or '')
                            attachment_texts.append(f"== Attachment: {up.filename} (pdf) ==\n" + "\n".join(pages_text))
                        else:
                            logger.warning("PyPDF2 not available; skipping PDF extraction")
                            attachment_texts.append(f"== Attachment: {up.filename} (pdf - not parsed) ==")
                    except Exception:
                        logger.exception(f"PDF text extraction failed for {up.filename}")
                else:
                    # skip binary attachments for now
                    attachment_texts.append(f"== Attachment: {up.filename} (binary file - not parsed) ==")
            except Exception:
                logger.exception(f"Failed to read attachment {getattr(up, 'filename', 'unknown')}")

        # store user message in DB
        combined_message = chat_message
        if attachment_texts:
            combined_message = combined_message + '\n\n' + '\n\n'.join(attachment_texts)

        user_msg = ChatMessage(session_id=session.id, content=combined_message, sender='user')
        db.add(user_msg)
        db.commit()
        agent_state.add_message('user', combined_message)

        # === STEP 4: TOOL EXECUTION ===
        system_prefix = get_action_prompt_prefix(planner_result.action)
        enhanced_message = f"{context_prompt}\n\n{system_prefix}\n\nUser: {combined_message}"
        ai_response = await ai_fallback_wrapper.chat(enhanced_message, history)

        # === STEP 5: UPDATE AGENT MEMORY ===
        agent_state.add_message('assistant', ai_response)
        agent_state.last_action = planner_result.action.value

        if agent_state.should_summarize():
            try:
                messages_text = "\n".join(f"{m['sender'].upper()}: {m['content']}" for m in agent_state.short_term_memory)
                summary = await ai_fallback_wrapper.summarize(messages_text)
                agent_state.update_long_term_memory(summary)
                agent_state.short_term_memory = agent_state.short_term_memory[-2:]
                logger.info(f"[Agent] Memory summarized for session {session_key}")
            except Exception:
                logger.exception("Memory summarization failed")

        # store AI message
        ai_msg = ChatMessage(session_id=session.id, content=ai_response, sender='ai')
        db.add(ai_msg)
        session.updated_at = datetime.utcnow()
        db.commit()

        # Track usage (increments daily quota)
        from billing import increment_usage
        increment_usage(db, current_user.id, 'chat')
        logger.info(f"[Quota] User {current_user.id} consumed 1 chat usage")

        async def event_stream():
            yield _stream_sse_event('meta', {'session_id': session.id, 'timestamp': datetime.utcnow().isoformat()})
            for chunk in _chunk_text(ai_response):
                yield _stream_sse_event('chunk', {'content': chunk})
                await asyncio.sleep(0.01)
            yield _stream_sse_event('done', {'message': ai_response, 'session_id': session.id, 'timestamp': datetime.utcnow().isoformat()})

        return StreamingResponse(event_stream(), media_type='text/event-stream')
    except GeminiAPIError as e:
        logger.error(f"✗ Gemini API error in chat: {e.error_type} - {e.message}")
        raise HTTPException(status_code=503 if 'timeout' in e.error_type or 'network' in e.error_type else 500, detail=e.message)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in chat endpoint")
        detail_msg = str(e) if settings.DEBUG else 'An unexpected error occurred. Please try again.'
        raise HTTPException(status_code=500, detail=detail_msg)
        db.add(ai_msg)
        session.updated_at = datetime.utcnow()
        db.commit()
        
        # === STEP 6: REFLECTION (AGENT SELF-ASSESSMENT) ===
        agent_state.last_reflection = f"Action: {planner_result.action.value}, response_length: {len(ai_response)}"
        
        logger.info(
            f"[Agent] Response generated: {len(ai_response)} chars, "
            f"Memory size: {len(agent_state.short_term_memory)} messages"
        )
        
        async def event_stream():
            yield _stream_sse_event("meta", {
                "session_id": session.id,
                "timestamp": datetime.utcnow().isoformat(),
            })
            for chunk in _chunk_text(ai_response):
                yield _stream_sse_event("chunk", {"content": chunk})
                await asyncio.sleep(0.01)
            yield _stream_sse_event("done", {
                "message": ai_response,
                "session_id": session.id,
                "timestamp": datetime.utcnow().isoformat(),
            })

        return StreamingResponse(event_stream(), media_type="text/event-stream")
        
    except GeminiAPIError as e:
        logger.error(f"✗ Gemini API error in chat: {e.error_type} - {e.message}")
        raise HTTPException(
            status_code=503 if "timeout" in e.error_type or "network" in e.error_type else 500,
            detail=e.message
        )
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"✗ Unexpected error in chat endpoint: {str(e)}", exc_info=True)
        detail_msg = str(e) if settings.DEBUG else "An unexpected error occurred. Please try again."
        raise HTTPException(
            status_code=500,
            detail=detail_msg
        )

# === Summary Endpoints ===
@app.post("/api/summarize", response_model=SummaryResponse, tags=["Summary"])
@limiter.limit(AI_RATE_LIMIT)
async def summarize_text(
    request: Request,
    summary_request: SummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium_or_quota("summarize"))
):
    """
    Generate a summary of the provided text
    
    - Uses AI to create concise summaries
    - Stores summaries in database
    - Returns summary with metadata
    - Input validated for safety
    
    Rate Limited: 20 requests per minute per client IP.
    """
    user_id = current_user.id
    
    # Input validation
    try:
        validate_non_empty_text(summary_request.text, "Text")
        validate_max_length(
            summary_request.text,
            settings.MAX_TEXT_INPUT_LENGTH,
            f"Text exceeds maximum length of {settings.MAX_TEXT_INPUT_LENGTH} characters"
        )
    except HTTPException:
        logger.warning(f"Invalid summarization input from user {user_id}")
        raise
    
    try:
        logger.info(f"Starting summarization: {len(summary_request.text)} chars")
        
        # Generate summary using AI wrapper with fallback
        summary_text = await ai_fallback_wrapper.summarize(summary_request.text)
        
        # Store in database
        summary = Summary(
            user_id=user_id,
            original_text=summary_request.text,
            summary_text=summary_text,
            title=summary_request.title or "Untitled Summary"
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
        
        logger.info(f"✓ Summarization complete: {len(summary_text)} chars output")
        
        # Track usage
        from billing import increment_usage
        increment_usage(db, current_user.id, 'summarize')
        
        return SummaryResponse(
            id=summary.id,
            summary=summary_text,
            original_length=len(summary_request.text),
            summary_length=len(summary_text),
            created_at=summary.created_at
        )
        
    except GeminiAPIError as e:
        logger.error(f"✗ Gemini API error in summarize: {e.error_type} - {e.message}")
        raise HTTPException(
            status_code=503 if "timeout" in e.error_type or "network" in e.error_type else 500,
            detail=e.message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Unexpected error in summarize endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )

@app.get("/api/summaries", response_model=List[SummaryResponse], tags=["Summary"])
async def get_summaries(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's summaries with pagination"""
    try:
        user_id = current_user.id
        logger.debug(f"Retrieving summaries: skip={skip}, limit={limit}")
        
        summaries = db.query(Summary).filter(
            Summary.user_id == user_id
        ).order_by(Summary.created_at.desc()).offset(skip).limit(limit).all()
        
        logger.info(f"✓ Retrieved {len(summaries)} summaries")
        
        return [
            SummaryResponse(
                id=s.id,
                summary=s.summary_text,
                original_length=len(s.original_text),
                summary_length=len(s.summary_text),
                created_at=s.created_at
            ) for s in summaries
        ]
    except Exception as e:
        logger.error(f"✗ Error retrieving summaries: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")


@app.post("/api/summarize/advanced", response_model=AdvancedSummaryResponse, tags=["Summary"])
@limiter.limit(AI_RATE_LIMIT)
async def summarize_text_advanced(
    request: Request,
    summary_request: AdvancedSummaryRequest,
    current_user: User = Depends(require_premium())
):
    """
    Advanced text summarization with multiple styles and comprehensive analysis
    
    - Multiple styles: extractive, abstractive, bullet_points, outline, cornell, eli5, academic, key_takeaways
    - Configurable length: brief, short, medium, long, detailed
    - Keyword extraction with TF-IDF scoring
    - Readability analysis (Flesch-Kincaid)
    - Key takeaways extraction
    - Topic identification
    - Quality metrics
    """
    from advanced_summarizer import advanced_summarizer
    
    # Input validation
    try:
        validate_non_empty_text(summary_request.text, "Text")
        validate_max_length(
            summary_request.text,
            settings.MAX_TEXT_INPUT_LENGTH,
            f"Text exceeds maximum length of {settings.MAX_TEXT_INPUT_LENGTH} characters"
        )
    except HTTPException:
        logger.warning(f"Invalid advanced summarization input from user {current_user.id}")
        raise
    
    try:
        logger.info(
            f"Starting advanced summarization: user={current_user.id}, "
            f"{len(summary_request.text)} chars, style={summary_request.style}, length={summary_request.length}"
        )
        
        result = await advanced_summarizer.summarize_advanced(
            text=summary_request.text,
            style=summary_request.style,
            length=summary_request.length,
            with_keywords=summary_request.with_keywords,
            with_outline=summary_request.with_outline,
            with_takeaways=summary_request.with_takeaways,
            preserve_citations=summary_request.preserve_citations,
            target_audience=summary_request.target_audience
        )
        
        logger.info(f"✓ Advanced summarization complete: {result.get('word_count', 0)}/{result.get('original_word_count', 0)} words")
        
        return AdvancedSummaryResponse(**result)
    
    except GeminiAPIError as e:
        logger.error(f"✗ Gemini API error in advanced summarize: {e.error_type} - {e.message}")
        raise HTTPException(
            status_code=503 if "timeout" in e.error_type or "network" in e.error_type else 500,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"✗ Error in advanced summarize endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during summarization."
        )


@app.post("/api/jobs/advanced-summary", tags=["Summary Jobs"])
@limiter.limit(AI_RATE_LIMIT)
async def enqueue_advanced_summary(
    request: Request,
    summary_request: AdvancedSummaryRequest,
    current_user: User = Depends(require_premium())
):
    """Queue advanced summary generation as a background task and return a job ID."""
    from advanced_summarizer import advanced_summarizer

    try:
        validate_non_empty_text(summary_request.text, "Text")
        validate_max_length(
            summary_request.text,
            settings.MAX_TEXT_INPUT_LENGTH,
            f"Text exceeds maximum length of {settings.MAX_TEXT_INPUT_LENGTH} characters"
        )
    except HTTPException:
        logger.warning(f"Invalid queued advanced summarization input from user {current_user.id}")
        raise

    async def task():
        return await advanced_summarizer.summarize_advanced(
            text=summary_request.text,
            style=summary_request.style,
            length=summary_request.length,
            with_keywords=summary_request.with_keywords,
            with_outline=summary_request.with_outline,
            with_takeaways=summary_request.with_takeaways,
            preserve_citations=summary_request.preserve_citations,
            target_audience=summary_request.target_audience
        )

    job_id = await job_queue.enqueue(task)
    logger.info(f"Queued advanced summary job {job_id} for user {current_user.id}")
    return {"job_id": job_id, "status": "queued"}


@app.get("/api/jobs/{job_id}", tags=["Summary Jobs"])
async def get_job_status(job_id: str, current_user: User = Depends(get_current_user)):
    """Get status and result for an async background job."""
    job = await job_queue.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


# === Notes Highlighting Endpoints ===
@app.post("/api/notes/highlight", response_model=NotesHighlightResponse, tags=["Notes"])
@limiter.limit(AI_RATE_LIMIT)
async def highlight_notes(
    request: Request,
    highlight_request: NotesHighlightRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium_or_quota("highlight"))
):
    """
    Analyze notes and highlight important concepts
    
    - Identifies key points and concepts
    - Categorizes by importance
    - Provides quick summary
    - Input validated for safety
    """
    
    # Input validation
    try:
        validate_non_empty_text(highlight_request.text, "Notes text")
        validate_max_length(
            highlight_request.text,
            settings.MAX_TEXT_INPUT_LENGTH,
            f"Notes exceed maximum length of {settings.MAX_TEXT_INPUT_LENGTH} characters"
        )
    except HTTPException:
        logger.warning(f"Invalid notes input from user {current_user.id}")
        raise
    
    try:
        logger.info(f"Starting notes highlighting: {len(highlight_request.text)} chars")
        
        result = await ai_fallback_wrapper.highlight_notes(highlight_request.text)
        
        logger.info(f"✓ Notes highlighting complete: {len(result.get('key_concepts', []))} concepts found")
        
        # Track usage
        from billing import increment_usage
        increment_usage(db, current_user.id, 'highlight')
        
        return NotesHighlightResponse(**result)
    
    except GeminiAPIError as e:
        logger.error(f"✗ Gemini API error in highlight_notes: {e.error_type} - {e.message}")
        raise HTTPException(
            status_code=503 if "timeout" in e.error_type or "network" in e.error_type else 500,
            detail=e.message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Unexpected error in highlight_notes endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )


@app.post("/api/notes/highlight/advanced", response_model=AdvancedHighlightResponse, tags=["Notes"])
@limiter.limit(AI_RATE_LIMIT)
async def highlight_notes_advanced(
    request: Request,
    highlight_request: AdvancedHighlightRequest,
    current_user: User = Depends(require_premium())
):
    """
    Advanced note highlighting with categories and analysis
    
    - Identifies key points by category (concepts, definitions, examples, etc.)
    - Provides confidence scores for each highlight
    - Tracks text positions for inline highlighting
    - Includes readability analysis and statistics
    - Supports category filtering
    """
    from advanced_highlighter import advanced_highlighter
    
    # Input validation
    try:
        validate_non_empty_text(highlight_request.text, "Notes text")
        validate_max_length(
            highlight_request.text,
            settings.MAX_TEXT_INPUT_LENGTH,
            f"Notes exceed maximum length of {settings.MAX_TEXT_INPUT_LENGTH} characters"
        )
    except HTTPException:
        logger.warning(f"Invalid advanced highlight input from user {current_user.id}")
        raise
    
    try:
        logger.info(f"Starting advanced notes highlighting: user={current_user.id}, {len(highlight_request.text)} chars")
        
        result = await advanced_highlighter.highlight_advanced(
            text=highlight_request.text,
            categories=highlight_request.categories,
            with_summary=highlight_request.with_summary
        )
        
        logger.info(f"✓ Advanced highlighting complete: {result.get('total_highlights', 0)} highlights")
        
        return AdvancedHighlightResponse(**result)
    
    except GeminiAPIError as e:
        logger.error(f"✗ Gemini API error in advanced highlight_notes: {e.error_type} - {e.message}")
        raise HTTPException(
            status_code=503 if "timeout" in e.error_type or "network" in e.error_type else 500,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"✗ Error in advanced highlight_notes endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during advanced highlighting."
        )


# === Quiz Endpoints ===
@app.post("/api/quiz/generate", response_model=QuizResponse, tags=["Quiz"])
@limiter.limit(AI_RATE_LIMIT)
async def generate_quiz(
    request: Request,
    quiz_request: QuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium_or_quota("quiz"))
):
    """
    Generate a quiz based on topic or study material
    
    - Creates multiple-choice questions
    - Adjusts difficulty level
    - Stores quiz for later review
    - Input validated for safety
    
    Rate Limited: 20 requests per minute per client IP.
    """
    user_id = current_user.id
    
    # Input validation
    try:
        validate_non_empty_text(quiz_request.topic, "Topic")
        validate_max_length(
            quiz_request.topic,
            settings.MAX_TOPIC_LENGTH,
            f"Topic exceeds maximum length of {settings.MAX_TOPIC_LENGTH} characters"
        )
        validate_range(
            quiz_request.num_questions,
            1,
            settings.MAX_NUMBER_OF_ITEMS,
            f"Number of questions must be between 1 and {settings.MAX_NUMBER_OF_ITEMS}"
        )
        validate_max_length(
            quiz_request.text,
            settings.MAX_TEXT_INPUT_LENGTH,
            f"Context text exceeds maximum length of {settings.MAX_TEXT_INPUT_LENGTH} characters"
        )
    except HTTPException:
        logger.warning(f"Invalid quiz generation input from user {user_id}")
        raise
    
    try:
        logger.info(
            f"Generating quiz: topic='{quiz_request.topic}', "
            f"questions={quiz_request.num_questions}, difficulty={quiz_request.difficulty}"
        )
        
        # Generate quiz questions using AI wrapper with fallback
        questions = await ai_fallback_wrapper.generate_quiz(
            topic=quiz_request.topic,
            num_questions=quiz_request.num_questions,
            difficulty=quiz_request.difficulty
        )
        
        # Store quiz
        quiz = Quiz(
            user_id=user_id,
            title=f"Quiz: {quiz_request.topic}",
            topic=quiz_request.topic,
            questions=questions
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        
        logger.info(f"✓ Quiz generated: {len(questions)} questions created")
        
        # Track usage
        from billing import increment_usage
        increment_usage(db, user_id, 'quiz')
        
        return QuizResponse(
            id=quiz.id,
            title=quiz.title,
            questions=[QuizQuestion(**q) for q in questions],
            created_at=quiz.created_at
        )
        
    except GeminiAPIError as e:
        logger.error(f"✗ Gemini API error in generate_quiz: {e.error_type} - {e.message}")
        raise HTTPException(
            status_code=503 if "timeout" in e.error_type or "network" in e.error_type else 500,
            detail=e.message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Unexpected error in generate_quiz endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )

@app.get("/api/quizzes", response_model=List[QuizResponse], tags=["Quiz"])
async def get_quizzes(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's quizzes with pagination"""
    try:
        user_id = current_user.id
        logger.debug(f"Retrieving quizzes: skip={skip}, limit={limit}")
        
        quizzes = db.query(Quiz).filter(
            Quiz.user_id == user_id
        ).order_by(Quiz.created_at.desc()).offset(skip).limit(limit).all()
        
        logger.info(f"✓ Retrieved {len(quizzes)} quizzes")
        
        return [
            QuizResponse(
                id=q.id,
                title=q.title,
                questions=[QuizQuestion(**question) for question in q.questions],
                created_at=q.created_at
            ) for q in quizzes
        ]
    except Exception as e:
        logger.error(f"✗ Error retrieving quizzes: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")

# === Flashcard Endpoints ===
@app.post("/api/flashcards", response_model=FlashcardResponse, tags=["Flashcards"])
async def create_flashcard(
    request: FlashcardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a single flashcard manually"""
    try:
        user_id = current_user.id
        
        flashcard = Flashcard(
            user_id=user_id,
            front=request.front,
            back=request.back,
            deck_name=request.deck_name
        )
        db.add(flashcard)
        db.commit()
        db.refresh(flashcard)
        
        logger.info(f"✓ Flashcard created: {flashcard.id}")
        
        return FlashcardResponse(
            id=flashcard.id,
            front=flashcard.front,
            back=flashcard.back,
            deck_name=flashcard.deck_name,
            created_at=flashcard.created_at,
            ease_factor=flashcard.ease_factor,
            interval=flashcard.interval
        )
        
    except Exception as e:
        logger.error(f"✗ Error creating flashcard: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )

@app.post("/api/flashcards/generate", response_model=List[FlashcardResponse], tags=["Flashcards"])
@limiter.limit(AI_RATE_LIMIT)
async def generate_flashcards(
    request: Request,
    flashcard_request: FlashcardGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium_or_quota("flashcards"))
):
    """
    Generate flashcards automatically from study material
    
    Rate Limited: 20 requests per minute per client IP.
    """
    user_id = current_user.id
    
    # Input validation
    try:
        validate_non_empty_text(flashcard_request.text, "Study material")
        validate_max_length(
            flashcard_request.text,
            settings.MAX_TEXT_INPUT_LENGTH,
            f"Study material exceeds maximum length of {settings.MAX_TEXT_INPUT_LENGTH} characters"
        )
        validate_range(
            flashcard_request.num_cards,
            1,
            settings.MAX_NUMBER_OF_ITEMS,
            f"Number of cards must be between 1 and {settings.MAX_NUMBER_OF_ITEMS}"
        )
    except HTTPException:
        logger.warning(f"Invalid flashcard generation input from user {user_id}")
        raise
    
    try:
        logger.info(
            f"Generating flashcards: {flashcard_request.num_cards} cards from {len(flashcard_request.text)} chars, "
            f"deck='{flashcard_request.deck_name}'"
        )
        
        # Generate flashcards using AI wrapper with fallback
        cards_data = await ai_fallback_wrapper.generate_flashcards(text=flashcard_request.text, num_cards=flashcard_request.num_cards)
        
        # Store in database
        flashcards = []
        for card_data in cards_data:
            flashcard = Flashcard(
                user_id=user_id,
                front=card_data.get("front", ""),
                back=card_data.get("back", ""),
                deck_name=flashcard_request.deck_name
            )
            db.add(flashcard)
            flashcards.append(flashcard)
        
        db.commit()
        
        logger.info(f"✓ Flashcards generated: {len(flashcards)} cards created")
        
        # Track usage
        from billing import increment_usage
        increment_usage(db, user_id, 'flashcards')
        
        return [
            FlashcardResponse(
                id=fc.id,
                front=fc.front,
                back=fc.back,
                deck_name=fc.deck_name,
                created_at=fc.created_at,
                ease_factor=fc.ease_factor,
                interval=fc.interval
            ) for fc in flashcards
        ]
        
    except GeminiAPIError as e:
        logger.error(f"✗ Gemini API error in generate_flashcards: {e.error_type} - {e.message}")
        raise HTTPException(
            status_code=503 if "timeout" in e.error_type or "network" in e.error_type else 500,
            detail=e.message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Unexpected error in generate_flashcards endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )

@app.get("/api/flashcards", response_model=List[FlashcardResponse], tags=["Flashcards"])
async def get_flashcards(
    deck_name: str = None, 
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's flashcards, optionally filtered by deck"""
    try:
        user_id = current_user.id
        logger.debug(f"Retrieving flashcards: deck={deck_name}, skip={skip}, limit={limit}")
        
        
        query = db.query(Flashcard).filter(Flashcard.user_id == user_id)
        
        if deck_name:
            query = query.filter(Flashcard.deck_name == deck_name)
        
        flashcards = query.order_by(Flashcard.created_at.desc()).offset(skip).limit(limit).all()
        
        logger.info(f"✓ Retrieved {len(flashcards)} flashcards")
        
        return [
            FlashcardResponse(
                id=fc.id,
                front=fc.front,
                back=fc.back,
                deck_name=fc.deck_name,
                created_at=fc.created_at,
                ease_factor=fc.ease_factor,
                interval=fc.interval
            ) for fc in flashcards
        ]
    except Exception as e:
        logger.error(f"✗ Error retrieving flashcards: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again.")

# === Analytics Endpoints ===

@app.post("/api/flashcards/{flashcard_id}/review", response_model=FlashcardResponse, tags=["Flashcards"])
async def review_flashcard(
    flashcard_id: int,
    review: FlashcardReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update flashcard spaced repetition data after a review.
    Uses SM-2 algorithm: quality 0-5 (0=blackout, 5=perfect).
    """
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id
    ).first()
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    q = review.quality
    # SM-2 algorithm
    if q < 3:
        flashcard.interval = 1
    elif flashcard.interval == 1:
        flashcard.interval = 6
    else:
        flashcard.interval = round(flashcard.interval * flashcard.ease_factor)

    flashcard.ease_factor = max(1.3, flashcard.ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    flashcard.last_reviewed = datetime.utcnow()
    db.commit()
    db.refresh(flashcard)

    logger.info(f"Flashcard {flashcard_id} reviewed: quality={q}, new_interval={flashcard.interval}")
    return FlashcardResponse(
        id=flashcard.id,
        front=flashcard.front,
        back=flashcard.back,
        deck_name=flashcard.deck_name,
        created_at=flashcard.created_at,
        ease_factor=flashcard.ease_factor,
        interval=flashcard.interval
    )

@app.get("/api/analytics", response_model=AnalyticsResponse, tags=["Analytics"])
async def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(require_premium())):
    """
    Get user's study analytics and statistics
    
    - Total study metrics
    - Weekly progress data
    - Productivity score
    - Study streak
    """
    try:
        user_id = current_user.id
        
        logger.info(f"Retrieving analytics for user {user_id}")
        
        # Get analytics for the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        analytics = db.query(Analytics).filter(
            Analytics.user_id == user_id,
            Analytics.date >= thirty_days_ago
        ).all()
        
        # Calculate totals
        total_study_time = sum(a.study_time_minutes for a in analytics)
        questions_answered = sum(a.questions_answered for a in analytics)
        quizzes_completed = sum(a.quizzes_completed for a in analytics)
        flashcards_reviewed = sum(a.flashcards_reviewed for a in analytics)
        summaries_generated = sum(a.summaries_generated for a in analytics)
        
        # Weekly progress (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        weekly_data = db.query(Analytics).filter(
            Analytics.user_id == user_id,
            Analytics.date >= seven_days_ago
        ).order_by(Analytics.date).all()
        
        weekly_progress = [
            {
                "date": a.date.strftime("%Y-%m-%d"),
                "study_time": a.study_time_minutes,
                "activities": a.questions_answered + a.quizzes_completed + a.flashcards_reviewed
            } for a in weekly_data
        ]
        
        # Calculate productivity score (0-100)
        productivity_score = min(100, (total_study_time // 10) + (questions_answered // 5))
        
        # Calculate streak (consecutive days with activity)
        streak_days = 0
        current_date = datetime.utcnow().date()
        while streak_days <= 365:
            day_start = datetime(current_date.year, current_date.month, current_date.day)
            day_end = day_start + timedelta(days=1)
            day_activity = db.query(Analytics).filter(
                Analytics.user_id == user_id,
                Analytics.date >= day_start,
                Analytics.date < day_end
            ).first()
            
            if day_activity and day_activity.study_time_minutes > 0:
                streak_days += 1
                current_date -= timedelta(days=1)
            else:
                break
        
        logger.info(f"✓ Analytics retrieved: streak={streak_days}d, score={productivity_score}")
        
        return AnalyticsResponse(
            total_study_time=total_study_time,
            questions_answered=questions_answered,
            quizzes_completed=quizzes_completed,
            flashcards_reviewed=flashcards_reviewed,
            summaries_generated=summaries_generated,
            weekly_progress=weekly_progress,
            productivity_score=productivity_score,
            streak_days=streak_days
        )
        
    except Exception as e:
        logger.error(f"✗ Error retrieving analytics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )


@app.get("/api/analytics/insights", tags=["Analytics"])
async def get_analytics_insights(db: Session = Depends(get_db), current_user: User = Depends(require_premium())):
    """Return actionable, user-facing study insights derived from recent analytics."""
    try:
        user_id = current_user.id
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        entries = db.query(Analytics).filter(
            Analytics.user_id == user_id,
            Analytics.date >= seven_days_ago
        ).all()

        total_minutes = sum(e.study_time_minutes for e in entries)
        active_days = len([e for e in entries if e.study_time_minutes > 0])
        avg_daily = round(total_minutes / max(active_days, 1), 1)

        suggestions = []
        if active_days < 3:
            suggestions.append("Try 3 short study sessions this week to build consistency.")
        if avg_daily < 25:
            suggestions.append("Aim for at least 25 focused minutes per active day.")
        if not suggestions:
            suggestions.append("Great consistency. Increase quiz difficulty for faster growth.")

        return {
            "window_days": 7,
            "total_minutes": total_minutes,
            "active_days": active_days,
            "avg_active_day_minutes": avg_daily,
            "suggestions": suggestions,
        }
    except Exception as e:
        logger.error(f"✗ Error retrieving analytics insights: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while building insights.")

@app.post("/api/quiz/generate/advanced", response_model=AdvancedQuizResponse, tags=["Advanced Tools"])
@limiter.limit(AI_RATE_LIMIT)
async def generate_advanced_quiz(
    request: Request,
    current_user: User = Depends(require_premium())
):
    """Advanced quiz generation with multiple question types.

    This endpoint intentionally accepts either snake_case or camelCase JSON
    keys so older frontend builds and ad hoc API clients continue to work.
    """
    try:
        payload = await request.json()
        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="Request body must be a JSON object")

        normalized_payload = {
            "topic": payload.get("topic") or payload.get("subject") or payload.get("prompt"),
            "num_questions": payload.get("num_questions", payload.get("numQuestions", 10)),
            "difficulty": payload.get("difficulty", "medium"),
            "question_types": payload.get("question_types", payload.get("questionTypes")),
            "with_hints": payload.get("with_hints", payload.get("withHints", True)),
            "with_explanations": payload.get("with_explanations", payload.get("withExplanations", True)),
            "with_takeaways": payload.get("with_takeaways", payload.get("withTakeaways", False)),
            "adaptive_difficulty": payload.get("adaptive_difficulty", payload.get("adaptiveDifficulty", True)),
            "bloom_level": payload.get("bloom_level", payload.get("bloomLevel")),
            "time_limit_minutes": payload.get("time_limit_minutes", payload.get("timeLimitMinutes")),
            "shuffle_questions": payload.get("shuffle_questions", payload.get("shuffleQuestions", True)),
            "shuffle_options": payload.get("shuffle_options", payload.get("shuffleOptions", True)),
        }

        try:
            quiz_request = AdvancedQuizRequest.model_validate(normalized_payload)
        except Exception as validation_error:
            logger.warning(
                "Advanced quiz validation failed: payload_keys=%s error=%s",
                sorted(list(payload.keys())),
                validation_error,
            )
            raise HTTPException(
                status_code=422,
                detail="Invalid quiz request. Required field: topic. Accepted keys: topic/subject/prompt, num_questions/numQuestions, question_types/questionTypes, with_hints/withHints, with_explanations/withExplanations, with_takeaways/withTakeaways, adaptive_difficulty/adaptiveDifficulty, bloom_level/bloomLevel, time_limit_minutes/timeLimitMinutes, shuffle_questions/shuffleQuestions, shuffle_options/shuffleOptions."
            )

        validate_non_empty_text(quiz_request.topic, "Topic")
        validate_max_length(
            quiz_request.topic,
            settings.MAX_TOPIC_LENGTH,
            f"Topic exceeds maximum length of {settings.MAX_TOPIC_LENGTH} characters"
        )
        validate_range(
            quiz_request.num_questions,
            1,
            settings.MAX_NUMBER_OF_ITEMS,
            f"Number of questions must be between 1 and {settings.MAX_NUMBER_OF_ITEMS}"
        )

        logger.info(
            f"🎯 Advanced quiz generation: user={current_user.id}, topic='{quiz_request.topic}', "
            f"num={quiz_request.num_questions}, difficulty={quiz_request.difficulty}"
        )
        
        from advanced_quiz_generator import advanced_quiz_generator
        result = await advanced_quiz_generator.generate_advanced_quiz(
            topic=quiz_request.topic,
            num_questions=quiz_request.num_questions,
            difficulty=quiz_request.difficulty,
            question_types=quiz_request.question_types,
            with_hints=quiz_request.with_hints,
            with_explanations=quiz_request.with_explanations
        )
        
        logger.info(f"✓ Advanced quiz generated: {result['total_questions']} questions, {result['estimated_time_minutes']}min estimated")
        return result
        
    except GeminiAPIError as e:
        logger.error(f"✗ Gemini API error in advanced quiz generation: {e.error_type} - {e.message}")
        raise HTTPException(
            status_code=503 if "timeout" in e.error_type or "network" in e.error_type else 500,
            detail=e.message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"✗ Error generating advanced quiz: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during quiz generation.")


@app.get("/api/analytics/dashboard", response_model=AnalyticsDashboardResponse, tags=["Advanced Analytics"])
async def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium())
):
    """Get comprehensive dashboard analytics"""
    try:
        user_id = current_user.id
        logger.info(f"📈 Getting dashboard analytics for user {user_id}")
        
        from study_analytics_engine import study_analytics_engine
        result = await study_analytics_engine.get_dashboard_analytics(user_id, db)
        
        logger.info(f"✓ Dashboard analytics retrieved")
        return result
        
    except Exception as e:
        logger.error(f"✗ Error getting dashboard analytics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during analytics retrieval.")


@app.get("/api/analytics", tags=["Advanced Analytics"])
async def get_analytics_records(
    limit: int = 50,
    offset: int = 0,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated analytics records for the current user."""
    try:
        user_id = current_user.id
        query = db.query(Analytics).filter(Analytics.user_id == user_id)

        if start_date:
            query = query.filter(Analytics.date >= start_date)
        if end_date:
            query = query.filter(Analytics.date <= end_date)

        total = query.count()
        rows = query.order_by(Analytics.date.desc()).offset(offset).limit(limit).all()

        items = [
            {
                "id": row.id,
                "user_id": row.user_id,
                "date": row.date,
                "study_time_minutes": row.study_time_minutes,
                "questions_answered": row.questions_answered,
                "quizzes_completed": row.quizzes_completed,
                "flashcards_reviewed": row.flashcards_reviewed,
                "summaries_generated": row.summaries_generated,
            }
            for row in rows
        ]

        return {
            "items": items,
            "total": total,
            "limit": limit,
            "offset": offset,
            "start_date": start_date,
            "end_date": end_date,
        }
    except Exception as e:
        logger.error(f"✗ Error getting analytics records: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while loading analytics.")


@app.get("/api/analytics/performance", response_model=AnalyticsPerformanceResponse, tags=["Advanced Analytics"])
async def get_performance_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium())
):
    """Get detailed performance analytics"""
    try:
        user_id = current_user.id
        logger.info(f"📊 Getting performance analytics for user {user_id}")
        
        from study_analytics_engine import study_analytics_engine
        result = await study_analytics_engine.get_performance_analytics(user_id, db)
        
        logger.info(f"✓ Performance analytics retrieved")
        return result
        
    except Exception as e:
        logger.error(f"✗ Error getting performance analytics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during performance analytics retrieval.")


@app.get("/api/analytics/trends", response_model=AnalyticsTrendsResponse, tags=["Advanced Analytics"])
async def get_analytics_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium())
):
    """Get learning trends and patterns"""
    try:
        user_id = current_user.id
        logger.info(f"📉 Getting trend analytics for user {user_id}")
        
        from study_analytics_engine import study_analytics_engine
        result = await study_analytics_engine.get_trends(user_id, db)
        
        logger.info(f"✓ Trend analytics retrieved")
        return result
        
    except Exception as e:
        logger.error(f"✗ Error getting trends: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during trend analytics retrieval.")

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("AI Study Assistant - Agent Backend")
    print("=" * 60)
    print("RECOMMENDED: Run via server.py for proper configuration")
    print("  python server.py")
    print("OR:")
    print("  uvicorn main:app --host 0.0.0.0 --port 8000")
    print("=" * 60)
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        log_level="info"
    )
