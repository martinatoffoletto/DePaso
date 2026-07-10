"""
Packages module repository for data access.
"""
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.shared.base_repository import BaseRepository
from src.app.modules.packages.models import Package


class PackageRepository(BaseRepository[Package]):
    """Repository for package data access."""

    def __init__(self, db: AsyncSession) -> None:
        super().__init__(Package, db)

    async def get_by_size(self, size: str) -> Package | None:
        """Get package spec by size category."""
        result = await self.db.execute(select(Package).where(Package.size == size))
        return result.scalar_one_or_none()

    async def list_active(self, skip: int = 0, limit: int = 20) -> tuple[list[Package], int]:
        """List all active package categories."""
        base = select(Package).where(Package.is_active == True)  # noqa: E712
        total = (
            await self.db.execute(select(func.count()).select_from(base.subquery()))
        ).scalar_one()
        packages = (await self.db.execute(base.offset(skip).limit(limit))).scalars().all()
        return list(packages), total
