"""
User module repository for data access.
Extends BaseRepository with user-specific queries.
"""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.shared.base_repository import BaseRepository
from src.app.modules.users.models import User


class UserRepository(BaseRepository[User]):
    """Repository for user data access."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize with database session."""
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def list_active(self, skip: int = 0, limit: int = 20) -> tuple[list[User], int]:
        """List all active users with pagination."""
        base = select(User).where(User.is_active == True)  # noqa: E712
        total = (
            await self.db.execute(select(func.count()).select_from(base.subquery()))
        ).scalar_one()
        users = (await self.db.execute(base.offset(skip).limit(limit))).scalars().all()
        return list(users), total

    async def soft_delete(self, user_id: int) -> bool:
        """Soft delete a user by setting is_active to False."""
        user = await self.get_by_id(user_id)
        if not user:
            return False
        user.is_active = False
        await self.db.flush()
        return True
