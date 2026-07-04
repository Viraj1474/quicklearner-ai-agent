"""
Authentication Routes

This module provides all authentication endpoints:
- User registration (user/client roles)
- Email/password login
- Google OAuth login
- Password reset (forgot password)
- Token refresh
- User profile management
- Logout
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from database import get_db, User, UserRole, OAuthProvider, LoginAttempt
from schemas import (
    UserRegister, UserLoginRequest, TokenResponse, RefreshTokenRequest,
    UserProfileResponse, UserProfileUpdate, ChangePasswordRequest,
    ForgotPasswordRequest, ResetPasswordRequest, GoogleAuthRequest,
    GoogleAuthResponse, AuthStatusResponse, MessageResponse
)
from auth import (
    hash_password, verify_password, create_tokens_for_user,
    decode_token, get_current_user, get_current_user_optional,
    get_user_by_email, get_user_by_username, get_user_by_id,
    is_developer_email,
    create_password_reset_token, store_password_reset_token,
    verify_password_reset_token, use_password_reset_token,
    store_refresh_token, revoke_refresh_token, revoke_all_user_tokens,
    is_refresh_token_valid, verify_google_token, get_or_create_oauth_user,
    send_password_reset_email, send_welcome_email
)
from config import settings

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

MAX_FAILED_ATTEMPTS = 6
LOCKOUT_MINUTES = 10


def _auth_attempt_key(email: str, request: Request) -> str:
    return f"{email.lower()}::{request.client.host if request.client else 'unknown'}"


def _get_login_attempt_row(db: Session, key: str) -> LoginAttempt:
    row = db.query(LoginAttempt).filter(LoginAttempt.attempt_key == key).first()
    if row is None:
        row = LoginAttempt(attempt_key=key, attempts=0)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def _is_locked(db: Session, key: str) -> bool:
    row = db.query(LoginAttempt).filter(LoginAttempt.attempt_key == key).first()
    if not row or not row.lock_until:
        return False

    if row.lock_until > datetime.utcnow():
        return True

    row.attempts = 0
    row.lock_until = None
    db.commit()
    return False


def _record_failed_attempt(db: Session, key: str) -> None:
    row = _get_login_attempt_row(db, key)
    row.attempts += 1
    row.last_attempt_time = datetime.utcnow()
    if row.attempts >= MAX_FAILED_ATTEMPTS:
        row.lock_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
        row.attempts = MAX_FAILED_ATTEMPTS
    db.commit()


def _record_success_attempt(db: Session, key: str) -> None:
    row = db.query(LoginAttempt).filter(LoginAttempt.attempt_key == key).first()
    if row:
        db.delete(row)
        db.commit()


# ===== GOOGLE OAUTH STATUS =====

@router.get("/google/enabled")
async def google_oauth_enabled():
    """
    Check if Google OAuth is configured and enabled.
    Returns { "enabled": true/false }
    """
    from config import settings
    # Google Sign-In (GIS) in this app uses an ID token from the frontend,
    # so a client ID is sufficient for the backend to validate the audience.
    enabled = bool(settings.GOOGLE_CLIENT_ID)
    return {"enabled": enabled}


# ===== USER REGISTRATION =====

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    - **username**: Unique username (3-50 characters)
    - **email**: Valid email address
    - **password**: Password (min 8 characters)
    - **first_name**: Optional first name
    - **last_name**: Optional last name
    - **role**: User role ('user' or 'client', defaults to 'user')
    """
    # Check if email already exists
    if get_user_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    if get_user_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_pw = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role or UserRole.USER.value,
        auth_provider=OAuthProvider.LOCAL.value,
        last_login=datetime.utcnow()
    )

    if is_developer_email(new_user.email):
        new_user.role = UserRole.ADMIN.value
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    logger.info(f"New user registered: {new_user.email} (role: {new_user.role})")
    
    # Send welcome email in background
    background_tasks.add_task(send_welcome_email, new_user.email, new_user.username)
    
    # Generate tokens
    access_token, refresh_token, expires_in = create_tokens_for_user(new_user)
    
    # Store refresh token
    store_refresh_token(db, new_user.id, refresh_token)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserProfileResponse.model_validate(new_user)
    )


# ===== USER LOGIN =====

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    
    - **email**: User's email address
    - **password**: User's password
    - **remember_me**: If true, generates longer-lived refresh token
    """
    # Find user by email
    attempt_key = _auth_attempt_key(login_data.email, request)
    if _is_locked(db, attempt_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again later."
        )

    user = get_user_by_email(db, login_data.email)
    
    if not user:
        _record_failed_attempt(db, attempt_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user has a password (might be OAuth-only user)
    if not user.hashed_password:
        _record_failed_attempt(db, attempt_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses Google login. Please sign in with Google."
        )
    
    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        _record_failed_attempt(db, attempt_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        _record_failed_attempt(db, attempt_key)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support."
        )

    if is_developer_email(user.email) and user.role != UserRole.ADMIN.value:
        user.role = UserRole.ADMIN.value
        db.commit()
    
    # Update last login
    _record_success_attempt(db, attempt_key)
    user.last_login = datetime.utcnow()
    db.commit()
    
    logger.info(f"User logged in: {user.email}")
    
    # Generate tokens
    access_token, refresh_token, expires_in = create_tokens_for_user(user)
    
    # Store refresh token with device info
    device_info = request.headers.get("User-Agent", "Unknown")
    store_refresh_token(db, user.id, refresh_token, device_info)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserProfileResponse.model_validate(user)
    )


# ===== GOOGLE OAUTH LOGIN =====

@router.post("/google", response_model=GoogleAuthResponse)
async def google_login(
    auth_data: GoogleAuthRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Login or register with Google OAuth.
    
    - **credential**: Google ID token from frontend Google Sign-In
    """
    # Verify Google token
    google_user = await verify_google_token(auth_data.credential)
    
    if not google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    # Get or create user
    user, is_new_user = get_or_create_oauth_user(
        db=db,
        provider=OAuthProvider.GOOGLE.value,
        provider_user_id=google_user["google_id"],
        email=google_user["email"],
        first_name=google_user.get("given_name"),
        last_name=google_user.get("family_name"),
        profile_picture=google_user.get("picture")
    )

    if is_developer_email(user.email) and user.role != UserRole.ADMIN.value:
        user.role = UserRole.ADMIN.value
        db.commit()
    
    logger.info(f"Google login: {user.email} (new_user: {is_new_user})")
    
    # Send welcome email for new users
    if is_new_user:
        background_tasks.add_task(send_welcome_email, user.email, user.username)
    
    # Generate tokens
    access_token, refresh_token, expires_in = create_tokens_for_user(user)
    
    # Store refresh token
    device_info = request.headers.get("User-Agent", "Unknown")
    store_refresh_token(db, user.id, refresh_token, device_info)
    
    return GoogleAuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserProfileResponse.model_validate(user),
        is_new_user=is_new_user
    )


# ===== TOKEN REFRESH =====

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using a valid refresh token.
    """
    # Decode the refresh token
    payload = decode_token(refresh_data.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if refresh token is still valid in database
    if not is_refresh_token_valid(db, refresh_data.refresh_token):
        if settings.REFRESH_TOKEN_REUSE_REVOKE_ALL and payload.get("sub"):
            user = get_user_by_id(db, int(payload.get("sub")))
            if user:
                revoke_all_user_tokens(db, user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked"
        )
    
    # Get user
    user_id = payload.get("sub")
    user = get_user_by_id(db, int(user_id))
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Revoke old refresh token
    revoke_refresh_token(db, refresh_data.refresh_token)
    
    # Generate new tokens
    access_token, new_refresh_token, expires_in = create_tokens_for_user(user)
    
    # Store new refresh token
    device_info = request.headers.get("User-Agent", "Unknown")
    store_refresh_token(db, user.id, new_refresh_token, device_info)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=expires_in,
        user=UserProfileResponse.model_validate(user)
    )


# ===== FORGOT PASSWORD =====

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    forgot_data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Request a password reset email.
    
    - **email**: Email address of the account
    
    Note: Always returns success even if email doesn't exist (security measure)
    """
    user = get_user_by_email(db, forgot_data.email)
    
    if user and user.hashed_password:  # Only for users with password (not OAuth-only)
        # Create and store reset token
        token = create_password_reset_token()
        store_password_reset_token(db, user.id, token)
        
        # Send email in background
        background_tasks.add_task(send_password_reset_email, user.email, token)
        
        logger.info(f"Password reset requested for: {user.email}")
    
    # Always return success for security
    return MessageResponse(
        message="If an account with that email exists, a password reset link has been sent.",
        success=True
    )


# ===== RESET PASSWORD =====

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using the token from email.
    
    - **token**: Password reset token from email
    - **new_password**: New password (min 8 characters)
    - **confirm_password**: Confirmation of new password
    """
    # Validate passwords match
    if reset_data.new_password != reset_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Verify token and get user
    user = verify_password_reset_token(db, reset_data.token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password
    user.hashed_password = hash_password(reset_data.new_password)
    
    # Mark token as used
    use_password_reset_token(db, reset_data.token)
    
    # Revoke all refresh tokens for security
    revoke_all_user_tokens(db, user.id)
    
    db.commit()
    
    logger.info(f"Password reset successful for: {user.email}")
    
    return MessageResponse(
        message="Password has been reset successfully. Please login with your new password.",
        success=True
    )


# ===== LOGOUT =====

@router.post("/logout", response_model=MessageResponse)
async def logout(
    refresh_data: RefreshTokenRequest = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout the current user.
    
    Optionally revokes the refresh token if provided.
    """
    if refresh_data and refresh_data.refresh_token:
        revoke_refresh_token(db, refresh_data.refresh_token)
    
    logger.info(f"User logged out: {user.email}")
    
    return MessageResponse(
        message="Logged out successfully",
        success=True
    )


@router.post("/logout-all", response_model=MessageResponse)
async def logout_all_devices(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout from all devices by revoking all refresh tokens.
    """
    count = revoke_all_user_tokens(db, user.id)
    
    logger.info(f"User logged out from all devices: {user.email} ({count} tokens revoked)")
    
    return MessageResponse(
        message=f"Logged out from all devices ({count} sessions)",
        success=True
    )


# ===== USER PROFILE =====

@router.get("/me", response_model=UserProfileResponse)
async def get_profile(user: User = Depends(get_current_user)):
    """
    Get the current user's profile.
    """
    return UserProfileResponse.model_validate(user)


@router.put("/me", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current user's profile.
    
    - **first_name**: Optional first name update
    - **last_name**: Optional last name update
    - **username**: Optional username update (must be unique)
    """
    # Check username uniqueness if being changed
    if profile_data.username and profile_data.username != user.username:
        existing = get_user_by_username(db, profile_data.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        user.username = profile_data.username
    
    # Update other fields
    if profile_data.first_name is not None:
        user.first_name = profile_data.first_name
    if profile_data.last_name is not None:
        user.last_name = profile_data.last_name
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return UserProfileResponse.model_validate(user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change the current user's password.
    
    - **current_password**: Current password for verification
    - **new_password**: New password (min 8 characters)
    - **confirm_password**: Confirmation of new password
    """
    # Check if user has a password (OAuth users might not)
    if not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change password for OAuth-only accounts. Please set a password first."
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new passwords match
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    # Update password
    user.hashed_password = hash_password(password_data.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    
    logger.info(f"Password changed for: {user.email}")
    
    return MessageResponse(
        message="Password changed successfully",
        success=True
    )


# ===== AUTH STATUS CHECK =====

@router.get("/status", response_model=AuthStatusResponse)
async def check_auth_status(user: User = Depends(get_current_user_optional)):
    """
    Check if the current request is authenticated.
    
    Returns user info if authenticated, otherwise indicates not authenticated.
    """
    if user:
        return AuthStatusResponse(
            is_authenticated=True,
            user=UserProfileResponse.model_validate(user)
        )
    return AuthStatusResponse(is_authenticated=False)


# ===== DELETE ACCOUNT =====

@router.delete("/me", response_model=MessageResponse)
async def delete_account(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete the current user's account.
    
    Warning: This action is irreversible!
    """
    email = user.email
    
    # Delete user (cascades to related records)
    db.delete(user)
    db.commit()
    
    logger.info(f"Account deleted: {email}")
    
    return MessageResponse(
        message="Account deleted successfully",
        success=True
    )
