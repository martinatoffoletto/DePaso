"""
Auth module Pydantic schemas for request/response DTOs.
"""
from pydantic import BaseModel, Field, EmailStr


class RegisterRequest(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone_number: str | None = None
    user_type: str = Field(default="client", pattern="^(client|carrier)$")


class LoginRequest(BaseModel):
    """Schema for user login."""

    email: EmailStr
    password: str = Field(..., max_length=72)


class RefreshRequest(BaseModel):
    """Schema for token refresh."""

    refresh_token: str


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int
    user: "UserSummary"


class UserSummary(BaseModel):
    """Minimal user info returned with auth tokens."""

    id: int
    email: str
    first_name: str
    last_name: str
    user_type: str

    class Config:
        from_attributes = True


class CurrentUserResponse(BaseModel):
    """Schema for current user response."""

    id: int
    email: str
    first_name: str
    last_name: str
    phone_number: str | None = None
    user_type: str
    rating: float
    is_active: bool

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password request."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for password reset."""

    token: str
    new_password: str = Field(..., min_length=8, max_length=72)


class ChangePasswordRequest(BaseModel):
    """Schema for password change (authenticated user)."""

    current_password: str
    new_password: str = Field(..., min_length=8, max_length=72)


class ForgotPasswordResponse(BaseModel):
    """Response for forgot password - always succeeds to prevent email enumeration."""

    message: str = "If the email exists, a reset link will be sent"


# Update forward reference
TokenResponse.model_rebuild()
