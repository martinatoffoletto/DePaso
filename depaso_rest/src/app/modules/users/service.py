"""
User module service for business logic.
"""
from src.app.core.security import get_password_hash, verify_password
from src.app.modules.users.models import User
from src.app.modules.users.repository import UserRepository
from src.app.modules.users.exceptions import UserNotFoundError, UserAlreadyExistsError


class UserService:
    """Service for user business logic."""

    def __init__(self, repository: UserRepository) -> None:
        """Initialize with repository."""
        self.repository = repository

    async def create_user(self, email: str, password: str, first_name: str, last_name: str,
                    phone_number: str | None = None, user_type: str = "client") -> User:
        """Create a new user with password hashing."""
        existing_user = await self.repository.get_by_email(email)
        if existing_user:
            raise UserAlreadyExistsError()

        password_hash = get_password_hash(password)
        return await self.repository.create(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            user_type=user_type,
        )

    async def get_user_by_id(self, user_id: int) -> User:
        """Get a user by id."""
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        return user

    async def get_user_by_email(self, email: str) -> User:
        """Get a user by email."""
        user = await self.repository.get_by_email(email)
        if not user:
            raise UserNotFoundError()
        return user

    async def list_users(self, skip: int = 0, limit: int = 20) -> tuple[list[User], int]:
        """List users with pagination."""
        return await self.repository.list_active(skip, limit)

    async def update_user(self, user_id: int, first_name: str | None = None,
                    last_name: str | None = None,
                    phone_number: str | None = None) -> User:
        """Update user information (nombre/teléfono; el rol no se edita acá)."""
        await self.get_user_by_id(user_id)  # validates existence (raises if missing)
        updates = {}
        if first_name:
            updates["first_name"] = first_name
        if last_name:
            updates["last_name"] = last_name
        if phone_number:
            updates["phone_number"] = phone_number

        updated_user = await self.repository.update(user_id, **updates)
        if not updated_user:
            raise UserNotFoundError()
        return updated_user

    async def delete_user(self, user_id: int) -> bool:
        """Soft delete a user."""
        await self.get_user_by_id(user_id)  # Check existence
        return await self.repository.soft_delete(user_id)

    async def verify_password(self, user: User, password: str) -> bool:
        """Verify password for a user."""
        return verify_password(password, user.password_hash)
