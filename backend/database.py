from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, JSON, ForeignKey, Boolean, Enum as SQLEnum, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

from config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=False
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Database dependency for FastAPI
def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===== USER ROLE ENUM =====
class UserRole(str, enum.Enum):
    """User roles for access control"""
    USER = "user"
    CLIENT = "client"
    ADMIN = "admin"


# ===== OAUTH PROVIDER ENUM =====
class OAuthProvider(str, enum.Enum):
    """Supported OAuth providers"""
    GOOGLE = "google"
    GITHUB = "github"
    LOCAL = "local"


class SubscriptionStatus(str, enum.Enum):
    """Subscription lifecycle states"""
    FREE = "free"
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    EXPIRED = "expired"


class BillingCycle(str, enum.Enum):
    """Supported billing cycles"""
    MONTHLY = "monthly"
    YEARLY = "yearly"


class SubscriptionTier(str, enum.Enum):
    """Top-level subscription tiers"""
    FREE = "free"
    PREMIUM = "premium"


class PlanId(str, enum.Enum):
    """Public plan identifiers used across billing and frontend."""
    FREE = "free"
    PRO_MONTHLY = "pro_monthly"
    PRO_YEARLY = "pro_yearly"
    TEAM = "team"


# Models
class User(Base):
    """User model for storing user information"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    profile_picture = Column(String(500), nullable=True)
    role = Column(String(20), default=UserRole.USER.value)
    auth_provider = Column(String(20), default=OAuthProvider.LOCAL.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    subscription_tier = Column(String(20), default=SubscriptionTier.FREE.value)
    billing_cycle = Column(String(20), nullable=True)
    subscription_status = Column(String(20), default=SubscriptionStatus.FREE.value)
    subscription_provider = Column(String(20), default="manual")
    subscription_started_at = Column(DateTime, nullable=True)
    subscription_ends_at = Column(DateTime, nullable=True)
    subscription_canceled_at = Column(DateTime, nullable=True)
    plan = Column(String(30), default=PlanId.FREE.value, index=True)
    trial_ends_at = Column(DateTime, nullable=True)
    stripe_price_id = Column(String(255), nullable=True)
    next_billing_date = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)
    active_until = Column(DateTime, nullable=True)
    last_seen_upgrade_prompt_at = Column(DateTime, nullable=True)
    upgrade_prompt_count = Column(Integer, default=0)
    payment_provider = Column(String(40), default="stripe")
    razorpay_customer_id = Column(String(255), nullable=True, index=True)
    razorpay_order_id = Column(String(255), nullable=True, index=True)
    razorpay_payment_id = Column(String(255), nullable=True, index=True)
    country = Column(String(2), nullable=True)
    last_payment_amount_cents = Column(Integer, nullable=True)
    last_payment_currency = Column(String(10), nullable=True)
    last_payment_at = Column(DateTime, nullable=True)
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True, unique=True, index=True)
    stripe_checkout_session_id = Column(String(255), nullable=True, unique=True, index=True)
    
    # Relationships
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    summaries = relationship("Summary", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="user", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="user", cascade="all, delete-orphan")
    oauth_accounts = relationship("OAuthAccount", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    usage_events = relationship("UserUsage", back_populates="user", cascade="all, delete-orphan")
    premium_events = relationship("PremiumAnalyticsEvent", back_populates="user", cascade="all, delete-orphan")
    billing_history = relationship("BillingHistory", back_populates="user", cascade="all, delete-orphan")

    @property
    def is_premium(self):
        """Compute whether the user currently has an active premium subscription."""
        if self.subscription_tier != SubscriptionTier.PREMIUM.value:
            return False
        if self.subscription_status != SubscriptionStatus.ACTIVE.value:
            return False
        if self.subscription_ends_at and self.subscription_ends_at < datetime.utcnow():
            return False
        return True


class OAuthAccount(Base):
    """OAuth account linking for users"""
    __tablename__ = "oauth_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String(20), nullable=False)  # google, github, etc.
    provider_user_id = Column(String(255), nullable=False)  # ID from the provider
    provider_email = Column(String(100), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="oauth_accounts")
    
    # Unique constraint on provider + provider_user_id
    __table_args__ = (
        # Create a unique index for provider + provider_user_id combination
    )


class PasswordResetToken(Base):
    """Password reset tokens for forgot password functionality"""
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="password_reset_tokens")


class RefreshToken(Base):
    """Refresh tokens for JWT authentication"""
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    device_info = Column(String(500), nullable=True)  # Store device/browser info
    
    user = relationship("User", back_populates="refresh_tokens")


class UsageQuota(Base):
    """Track per-user daily premium usage for free-tier limits."""
    __tablename__ = "usage_quotas"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    usage_scope = Column(String(50), nullable=False, index=True)
    usage_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    used_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserUsage(Base):
    """Track per-user, per-feature daily usage and month bucket usage."""
    __tablename__ = "user_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    feature_name = Column(String(50), nullable=False, index=True)
    count = Column(Integer, default=0)
    usage_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    usage_month = Column(String(7), nullable=False, index=True)  # YYYY-MM
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="usage_events")


class PremiumAnalyticsEvent(Base):
    """Track premium-conversion and billing events for analytics."""
    __tablename__ = "premium_analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    event_name = Column(String(80), nullable=False, index=True)
    event_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="premium_events")


class BillingHistory(Base):
    """Store lightweight payment history rows for profile billing views."""
    __tablename__ = "billing_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String(30), nullable=False)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(10), nullable=False, default="USD")
    status = Column(String(30), nullable=False, default="paid")
    external_invoice_id = Column(String(255), nullable=True)
    external_payment_id = Column(String(255), nullable=True)
    invoice_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="billing_history")

class ChatSession(Base):
    """Store chat sessions"""
    __tablename__ = "chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    """Store individual chat messages"""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    content = Column(Text, nullable=False)
    sender = Column(String(10), nullable=False)  # 'user' or 'ai'
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("ChatSession", back_populates="messages")

class Summary(Base):
    """Store generated summaries"""
    __tablename__ = "summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_text = Column(Text, nullable=False)
    summary_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    title = Column(String(200))
    
    user = relationship("User", back_populates="summaries")

class Quiz(Base):
    """Store generated quizzes"""
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    topic = Column(String(200))
    questions = Column(JSON, nullable=False)  # Store as JSON array
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="quizzes")

class Flashcard(Base):
    """Store flashcards"""
    __tablename__ = "flashcards"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    deck_name = Column(String(100), default="Default")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_reviewed = Column(DateTime)
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=1)
    
    user = relationship("User", back_populates="flashcards")

class Analytics(Base):
    """Store user analytics and study metrics"""
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    study_time_minutes = Column(Integer, default=0)
    questions_answered = Column(Integer, default=0)
    quizzes_completed = Column(Integer, default=0)
    flashcards_reviewed = Column(Integer, default=0)
    summaries_generated = Column(Integer, default=0)
    
    user = relationship("User", back_populates="analytics")

# Create all tables
def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    _ensure_subscription_columns()
    print("Database initialized successfully!")


def _ensure_subscription_columns():
    """Backfill subscription columns for existing SQLite databases."""
    if "sqlite" not in settings.DATABASE_URL.lower():
        return

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    migrations = {
        # Core user profile/auth columns from the extended auth model.
        "first_name": "ALTER TABLE users ADD COLUMN first_name VARCHAR(50)",
        "last_name": "ALTER TABLE users ADD COLUMN last_name VARCHAR(50)",
        "profile_picture": "ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500)",
        "role": "ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'",
        "auth_provider": "ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'local'",
        "updated_at": "ALTER TABLE users ADD COLUMN updated_at DATETIME",
        "is_active": "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1",
        "is_verified": "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0",
        "last_login": "ALTER TABLE users ADD COLUMN last_login DATETIME",

        # Subscription/billing evolution columns.
        "subscription_tier": "ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free'",
        "billing_cycle": "ALTER TABLE users ADD COLUMN billing_cycle VARCHAR(20)",
        "subscription_status": "ALTER TABLE users ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'free'",
        "subscription_provider": "ALTER TABLE users ADD COLUMN subscription_provider VARCHAR(20) DEFAULT 'manual'",
        "subscription_started_at": "ALTER TABLE users ADD COLUMN subscription_started_at DATETIME",
        "subscription_ends_at": "ALTER TABLE users ADD COLUMN subscription_ends_at DATETIME",
        "subscription_canceled_at": "ALTER TABLE users ADD COLUMN subscription_canceled_at DATETIME",
        "plan": "ALTER TABLE users ADD COLUMN plan VARCHAR(30) DEFAULT 'free'",
        "trial_ends_at": "ALTER TABLE users ADD COLUMN trial_ends_at DATETIME",
        "stripe_price_id": "ALTER TABLE users ADD COLUMN stripe_price_id VARCHAR(255)",
        "next_billing_date": "ALTER TABLE users ADD COLUMN next_billing_date DATETIME",
        "cancel_at_period_end": "ALTER TABLE users ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT 0",
        "active_until": "ALTER TABLE users ADD COLUMN active_until DATETIME",
        "last_seen_upgrade_prompt_at": "ALTER TABLE users ADD COLUMN last_seen_upgrade_prompt_at DATETIME",
        "upgrade_prompt_count": "ALTER TABLE users ADD COLUMN upgrade_prompt_count INTEGER DEFAULT 0",
        "payment_provider": "ALTER TABLE users ADD COLUMN payment_provider VARCHAR(40) DEFAULT 'stripe'",
        "razorpay_customer_id": "ALTER TABLE users ADD COLUMN razorpay_customer_id VARCHAR(255)",
        "razorpay_order_id": "ALTER TABLE users ADD COLUMN razorpay_order_id VARCHAR(255)",
        "razorpay_payment_id": "ALTER TABLE users ADD COLUMN razorpay_payment_id VARCHAR(255)",
        "country": "ALTER TABLE users ADD COLUMN country VARCHAR(2)",
        "last_payment_amount_cents": "ALTER TABLE users ADD COLUMN last_payment_amount_cents INTEGER",
        "last_payment_currency": "ALTER TABLE users ADD COLUMN last_payment_currency VARCHAR(10)",
        "last_payment_at": "ALTER TABLE users ADD COLUMN last_payment_at DATETIME",
        "stripe_customer_id": "ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255)",
        "stripe_subscription_id": "ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255)",
        "stripe_checkout_session_id": "ALTER TABLE users ADD COLUMN stripe_checkout_session_id VARCHAR(255)",
    }

    with engine.begin() as connection:
        for column_name, statement in migrations.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))

if __name__ == "__main__":
    init_db()
