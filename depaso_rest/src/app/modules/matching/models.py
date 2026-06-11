"""
Matching module models.

The scoring weights (spec 5.2) live in DB so an admin can tune them
without redeploying. Missing rows fall back to DEFAULT_WEIGHTS.
"""
from sqlalchemy import Column, Float, Integer, String

from src.app.shared.base_model import Base, TimestampMixin


class MatchingWeight(Base, TimestampMixin):
    """One row per scoring component: geo, detour, cargo, reputation, time_window."""

    __tablename__ = "matching_weights"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(30), unique=True, nullable=False)
    value = Column(Float, nullable=False)
