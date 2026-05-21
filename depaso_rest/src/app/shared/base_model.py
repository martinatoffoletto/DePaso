"""
Shared SQLAlchemy declarative base and base model mixin.
All ORM models must inherit from this single Base to share the same metadata.
Having one Base ensures Alembic can auto-detect all tables.
"""
from datetime import datetime

from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.orm import DeclarativeBase

# Single shared Base for the entire application.
# Previously each module declared its own Base, which broke FK relationships
# and Alembic migrations.
class Base(DeclarativeBase):
    __allow_unmapped__ = True


class TimestampMixin:
    """Mixin that adds created_at and updated_at columns."""
    __allow_unmapped__ = True

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
