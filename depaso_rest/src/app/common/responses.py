"""
Standard response envelopes for API responses.
"""
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """Generic success response envelope."""

    success: bool = True
    data: T


class ErrorResponse(BaseModel):
    """Standard error response."""

    success: bool = False
    error: str
    code: str


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response envelope."""

    success: bool = True
    data: list[T]
    total: int
    skip: int
    limit: int
