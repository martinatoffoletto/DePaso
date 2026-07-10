"""
Packages module service.
Business logic for package catalog management.
"""
from src.app.modules.packages.repository import PackageRepository
from src.app.modules.packages.models import Package
from src.app.shared.exceptions import NotFoundError


class PackageNotFoundError(NotFoundError):
    """Raised when a package category is not found."""
    def __init__(self) -> None:
        super().__init__("Package", "PACKAGE_NOT_FOUND")


class PackageService:
    """Service for package business logic."""

    def __init__(self, repository: PackageRepository) -> None:
        """Initialize with repository."""
        self.repository = repository

    async def get_by_id(self, package_id: int) -> Package:
        """Get a package by ID."""
        pkg = await self.repository.get_by_id(package_id)
        if not pkg:
            raise PackageNotFoundError()
        return pkg

    async def get_by_size(self, size: str) -> Package:
        """Get package spec by size category."""
        pkg = await self.repository.get_by_size(size)
        if not pkg:
            raise PackageNotFoundError()
        return pkg

    async def list_packages(self, skip: int = 0, limit: int = 20) -> tuple[list[Package], int]:
        """List all active package categories."""
        return await self.repository.list_active(skip, limit)

    async def create_package(self, **kwargs: object) -> Package:
        """Create a new package category (admin only)."""
        return await self.repository.create(**kwargs)
