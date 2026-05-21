"""
Packages module - Package size catalog.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean

from src.app.shared.base_model import Base, TimestampMixin
from src.app.shared.enums import PackageSize


class Package(Base, TimestampMixin):
    """Package entity representing size categories and specifications."""

    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    size = Column(String(20), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    max_weight_kg = Column(Float, nullable=False)
    max_length_cm = Column(Float, nullable=False)
    max_width_cm = Column(Float, nullable=False)
    max_height_cm = Column(Float, nullable=False)
    estimated_volume_m3 = Column(Float, nullable=True)
    base_price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
