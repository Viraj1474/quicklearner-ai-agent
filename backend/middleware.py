"""
Backend Middleware: Rate Limiting, Caching, Request Logging
Provides production-ready middleware for the AI Study Assistant API.
"""
import time
import logging
import hashlib
import json
from typing import Callable, Optional
from datetime import datetime, timedelta
from functools import wraps
import uuid

from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from cachetools import TTLCache
from config import settings

# Configure logging
logger = logging.getLogger("middleware")

# ============================================================
# RATE LIMITER CONFIGURATION
# ============================================================

# Create limiter instance - uses client IP for rate limiting
limiter = Limiter(key_func=get_remote_address)

# Rate limit defaults (can be overridden per-endpoint)
DEFAULT_RATE_LIMIT = "60/minute"  # 60 requests per minute
CHAT_RATE_LIMIT = "30/minute"     # 30 chat requests per minute
AI_RATE_LIMIT = "20/minute"       # 20 AI-heavy requests per minute

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded errors"""
    logger.warning(f"Rate limit exceeded for {get_remote_address(request)}: {exc.detail}")
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please slow down.",
            "detail": str(exc.detail),
            "retry_after": "60 seconds"
        }
    )


# ============================================================
# RESPONSE CACHE
# ============================================================

# TTL Cache: max 1000 items, 5 minute TTL
response_cache = TTLCache(maxsize=1000, ttl=300)

# Cache statistics
cache_stats = {
    "hits": 0,
    "misses": 0,
    "total_requests": 0
}

def get_cache_key(request: Request, body: Optional[bytes] = None) -> str:
    """Generate a cache key from request path and body"""
    key_parts = [
        request.method,
        request.url.path,
        str(sorted(request.query_params.items()))
    ]
    if body:
        key_parts.append(hashlib.md5(body).hexdigest())
    return ":".join(key_parts)

def cached_response(ttl_seconds: int = 300, cache_post: bool = False):
    """
    Decorator to cache endpoint responses.
    
    Args:
        ttl_seconds: Time-to-live for cached responses
        cache_post: Whether to cache POST requests (default False)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get('request') or (args[0] if args else None)
            
            # Only cache GET requests by default
            if request and request.method == "GET":
                cache_key = get_cache_key(request)
                
                # Check cache
                if cache_key in response_cache:
                    cache_stats["hits"] += 1
                    logger.debug(f"Cache HIT: {cache_key}")
                    return response_cache[cache_key]
                
                cache_stats["misses"] += 1
                
            cache_stats["total_requests"] += 1
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            if request and request.method == "GET":
                response_cache[cache_key] = result
                logger.debug(f"Cached: {cache_key}")
            
            return result
        return wrapper
    return decorator

def get_cache_stats() -> dict:
    """Get cache statistics"""
    hit_rate = 0
    if cache_stats["total_requests"] > 0:
        hit_rate = (cache_stats["hits"] / cache_stats["total_requests"]) * 100
    
    return {
        "hits": cache_stats["hits"],
        "misses": cache_stats["misses"],
        "total_requests": cache_stats["total_requests"],
        "hit_rate_percent": round(hit_rate, 2),
        "cache_size": len(response_cache),
        "max_size": response_cache.maxsize
    }

def clear_cache():
    """Clear the response cache"""
    response_cache.clear()
    logger.info("Response cache cleared")


# ============================================================
# REQUEST LOGGING MIDDLEWARE
# ============================================================

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all incoming requests with timing information.
    Useful for debugging, monitoring, and performance analysis.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID (or honor upstream header)
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Record start time
        start_time = time.time()
        
        # Get client info
        client_ip = get_remote_address(request)
        method = request.method
        path = request.url.path
        
        # Log incoming request in structured form
        logger.info(json.dumps({
            "event": "request_start",
            "request_id": request_id,
            "method": method,
            "path": path,
            "client_ip": client_ip,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Log response
            status = response.status_code
            log_level = logging.INFO if status < 400 else logging.WARNING
            logger.log(log_level, json.dumps({
                "event": "request_end",
                "request_id": request_id,
                "status_code": status,
                "duration_ms": round(duration_ms, 1),
                "timestamp": datetime.utcnow().isoformat()
            }))
            
            # Add timing header
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{duration_ms:.1f}ms"
            
            return response
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(json.dumps({
                "event": "request_error",
                "request_id": request_id,
                "duration_ms": round(duration_ms, 1),
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }))
            raise


# ============================================================
# REQUEST STATISTICS
# ============================================================

# Track request statistics
request_stats = {
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "endpoints": {},
    "latency_ms_total": 0.0,
    "latency_ms_count": 0,
    "start_time": datetime.utcnow().isoformat()
}

class RequestStatsMiddleware(BaseHTTPMiddleware):
    """Middleware to track request statistics"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        start_time = time.time()
        
        # Update total
        request_stats["total_requests"] += 1
        
        # Track per-endpoint
        if path not in request_stats["endpoints"]:
            request_stats["endpoints"][path] = {"count": 0, "errors": 0}
        request_stats["endpoints"][path]["count"] += 1
        
        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000
            request_stats["latency_ms_total"] += duration_ms
            request_stats["latency_ms_count"] += 1
            
            if response.status_code < 400:
                request_stats["successful_requests"] += 1
            else:
                request_stats["failed_requests"] += 1
                request_stats["endpoints"][path]["errors"] += 1
            
            return response
            
        except Exception as e:
            request_stats["failed_requests"] += 1
            request_stats["endpoints"][path]["errors"] += 1
            raise

def get_request_stats() -> dict:
    """Get request statistics"""
    uptime = datetime.utcnow() - datetime.fromisoformat(request_stats["start_time"])
    
    # Calculate requests per minute
    total_minutes = uptime.total_seconds() / 60
    rpm = request_stats["total_requests"] / max(total_minutes, 1)
    
    # Get top endpoints
    top_endpoints = sorted(
        request_stats["endpoints"].items(),
        key=lambda x: x[1]["count"],
        reverse=True
    )[:10]
    
    return {
        "total_requests": request_stats["total_requests"],
        "successful_requests": request_stats["successful_requests"],
        "failed_requests": request_stats["failed_requests"],
        "success_rate_percent": round(
            (request_stats["successful_requests"] / max(request_stats["total_requests"], 1)) * 100, 2
        ),
        "requests_per_minute": round(rpm, 2),
        "avg_latency_ms": round(
            request_stats["latency_ms_total"] / max(request_stats["latency_ms_count"], 1),
            2
        ),
        "uptime_seconds": int(uptime.total_seconds()),
        "top_endpoints": dict(top_endpoints)
    }


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add baseline security headers to all responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        if settings.ENABLE_SECURITY_HEADERS:
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
            if request.url.scheme == "https":
                response.headers["Strict-Transport-Security"] = f"max-age={settings.HSTS_MAX_AGE_SECONDS}; includeSubDomains"
        return response


# ============================================================
# CORS PREFLIGHT CACHE
# ============================================================

class CORSPreflightCacheMiddleware(BaseHTTPMiddleware):
    """
    Cache CORS preflight responses to reduce OPTIONS request overhead.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method == "OPTIONS":
            # Return cached preflight response
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                    "Access-Control-Max-Age": "86400",  # Cache for 24 hours
                }
            )
        return await call_next(request)
