"""
Authentication Service Module

This module handles:
- JWT token creation and validation
- Password hashing and verification
- OAuth helpers (Google)
- Email sending for password reset
- User session management
"""

from datetime import datetime, timedelta
from typing import Optional, Union
import secrets
import logging

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx

from config import settings
from database import get_db, User, OAuthAccount, PasswordResetToken, RefreshToken, UserRole, OAuthProvider
from billing import has_premium_access, get_daily_quota_status

# Setup logging
logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer scheme for JWT tokens
security = HTTPBearer(auto_error=False)


# ===== PASSWORD HASHING =====

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


# ===== JWT TOKEN HANDLING =====

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh",
        "jti": secrets.token_urlsafe(32)  # Unique token ID
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None


def create_tokens_for_user(user: User) -> tuple[str, str, int]:
    """Create access and refresh tokens for a user"""
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    return access_token, refresh_token, expires_in


# ===== PASSWORD RESET TOKENS =====

def create_password_reset_token() -> str:
    """Generate a secure password reset token"""
    return secrets.token_urlsafe(32)


def store_password_reset_token(db: Session, user_id: int, token: str) -> PasswordResetToken:
    """Store a password reset token in the database"""
    # Invalidate any existing tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id,
        PasswordResetToken.is_used == False
    ).update({"is_used": True})
    
    # Create new token
    expires_at = datetime.utcnow() + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
    reset_token = PasswordResetToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token)
    db.commit()
    db.refresh(reset_token)
    return reset_token


def verify_password_reset_token(db: Session, token: str) -> Optional[User]:
    """Verify a password reset token and return the associated user"""
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    if not reset_token:
        return None
    
    return reset_token.user


def use_password_reset_token(db: Session, token: str) -> bool:
    """Mark a password reset token as used"""
    result = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token
    ).update({"is_used": True})
    db.commit()
    return result > 0


# ===== REFRESH TOKEN MANAGEMENT =====

def store_refresh_token(db: Session, user_id: int, token: str, device_info: str = None) -> RefreshToken:
    """Store a refresh token in the database"""
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at,
        device_info=device_info
    )
    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)
    return refresh_token


def revoke_refresh_token(db: Session, token: str) -> bool:
    """Revoke a refresh token"""
    result = db.query(RefreshToken).filter(
        RefreshToken.token == token
    ).update({"is_revoked": True})
    db.commit()
    return result > 0


def revoke_all_user_tokens(db: Session, user_id: int) -> int:
    """Revoke all refresh tokens for a user"""
    result = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id
    ).update({"is_revoked": True})
    db.commit()
    return result


def is_refresh_token_valid(db: Session, token: str) -> bool:
    """Check if a refresh token is valid"""
    refresh_token = db.query(RefreshToken).filter(
        RefreshToken.token == token,
        RefreshToken.is_revoked == False,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()
    return refresh_token is not None


# ===== USER RETRIEVAL =====

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email"""
    return db.query(User).filter(User.email == email).first()


def is_developer_email(email: Optional[str]) -> bool:
    """Return True when the email is whitelisted for developer/admin access."""
    if not email:
        return False
    normalized_email = email.strip().lower()
    allowed_emails = {item.strip().lower() for item in settings.ALLOWED_DEVELOPER_EMAILS}
    return normalized_email in allowed_emails


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get a user by username"""
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get a user by ID"""
    return db.query(User).filter(User.id == user_id).first()


# ===== AUTHENTICATION DEPENDENCIES =====

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to get the current authenticated user.
    Raises HTTPException if not authenticated.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if credentials is None:
        raise credentials_exception
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise credentials_exception
    
    # Check token type
    if payload.get("type") != "access":
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = get_user_by_id(db, int(user_id))
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    FastAPI dependency to optionally get the current user.
    Returns None if not authenticated (no exception raised).
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def require_role(allowed_roles: list[str]):
    """
    FastAPI dependency factory to require specific user roles.
    Usage: Depends(require_role(["admin", "client"]))
    """
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker


def require_premium():
    """
    FastAPI dependency factory to require an active premium subscription.
    """
    async def premium_checker(user: User = Depends(get_current_user)) -> User:
        if not has_premium_access(user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Premium subscription required",
            )
        return user

    return premium_checker


def require_premium_or_quota(usage_scope: str):
    """
    Backward-compatible alias for premium-only routes.

    Free users do not consume quota on premium endpoints; they receive 403.
    """
    async def quota_checker(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if has_premium_access(user):
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required",
        )

    return quota_checker


def get_premium_quota_status(db: Session, user: User, usage_scope: str) -> dict:
    """Return current premium quota status for a user."""
    if has_premium_access(user):
        status = get_daily_quota_status(db, user.id, usage_scope)
        status.update({"is_premium": True, "unlimited": True})
        return status

    status = get_daily_quota_status(db, user.id, usage_scope)
    status.update({"is_premium": False, "unlimited": False})
    return status


# ===== GOOGLE OAUTH =====

async def verify_google_token(token: str) -> Optional[dict]:
    """
    Verify a Google ID token and return user info.
    Uses Google's tokeninfo endpoint.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            )
            
            if response.status_code != 200:
                logger.warning(f"Google token verification failed: {response.status_code}")
                return None
            
            data = response.json()
            
            # Verify the token is for our app
            if settings.GOOGLE_CLIENT_ID and data.get("aud") != settings.GOOGLE_CLIENT_ID:
                logger.warning("Google token audience mismatch")
                return None
            
            return {
                "google_id": data.get("sub"),
                "email": data.get("email"),
                "email_verified": data.get("email_verified") == "true",
                "name": data.get("name"),
                "picture": data.get("picture"),
                "given_name": data.get("given_name"),
                "family_name": data.get("family_name")
            }
    except Exception as e:
        logger.error(f"Error verifying Google token: {e}")
        return None


def get_or_create_oauth_user(
    db: Session,
    provider: str,
    provider_user_id: str,
    email: str,
    first_name: str = None,
    last_name: str = None,
    profile_picture: str = None
) -> tuple[User, bool]:
    """
    Get or create a user from OAuth data.
    Returns (user, is_new_user) tuple.
    """
    # Check if OAuth account already exists
    oauth_account = db.query(OAuthAccount).filter(
        OAuthAccount.provider == provider,
        OAuthAccount.provider_user_id == provider_user_id
    ).first()
    
    if oauth_account:
        # Update last login
        oauth_account.user.last_login = datetime.utcnow()
        db.commit()
        return oauth_account.user, False
    
    # Check if user with this email exists
    user = get_user_by_email(db, email)
    
    if user:
        # Link OAuth account to existing user
        oauth_account = OAuthAccount(
            user_id=user.id,
            provider=provider,
            provider_user_id=provider_user_id,
            provider_email=email
        )
        db.add(oauth_account)
        user.last_login = datetime.utcnow()
        if not user.profile_picture and profile_picture:
            user.profile_picture = profile_picture
        db.commit()
        return user, False
    
    # Create new user
    # Generate unique username from email
    base_username = email.split("@")[0]
    username = base_username
    counter = 1
    while get_user_by_username(db, username):
        username = f"{base_username}{counter}"
        counter += 1
    
    user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        profile_picture=profile_picture,
        auth_provider=provider,
        is_verified=True,  # OAuth emails are considered verified
        last_login=datetime.utcnow()
    )
    db.add(user)
    db.flush()  # Get user ID
    
    # Create OAuth account link
    oauth_account = OAuthAccount(
        user_id=user.id,
        provider=provider,
        provider_user_id=provider_user_id,
        provider_email=email
    )
    db.add(oauth_account)
    db.commit()
    db.refresh(user)
    
    return user, True


# ===== EMAIL SENDING =====

async def send_password_reset_email(email: str, token: str) -> bool:
    """
    Send a password reset email.
    Returns True if sent successfully.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured, skipping email send")
        # In development, log the reset link
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        logger.info(f"Password reset link (SMTP not configured): {reset_link}")
        return True
    
    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        message = MIMEMultipart("alternative")
        message["Subject"] = "Reset Your Password - Quicklearner"
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        message["To"] = email
        
        # Plain text version
        text_content = f"""
Hello,

You requested to reset your password for your Quicklearner account.

Click the link below to reset your password:
{reset_link}

This link will expire in {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} hours.

If you didn't request this, please ignore this email.

Best regards,
The Quicklearner Team
        """
        
        # HTML version
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <h2>Reset Your Password</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for your Quicklearner account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="{reset_link}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>This link will expire in {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <div class="footer">
            <p>Best regards,<br>The Quicklearner Team</p>
        </div>
    </div>
</body>
</html>
        """
        
        message.attach(MIMEText(text_content, "plain"))
        message.attach(MIMEText(html_content, "html"))
        
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=settings.SMTP_TLS
        )
        
        logger.info(f"Password reset email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        return False


async def send_welcome_email(email: str, username: str) -> bool:
    """Send a welcome email to new users."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(f"Welcome email skipped (SMTP not configured) for {email}")
        return True
    
    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        message = MIMEMultipart("alternative")
        message["Subject"] = "Welcome to Quicklearner! 🎓"
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        message["To"] = email
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <h2>Welcome to Quicklearner! 🎓</h2>
        <p>Hi {username},</p>
        <p>Thank you for joining Quicklearner! We're excited to have you on board.</p>
        <p>With Quicklearner, you can:</p>
        <ul>
            <li>📚 Generate smart summaries of your study materials</li>
            <li>🧠 Create AI-powered quizzes to test your knowledge</li>
            <li>🎴 Generate flashcards for effective memorization</li>
            <li>💬 Chat with AI for instant study help</li>
        </ul>
        <a href="{settings.FRONTEND_URL}" class="button">Start Learning</a>
        <p>Happy learning!</p>
        <p>The Quicklearner Team</p>
    </div>
</body>
</html>
        """
        
        message.attach(MIMEText(html_content, "html"))
        
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=settings.SMTP_TLS
        )
        
        logger.info(f"Welcome email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email: {e}")
        return False
