"""
Packages module API router.
TODO: Implement package catalog endpoints.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/packages", tags=["packages"])


# TODO: Implement the following endpoints:
# GET /packages - List all package sizes
# GET /packages/{id} - Get specific package
# POST /packages - Create new package (admin only)
# PATCH /packages/{id} - Update package (admin only)
