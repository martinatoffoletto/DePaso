"""
Auth module API router.
HTTP endpoints for authentication, registration, and password management.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

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
from src.app.shared.exceptions import DomainException

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    """Dependency: get auth service."""
    return AuthService(UserRepository(db))


def get_user_service(db: Session = Depends(get_db)) -> UserService:
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
    try:
        user = service.register(
            email=payload.email,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone_number=payload.phone_number,
            user_type=payload.user_type,
        )
        access_token, refresh_token, expires_in = service.create_tokens(user.id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            user=UserSummary.model_validate(user),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_auth)
async def login(
    request: Request,
    payload: LoginRequest,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Authenticate a user and return tokens. Rate-limited (RNF-SEC-06)."""
    try:
        user = service.authenticate(email=payload.email, password=payload.password)
        access_token, refresh_token, expires_in = service.create_tokens(user.id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            user=UserSummary.model_validate(user),
        )
    except (ValueError, DomainException):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
    user_service: UserService = Depends(get_user_service),
) -> TokenResponse:
    """Exchange a refresh token for a new token pair (RNF-SEC-03)."""
    try:
        access_token, refresh_token, expires_in = service.refresh_tokens(request.refresh_token)
        from src.app.core.security import decode_access_token

        user_id = int(decode_access_token(access_token)["sub"])
        user = user_service.get_user_by_id(user_id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            user=UserSummary.model_validate(user),
        )
    except (ValueError, DomainException):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user(
    current_user_id: CurrentUserId,
    service: UserService = Depends(get_user_service),
) -> CurrentUserResponse:
    """Get the current authenticated user's profile."""
    try:
        user = service.get_user_by_id(current_user_id)
        return CurrentUserResponse.model_validate(user)
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> ForgotPasswordResponse:
    """Request a password reset. Always returns 200 to prevent email enumeration.

    No SMTP in the prototype: in debug mode the token is returned so the
    flow can be demoed end-to-end; otherwise it's only logged server-side.
    """
    token = service.request_password_reset(request.email)
    return ForgotPasswordResponse(debug_token=token if settings.debug else None)


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    """Reset password using a reset token."""
    try:
        service.reset_password(request.token, request.new_password)
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    request: ChangePasswordRequest,
    current_user_id: CurrentUserId,
    service: AuthService = Depends(get_auth_service),
) -> dict:
    """Change password for the authenticated user."""
    try:
        service.change_password(current_user_id, request.current_password, request.new_password)
        return {"message": "Password changed successfully"}
    except (ValueError, DomainException) as e:
        detail = e.message if isinstance(e, DomainException) else str(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
