"""HTTPS Redirect Middleware

In production, this middleware automatically redirects HTTP requests to HTTPS.
This requires a reverse proxy (Nginx, Apache, etc.) to handle the actual SSL/TLS termination.

When deployed:
1. Nginx/Apache listens on port 80 (HTTP) and 443 (HTTPS)
2. The application runs on port 8000 (internal)
3. Nginx forwards requests with X-Forwarded-Proto header
4. This middleware checks that header and redirects if needed

Example Nginx configuration:
    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl;
        server_name yourdomain.com;
        ssl_certificate /path/to/cert.pem;
        ssl_certificate_key /path/to/key.pem;
        
        location / {
            proxy_pass http://localhost:8000;
            proxy_set_header X-Forwarded-Proto https;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header Host $host;
        }
    }
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse
import logging

logger = logging.getLogger(__name__)


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """
    Middleware to redirect HTTP to HTTPS in production.
    
    This checks the X-Forwarded-Proto header (set by reverse proxy)
    and redirects to HTTPS if the original request was HTTP.
    
    Note: This only works with a reverse proxy that sets X-Forwarded-Proto.
    Direct HTTP requests to the app will not be redirected.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Check X-Forwarded-Proto header (set by reverse proxy like Nginx)
        forwarded_proto = request.headers.get("x-forwarded-proto", "http")
        
        if forwarded_proto == "http":
            # Redirect to HTTPS
            url = request.url.replace(scheme="https")
            logger.debug(f"Redirecting HTTP request to HTTPS: {request.url.path}")
            return RedirectResponse(url=url, status_code=301)
        
        # Continue with the request
        return await call_next(request)
