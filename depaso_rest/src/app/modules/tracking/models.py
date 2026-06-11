"""
Tracking module models.
"""
from sqlalchemy import Column, Integer, Float, ForeignKey

from src.app.shared.base_model import Base, TimestampMixin


class GpsTrace(Base, TimestampMixin):
    """Carrier GPS position sample while a shipment is active (RF-TRK-01/03)."""

    __tablename__ = "gps_traces"

    id = Column(Integer, primary_key=True, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=True, index=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
