"""
Packages module schemas.
"""
from datetime import datetime
from pydantic import BaseModel, Field


class PackageBase(BaseModel):
    """Base package schema."""

    size: str = Field(..., pattern="^(s|m|l|xl|freight)$")
    description: str | None = None
    max_weight_kg: float = Field(..., gt=0)
    max_length_cm: float = Field(..., gt=0)
    max_width_cm: float = Field(..., gt=0)
    max_height_cm: float = Field(..., gt=0)
    base_price: float = Field(..., ge=0)


class PackageCreate(PackageBase):
    """Schema for package creation."""

    pass


class PackageResponse(PackageBase):
    """Schema for package response."""

    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
