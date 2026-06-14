"""
Packages module API router — catálogo de categorías S..XL (spec 3.3).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.app.core.database import get_db
from src.app.modules.admin.router import require_admin
from src.app.modules.packages.repository import PackageRepository
from src.app.modules.packages.schemas import PackageCreate, PackageResponse
from src.app.modules.packages.service import PackageNotFoundError, PackageService
from src.app.modules.users.models import User

router = APIRouter(prefix="/packages", tags=["packages"])


def get_package_service(db: Session = Depends(get_db)) -> PackageService:
    return PackageService(PackageRepository(db))


@router.get("", response_model=list[PackageResponse])
async def list_packages(
    service: PackageService = Depends(get_package_service),
):
    """List the active package size catalog (S..XL: límites y precio base)."""
    packages, _ = service.list_packages(limit=50)
    return [PackageResponse.model_validate(p) for p in packages]


@router.get("/{size}", response_model=PackageResponse)
async def get_package(
    size: str,
    service: PackageService = Depends(get_package_service),
):
    """Get one package category spec by size (s, m, l, xl)."""
    try:
        return PackageResponse.model_validate(service.get_by_size(size.lower()))
    except PackageNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package size not found")


@router.post("", response_model=PackageResponse, status_code=status.HTTP_201_CREATED)
async def create_package(
    data: PackageCreate,
    admin: User = Depends(require_admin),
    service: PackageService = Depends(get_package_service),
):
    """Create a package category (admin only)."""
    return PackageResponse.model_validate(service.create_package(**data.model_dump()))
