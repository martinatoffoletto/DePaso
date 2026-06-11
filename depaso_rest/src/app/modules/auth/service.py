"""
Auth module service for business logic.
"""
from datetime import timedelta
import secrets
import logging

from src.app.core.security import create_access_token, verify_password, get_password_hash
from src.app.core.config import settings
from src.app.modules.users import UserRepository, User
from src.app.modules.auth.exceptions import InvalidCredentialsError

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication business logic."""

    def __init__(self, user_repository: UserRepository) -> None:
        """Initialize with user repository."""
        self.user_repository = user_repository

    def register(self, email: str, password: str, first_name: str, last_name: str,
                 phone_number: str | None = None, user_type: str = "client") -> User:
        """Register a new user."""
        existing_user = self.user_repository.get_by_email(email)
        if existing_user:
            raise ValueError("Email already registered")

        password_hash = get_password_hash(password)
        return self.user_repository.create(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            user_type=user_type,
        )

    def authenticate(self, email: str, password: str) -> User:
        """Authenticate a user and return the user object."""
        user = self.user_repository.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError()

        if not user.is_active:
            raise ValueError("User account is inactive")

        return user

    def create_tokens(self, user_id: int) -> tuple[str, str, int]:
        """Create access + refresh token pair (RNF-SEC-03)."""
        access_token = create_access_token(
            data={"sub": str(user_id)},
            expires_delta=timedelta(minutes=settings.jwt_expire_minutes),
        )
        refresh_token = create_access_token(
            data={"sub": str(user_id), "type": "refresh"},
            expires_delta=timedelta(days=settings.refresh_token_expire_days),
        )
        return access_token, refresh_token, settings.jwt_expire_minutes * 60

    def refresh_tokens(self, refresh_token: str) -> tuple[str, str, int]:
        """Issue a new token pair from a valid refresh token."""
        from jose import JWTError
        from src.app.core.security import decode_access_token

        try:
            payload = decode_access_token(refresh_token)
        except JWTError:
            raise InvalidCredentialsError()
        if payload.get("type") != "refresh" or "sub" not in payload:
            raise InvalidCredentialsError()

        user = self.user_repository.get_by_id(int(payload["sub"]))
        if not user or not user.is_active:
            raise InvalidCredentialsError()
        return self.create_tokens(user.id)

    def change_password(self, user_id: int, current_password: str, new_password: str) -> bool:
        """Change password for an authenticated user."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if not verify_password(current_password, user.password_hash):
            raise InvalidCredentialsError()

        new_hash = get_password_hash(new_password)
        self.user_repository.update(user_id, password_hash=new_hash)
        return True

    def request_password_reset(self, email: str) -> str | None:
        """Generate a password reset token. Returns None if user not found (security)."""
        user = self.user_repository.get_by_email(email)
        if not user:
            # Don't reveal if the email exists
            logger.info(f"Password reset requested for non-existent email: {email}")
            return None

        # Generate a reset token (in production, store this with expiry in DB)
        reset_token = secrets.token_urlsafe(32)
        # TODO: Store reset_token with expiry in a password_reset_tokens table
        # TODO: Send email with reset link
        logger.info(f"Password reset token generated for user {user.id}")
        return reset_token

    def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using a reset token."""
        # TODO: Look up token in password_reset_tokens table
        # TODO: Verify token hasn't expired
        # TODO: Get user_id from token
        # TODO: Update password
        # For now, this is a placeholder
        raise ValueError("Password reset not yet implemented - requires email service")
