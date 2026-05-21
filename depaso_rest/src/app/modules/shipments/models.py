"""
Shipments module - Core shipment management.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey

from src.app.shared.base_model import Base, TimestampMixin
from src.app.shared.enums import ShipmentStatus, ShipmentModality, AssignmentMode


class Shipment(Base, TimestampMixin):
    """Shipment entity representing shipping requests."""

    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=True, index=True)
    package_size = Column(String(20), nullable=False)
    status = Column(String(20), default=ShipmentStatus.PENDING)
    modality = Column(String(20), nullable=False)  # dedicated / collaborative
    assignment_mode = Column(String(20), nullable=False)  # on_demand / by_availability
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    photo_url = Column(String(500), nullable=True)
    estimated_price = Column(Float, nullable=True)
    co2_savings_kg = Column(Float, nullable=True)
