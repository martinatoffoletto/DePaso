"""
Carriers module - Transportation providers management.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey

from src.app.shared.base_model import Base, TimestampMixin


class Carrier(Base, TimestampMixin):
    """Carrier entity representing transportation providers."""

    __tablename__ = "carriers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    vehicle_type = Column(String(20), nullable=False)
    license_plate = Column(String(20), unique=True, nullable=False)
    capacity_kg = Column(Float, nullable=False)
    capacity_volume_m3 = Column(Float, nullable=True)
    reputation = Column(Float, default=5.0)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    # Location for matching
    current_lat = Column(Float, nullable=True)
    current_lon = Column(Float, nullable=True)
    is_available = Column(Boolean, default=False)
