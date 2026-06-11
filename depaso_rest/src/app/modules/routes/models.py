"""
Routes module - Carrier published trajectories and availability windows.

A CarrierRoute is what makes the collaborative modality possible: occasional
drivers (ODs) register trips they were already going to make, and matching
assigns shipments whose pickup/dropoff fit those trips with minimal detour.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey

from src.app.shared.base_model import Base, TimestampMixin


class CarrierRoute(Base, TimestampMixin):
    """A published carrier trajectory (collaborative) or zone window (dedicated)."""

    __tablename__ = "carrier_routes"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)

    # collaborative_route: fixed origin->destination trip the carrier already makes
    # dedicated_window: free availability in a zone (no fixed trajectory)
    kind = Column(String(30), nullable=False, default="collaborative_route")

    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=True)   # null for dedicated_window
    destination_lon = Column(Float, nullable=True)

    window_start = Column(DateTime, nullable=False)
    window_end = Column(DateTime, nullable=False)
    # "mon,tue,wed,thu,fri" for recurring habitual routes; null = one-off
    recurrence_days = Column(String(50), nullable=True)

    is_active = Column(Boolean, default=True, index=True)
