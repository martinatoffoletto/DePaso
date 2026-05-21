"""
Vision module schemas.
"""
from pydantic import BaseModel, Field


class ClassificationRequest(BaseModel):
    """Request for image classification."""

    image_url: str


class ClassificationResponse(BaseModel):
    """Response from image classification."""

    category: str = Field(..., pattern="^(xs|s|m|l|xl)$")
    confidence: float = Field(..., ge=0, le=1)
    model_version: str = "mobilenetv2-1.0"
