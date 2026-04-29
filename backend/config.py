import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

class Settings:
    """Application settings and configuration"""
    
    # API Keys - Use GEMINI_API_KEY (not GOOGLE_API_KEY)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    
    # Hugging Face API Key
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    
    # AI Provider (primary): "gemini" or "huggingface"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")
    # AI Fallback Provider (used if primary fails): "gemini" or "huggingface"
    AI_FALLBACK_PROVIDER: str = os.getenv("AI_FALLBACK_PROVIDER", "huggingface")
    # Gemini model name (e.g. gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-pro)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    # Hugging Face model name (e.g. Qwen/Qwen2.5-72B-Instruct, meta-llama/Llama-3.3-70B-Instruct)
    HUGGINGFACE_MODEL: str = os.getenv("HUGGINGFACE_MODEL", "Qwen/Qwen2.5-72B-Instruct")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ai_agent.db")
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # CORS
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://localhost:3001"
    ).split(",")
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-use-64-chars-random-string")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_HOURS", 24))

    # Developer access
    ALLOWED_DEVELOPER_EMAILS: list = [
        email.strip().lower()
        for email in os.getenv("ALLOWED_DEVELOPER_EMAILS", "virajkulye1474@gmail.com").split(",")
        if email.strip()
    ]
    
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    
    # Email Configuration (for password reset, verification emails)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@quicklearner.com")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Quicklearner")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() == "true"
    
    # Frontend URL (for password reset links, etc.)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Rate limiting
    MAX_REQUESTS_PER_MINUTE: int = int(os.getenv("MAX_REQUESTS_PER_MINUTE", 60))

    # Billing / premium plans
    PREMIUM_MONTHLY_PRICE_CENTS: int = int(os.getenv("PREMIUM_MONTHLY_PRICE_CENTS", 1499))
    PREMIUM_YEARLY_PRICE_CENTS: int = int(os.getenv("PREMIUM_YEARLY_PRICE_CENTS", 11999))
    BILLING_PROVIDER: str = os.getenv("BILLING_PROVIDER", "manual")
    FREE_PREMIUM_DAILY_QUOTA: int = int(os.getenv("FREE_PREMIUM_DAILY_QUOTA", 3))

    # Stripe billing
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    STRIPE_PRICE_ID_MONTHLY: str = os.getenv("STRIPE_PRICE_ID_MONTHLY", os.getenv("STRIPE_MONTHLY_PRICE_ID", ""))
    STRIPE_PRICE_ID_YEARLY: str = os.getenv("STRIPE_PRICE_ID_YEARLY", os.getenv("STRIPE_YEARLY_PRICE_ID", ""))
    STRIPE_MONTHLY_PRICE_ID: str = STRIPE_PRICE_ID_MONTHLY
    STRIPE_YEARLY_PRICE_ID: str = STRIPE_PRICE_ID_YEARLY
    STRIPE_SUCCESS_URL: str = os.getenv("STRIPE_SUCCESS_URL", "http://localhost:3000/?billing=success")
    STRIPE_CANCEL_URL: str = os.getenv("STRIPE_CANCEL_URL", "http://localhost:3000/?billing=cancelled")
    STRIPE_PORTAL_RETURN_URL: str = os.getenv("STRIPE_PORTAL_RETURN_URL", "http://localhost:3000/profile")

    # Plan behavior
    DEFAULT_TRIAL_DAYS: int = int(os.getenv("DEFAULT_TRIAL_DAYS", 7))
    YEARLY_DISCOUNT_PERCENT: int = int(os.getenv("YEARLY_DISCOUNT_PERCENT", 40))

    # Razorpay billing
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    # INR amounts are in paise (e.g. 138700 = INR 1387.00)
    RAZORPAY_MONTHLY_PRICE_PAISE: int = int(os.getenv("RAZORPAY_MONTHLY_PRICE_PAISE", 138700))
    RAZORPAY_YEARLY_PRICE_PAISE: int = int(os.getenv("RAZORPAY_YEARLY_PRICE_PAISE", 1110250))

    # Auth/session security
    REFRESH_TOKEN_REUSE_REVOKE_ALL: bool = os.getenv("REFRESH_TOKEN_REUSE_REVOKE_ALL", "True").lower() == "true"
    
    # AI Service Settings (Stability & Reliability)
    # Timeout for Gemini API calls (15-20 second range for safety)
    GEMINI_TIMEOUT_SECONDS: int = int(os.getenv("GEMINI_TIMEOUT_SECONDS", 18))
    AI_RETRY_ATTEMPTS: int = int(os.getenv("AI_RETRY_ATTEMPTS", 2))
    AI_RETRY_BASE_DELAY_SECONDS: float = float(os.getenv("AI_RETRY_BASE_DELAY_SECONDS", 0.8))
    AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD: int = int(os.getenv("AI_CIRCUIT_BREAKER_FAILURE_THRESHOLD", 3))
    AI_CIRCUIT_BREAKER_COOLDOWN_SECONDS: int = int(os.getenv("AI_CIRCUIT_BREAKER_COOLDOWN_SECONDS", 45))

    # Security headers and transport policy
    ENABLE_SECURITY_HEADERS: bool = os.getenv("ENABLE_SECURITY_HEADERS", "True").lower() == "true"
    HSTS_MAX_AGE_SECONDS: int = int(os.getenv("HSTS_MAX_AGE_SECONDS", 31536000))
    
    # Input size limits to prevent overwhelming the API
    MAX_CHAT_MESSAGE_LENGTH: int = 5000
    MAX_TEXT_INPUT_LENGTH: int = 50000
    MAX_TOPIC_LENGTH: int = 200
    MAX_NUMBER_OF_ITEMS: int = 50  # For quizzes, flashcards, etc.
    
    # Logging configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        case_sensitive = True

settings = Settings()

# Configure logging for application
def setup_logging():
    """Initialize logging configuration"""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('backend.log', encoding='utf-8')
        ]
    )
    # Silence noisy third-party loggers
    for noisy in ("sqlalchemy.engine", "sqlalchemy.pool", "httpx", "google_genai", "google.auth"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
    return logging.getLogger(__name__)
