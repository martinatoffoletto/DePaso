"""
User module API router.
HTTP endpoints for user management.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.database import get_db
from src.app.core.dependencies import CurrentUserId
from src.app.modules.users.schemas import UserCreate, UserResponse, UserUpdate
from src.app.modules.users.service import UserService
from src.app.modules.users.repository import UserRepository

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """Dependency: get user service."""
    return UserService(UserRepository(db))


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Create a new user."""
    user = await service.create_user(
        email=user_data.email,
        password=user_data.password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone_number=user_data.phone_number,
        user_type=user_data.user_type,
    )
    return UserResponse.model_validate(user)

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user_id: CurrentUserId,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Get the current user."""
    user = await service.get_user_by_id(current_user_id)
    return UserResponse.model_validate(user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    user_data: UserUpdate,
    current_user_id: CurrentUserId,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Update the current user."""
    user = await service.update_user(
        current_user_id,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone_number=user_data.phone_number,
        user_type=user_data.user_type,
    )
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Get a user by id."""
    user = await service.get_user_by_id(user_id)
    return UserResponse.model_validate(user)


@router.get("", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 20,
    service: UserService = Depends(get_user_service),
) -> list[UserResponse]:
    """List all users."""
    users, _ = await service.list_users(skip, limit)
    return [UserResponse.model_validate(u) for u in users]


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Update a user."""
    user = await service.update_user(
        user_id,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone_number=user_data.phone_number,
    )
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
) -> None:
    """Delete a user (soft delete)."""
    await service.delete_user(user_id)
