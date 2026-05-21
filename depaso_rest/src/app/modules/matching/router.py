"""
Matching module API router.
TODO: Implement carrier matching endpoints.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/matching", tags=["matching"])


# TODO: Implement the following endpoints:
# POST /matching/{shipment_id}/score - Calculate scores for all carriers
# POST /matching/{shipment_id}/match - Find best carrier match
# GET /matching/{shipment_id}/ranked - Get ranked carriers by score
