"""
Vision module schemas.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ClassificationResponse(BaseModel):
    """Response from image classification (RF-VIS-01)."""

    classification_id: int
    category: str = Field(..., pattern="^(xs|s|m|l|xl)$")
    confidence: float = Field(..., ge=0, le=1)
    needs_manual: bool          # confidence < threshold -> suggest manual input (RF-VIS-02)
    model_loaded: bool          # False = stub fallback (dev without the trained model)


class ClassificationFeedback(BaseModel):
    """User decision over the suggestion (feeds RF-VIS-04 logging)."""

    accepted: bool
    manual_category: str | None = Field(None, pattern="^(xs|s|m|l|xl)$")


class ClassificationLogEntry(BaseModel):
    """Stored classification record (RF-VIS-04)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    predicted_category: str
    confidence: float
    has_reference_object: bool
    model_loaded: bool
    accepted: bool | None
    manual_category: str | None
    created_at: datetime
