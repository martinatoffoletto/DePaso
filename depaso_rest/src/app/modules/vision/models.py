"""
Vision module models.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey

from src.app.shared.base_model import Base, TimestampMixin


class Classification(Base, TimestampMixin):
    """Log of every classification performed (RF-VIS-04).

    Feeds future fine-tuning and production bias auditing: stores prediction,
    confidence, whether the user accepted it, and the manual correction.
    """

    __tablename__ = "classifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=True)
    predicted_category = Column(String(10), nullable=False)
    confidence = Column(Float, nullable=False)
    has_reference_object = Column(Boolean, default=False)
    model_loaded = Column(Boolean, default=False)  # False = stub fallback was used
    accepted = Column(Boolean, nullable=True)      # user kept the suggestion?
    manual_category = Column(String(10), nullable=True)
