"""
Shipments module - Core shipment management.
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint

from src.app.shared.base_model import Base, TimestampMixin
from src.app.shared.enums import ShipmentStatus, ShipmentModality, AssignmentMode


class Shipment(Base, TimestampMixin):
    """Shipment entity representing shipping requests."""

    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=True, index=True)
    # Set when the shipment was created by a merchant organization (nullable for
    # ordinary end-user shipments). Drives the pyme finance/monitoring views.
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
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
    description = Column(String(500), nullable=True)
    estimated_price = Column(Float, nullable=True)
    co2_savings_kg = Column(Float, nullable=True)


class ShipmentEvent(Base, TimestampMixin):
    """Audit trail of shipment status transitions (RF-SHP-05, RF-TRK-03)."""

    __tablename__ = "shipment_events"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    notes = Column(String(500), nullable=True)


class Rating(Base, TimestampMixin):
    """Client rating of the carrier after delivery (RF-SHP-08)."""

    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint("shipment_id", name="uq_rating_shipment"),)

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stars = Column(Integer, nullable=False)  # 1-5
    comment = Column(String(500), nullable=True)
