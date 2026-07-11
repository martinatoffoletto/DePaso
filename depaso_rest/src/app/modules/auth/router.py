"""
Auth module API router.
HTTP endpoints for authentication, registration, and password management.
"""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.config import settings
from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.core.limiter import limiter
from src.app.modules.auth.schemas import (
    ChangePasswordRequest,
    CurrentUserResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserSummary,
)
from src.app.modules.auth.service import AuthService
from src.app.modules.users import UserRepository, UserService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Dependency: get auth service."""
    return AuthService(UserRepository(db))


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """Dependency: get user service."""
    return UserService(UserRepository(db))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.rate_limit_auth)
async def register(
    request: Request,
    payload: RegisterRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Register a new user (client or carrier). Rate-limited (RNF-SEC-06)."""
    user = await service.register(
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone_number=payload.phone_number,
        user_type=payload.user_type,
    )
    access_token, refresh_token, expires_in = await service.create_tokens(user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserSummary.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_auth)
async def login(
    request: Request,
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Authenticate a user and return tokens. Rate-limited (RNF-SEC-06)."""
    user = await service.authenticate(email=payload.email, password=payload.password)
    access_token, refresh_token, expires_in = await service.create_tokens(user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserSummary.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Exchange a refresh token for a new token pair (RNF-SEC-03)."""
    access_token, refresh_token, expires_in, user = await service.refresh_tokens(
        request.refresh_token
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        user=UserSummary.model_validate(user),
    )


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user(
    current_user_id: CurrentUserId,
    service: UserService = Depends(get_user_service),
) -> CurrentUserResponse:
    """Get the current authenticated user's profile."""
    user = await service.get_user_by_id(current_user_id)
    return CurrentUserResponse.model_validate(user)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> ForgotPasswordResponse:
    """Request a password reset. Always returns 200 to prevent email enumeration.

    No SMTP in the prototype: in debug mode the token is returned so the
    flow can be demoed end-to-end; otherwise it's only logged server-side.
    """
    token = await service.request_password_reset(request.email)
    return ForgotPasswordResponse(debug_token=token if settings.debug else None)


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    """Reset password using a reset token."""
    await service.reset_password(request.token, request.new_password)
    return {"message": "Password reset successfully"}


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    request: ChangePasswordRequest,
    current_user_id: CurrentUserId,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    """Change password for the authenticated user."""
    await service.change_password(current_user_id, request.current_password, request.new_password)
    return {"message": "Password changed successfully"}
