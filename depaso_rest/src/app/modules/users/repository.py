"""
User module repository for data access.
Extends BaseRepository with user-specific queries.
"""
from sqlalchemy.orm import Session

from src.app.shared.base_repository import BaseRepository
from src.app.modules.users.models import User


class UserRepository(BaseRepository[User]):
    """Repository for user data access."""

    def __init__(self, db: Session) -> None:
        """Initialize with database session."""
        super().__init__(User, db)

    def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def list_active(self, skip: int = 0, limit: int = 20) -> tuple[list[User], int]:
        """List all active users with pagination."""
        query = self.db.query(User).filter(User.is_active == True)
        total = query.count()
        users = query.offset(skip).limit(limit).all()
        return users, total

    def soft_delete(self, user_id: int) -> bool:
        """Soft delete a user by setting is_active to False."""
        user = self.get_by_id(user_id)
        if not user:
            return False
        user.is_active = False
        self.db.commit()
        return True
