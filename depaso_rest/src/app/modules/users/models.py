"""
User module models.
SQLAlchemy ORM entities for users.
"""
from sqlalchemy import Column, String, Integer, Boolean, Float

from src.app.shared.base_model import Base, TimestampMixin
from src.app.shared.enums import UserType


class User(Base, TimestampMixin):
    """User entity representing clients or carriers."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    user_type = Column(String(20), nullable=False, default=UserType.CLIENT)
    is_active = Column(Boolean, default=True)
    rating = Column(Float, default=5.0)

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
