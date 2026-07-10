"""
Auth module service for business logic.
"""
import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

from src.app.core.config import settings
from src.app.core.security import create_access_token, get_password_hash, verify_password
from src.app.modules.auth.exceptions import InvalidCredentialsError
from src.app.shared.exceptions import AlreadyExistsError, NotFoundError, ValidationError
from src.app.modules.auth.models import PasswordResetToken
from src.app.modules.users import User, UserRepository

RESET_TOKEN_TTL_HOURS = 1

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication business logic."""

    def __init__(self, user_repository: UserRepository) -> None:
        """Initialize with user repository."""
        self.user_repository = user_repository

    async def register(self, email: str, password: str, first_name: str, last_name: str,
                 phone_number: str | None = None, user_type: str = "client") -> User:
        """Register a new user."""
        existing_user = await self.user_repository.get_by_email(email)
        if existing_user:
            raise AlreadyExistsError("User", code="EMAIL_ALREADY_REGISTERED")

        password_hash = get_password_hash(password)
        return await self.user_repository.create(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            user_type=user_type,
        )

    async def authenticate(self, email: str, password: str) -> User:
        """Authenticate a user and return the user object."""
        user = await self.user_repository.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError()

        if not user.is_active:
            raise InvalidCredentialsError()  # generic on purpose: do not leak account state

        return user

    async def create_tokens(self, user_id: int) -> tuple[str, str, int]:
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

    async def refresh_tokens(self, refresh_token: str) -> tuple[str, str, int]:
        """Issue a new token pair from a valid refresh token."""
        from jose import JWTError

        from src.app.core.security import decode_access_token

        try:
            payload = decode_access_token(refresh_token)
        except JWTError:
            raise InvalidCredentialsError()
        if payload.get("type") != "refresh" or "sub" not in payload:
            raise InvalidCredentialsError()

        user = await self.user_repository.get_by_id(int(payload["sub"]))
        if not user or not user.is_active:
            raise InvalidCredentialsError()
        return await self.create_tokens(user.id)

    async def change_password(self, user_id: int, current_password: str, new_password: str) -> bool:
        """Change password for an authenticated user."""
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise NotFoundError("User")

        if not verify_password(current_password, user.password_hash):
            raise InvalidCredentialsError()

        new_hash = get_password_hash(new_password)
        await self.user_repository.update(user_id, password_hash=new_hash)
        return True

    async def request_password_reset(self, email: str) -> str | None:
        """Generate and persist a password reset token. Returns None if user not found.

        Email delivery is out of scope for the prototype: the token is logged
        (and surfaced in the API response only in debug mode) so the demo can
        complete the flow without an SMTP service.
        """
        user = await self.user_repository.get_by_email(email)
        if not user:
            # Don't reveal if the email exists
            logger.info(f"Password reset requested for non-existent email: {email}")
            return None

        reset_token = secrets.token_urlsafe(32)
        db = self.user_repository.db
        db.add(PasswordResetToken(
            user_id=user.id,
            token_hash=hashlib.sha256(reset_token.encode()).hexdigest(),
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None)
            + timedelta(hours=RESET_TOKEN_TTL_HOURS),
        ))
        await db.flush()
        logger.info(f"Password reset token for user {user.id}: {reset_token}")
        return reset_token

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password using a single-use, time-limited reset token."""
        db = self.user_repository.db
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        from sqlalchemy import select, update as sql_update
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        record = (
            await db.execute(
                select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
            )
        ).scalars().first()
        if record is None or record.used or record.expires_at < now:
            raise ValidationError("Invalid or expired reset token", code="INVALID_RESET_TOKEN")

        # Compare-and-set sobre used=False: el token es single-use incluso si
        # llegan dos requests con el mismo token en paralelo.
        result = await db.execute(
            sql_update(PasswordResetToken)
            .where(PasswordResetToken.id == record.id, PasswordResetToken.used == False)  # noqa: E712
            .values(used=True)
        )
        if result.rowcount == 0:
            raise ValidationError("Invalid or expired reset token", code="INVALID_RESET_TOKEN")
        await self.user_repository.update(record.user_id, password_hash=get_password_hash(new_password))
        await db.flush()
        logger.info(f"Password reset completed for user {record.user_id}")
        return True
