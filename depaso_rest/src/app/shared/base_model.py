"""
Shared SQLAlchemy declarative base and base model mixin.
All ORM models must inherit from this single Base to share the same metadata.
"""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime
from sqlalchemy.orm import DeclarativeBase


def _utcnow() -> datetime:
    """Naive UTC now — columns store naive UTC; avoids deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# Single shared Base for the entire application.
# Previously each module declared its own Base, which broke FK relationships.
class Base(DeclarativeBase):
    __allow_unmapped__ = True


class TimestampMixin:
    """Mixin that adds created_at and updated_at columns."""
    __allow_unmapped__ = True

    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )
