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

    def create_user(self, email: str, password: str, first_name: str, last_name: str,
                    phone_number: str | None = None, user_type: str = "client") -> User:
        """Create a new user with password hashing."""
        existing_user = self.repository.get_by_email(email)
        if existing_user:
            raise UserAlreadyExistsError()

        password_hash = get_password_hash(password)
        return self.repository.create(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            user_type=user_type,
        )

    def get_user_by_id(self, user_id: int) -> User:
        """Get a user by id."""
        user = self.repository.get_by_id(user_id)
        if not user:
            raise UserNotFoundError()
        return user

    def get_user_by_email(self, email: str) -> User:
        """Get a user by email."""
        user = self.repository.get_by_email(email)
        if not user:
            raise UserNotFoundError()
        return user

    def list_users(self, skip: int = 0, limit: int = 20) -> tuple[list[User], int]:
        """List users with pagination."""
        return self.repository.list_active(skip, limit)

    def update_user(self, user_id: int, first_name: str | None = None,
                    last_name: str | None = None, phone_number: str | None = None,
                    user_type: str | None = None) -> User:
        """Update user information."""
        user = self.get_user_by_id(user_id)
        updates = {}
        if first_name:
            updates["first_name"] = first_name
        if last_name:
            updates["last_name"] = last_name
        if phone_number:
            updates["phone_number"] = phone_number
        if user_type:
            updates["user_type"] = user_type

        updated_user = self.repository.update(user_id, **updates)
        if not updated_user:
            raise UserNotFoundError()
        return updated_user

    def delete_user(self, user_id: int) -> bool:
        """Soft delete a user."""
        self.get_user_by_id(user_id)  # Check existence
        return self.repository.soft_delete(user_id)

    def verify_password(self, user: User, password: str) -> bool:
        """Verify password for a user."""
        return verify_password(password, user.password_hash)
