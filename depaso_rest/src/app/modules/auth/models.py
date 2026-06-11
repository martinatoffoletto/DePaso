"""
Auth module models.
"""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from src.app.shared.base_model import Base, TimestampMixin


class PasswordResetToken(Base, TimestampMixin):
    """Single-use password reset token (RF-USR forgot-password).

    Only the SHA-256 of the token is stored, so a DB leak doesn't expose
    usable tokens. Tokens expire after 1 hour and are marked used on redeem.
    """

    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
