"""
User module Pydantic schemas for request/response DTOs.
"""
from datetime import datetime

from pydantic import BaseModel, Field, EmailStr


class UserBase(BaseModel):
    """Base schema with common fields."""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone_number: str | None = None
    user_type: str = Field(default="client", pattern="^(client|carrier)$")


class UserUpdate(BaseModel):
    """Schema for user updates.

    user_type NO es editable por acá: el rol se elige al registrarse y el modo
    cadete requiere perfil de carrier + verificación (POST /carriers/me). Un
    self-PATCH del rol dejaba la UI de carrier sin perfil detrás.
    """

    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None


class UserResponse(UserBase):
    """Schema for user responses."""

    # Override: en respuestas el patrón de UserBase no aplica — un admin es un
    # user_type válido almacenado y debe poder serializarse.
    user_type: str

    id: int
    is_active: bool
    rating: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
