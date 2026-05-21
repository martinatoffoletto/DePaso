"""
Pagination utilities.
"""
from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    """Pagination query parameters."""

    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)
