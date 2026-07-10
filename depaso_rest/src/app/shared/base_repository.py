"""
Base repository with generic async CRUD operations.
Module-specific repositories inherit from this and add domain queries.

Repositories flush (make changes visible inside the current transaction and
populate IDs) but NEVER commit — the commit happens once per request in
get_db(). This keeps multi-step operations atomic.
"""
from typing import Generic, Type, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Generic repository providing standard CRUD operations.

    Usage:
        class UserRepository(BaseRepository[User]):
            def __init__(self, db: AsyncSession):
                super().__init__(User, db)

            async def get_by_email(self, email: str) -> User | None:
                result = await self.db.execute(select(User).where(User.email == email))
                return result.scalar_one_or_none()
    """

    def __init__(self, model: Type[T], db: AsyncSession) -> None:
        self.model = model
        self.db = db

    async def create(self, **kwargs: object) -> T:
        """Create a new entity (flushed, not committed)."""
        instance = self.model(**kwargs)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def get_by_id(self, entity_id: int) -> T | None:
        """Get an entity by its primary key."""
        result = await self.db.execute(
            select(self.model).where(self.model.id == entity_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self, skip: int = 0, limit: int = 20) -> tuple[list[T], int]:
        """List entities with pagination. Returns (items, total_count)."""
        total = (
            await self.db.execute(select(func.count()).select_from(self.model))
        ).scalar_one()
        result = await self.db.execute(select(self.model).offset(skip).limit(limit))
        return list(result.scalars().all()), total

    async def update(self, entity_id: int, **kwargs: object) -> T | None:
        """Update an entity by ID. Returns None if not found.

        Note: None values are skipped (partial-update semantics). To set a
        column to NULL, write an explicit repository method for it.
        """
        instance = await self.get_by_id(entity_id)
        if not instance:
            return None
        for key, value in kwargs.items():
            if value is not None:
                setattr(instance, key, value)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def delete(self, entity_id: int) -> bool:
        """Hard delete an entity by ID. Returns True if deleted."""
        instance = await self.get_by_id(entity_id)
        if not instance:
            return False
        await self.db.delete(instance)
        await self.db.flush()
        return True
