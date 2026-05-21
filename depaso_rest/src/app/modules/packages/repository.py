"""
Packages module repository for data access.
"""
from sqlalchemy.orm import Session

from src.app.shared.base_repository import BaseRepository
from src.app.modules.packages.models import Package


class PackageRepository(BaseRepository[Package]):
    """Repository for package data access."""

    def __init__(self, db: Session) -> None:
        super().__init__(Package, db)

    def get_by_size(self, size: str) -> Package | None:
        """Get package spec by size category."""
        return self.db.query(Package).filter(Package.size == size).first()

    def list_active(self, skip: int = 0, limit: int = 20) -> tuple[list[Package], int]:
        """List all active package categories."""
        query = self.db.query(Package).filter(Package.is_active == True)
        total = query.count()
        packages = query.offset(skip).limit(limit).all()
        return packages, total
