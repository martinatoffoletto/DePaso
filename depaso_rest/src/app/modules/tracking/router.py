"""
Tracking module API router.
TODO: Implement tracking endpoints.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/tracking", tags=["tracking"])


# TODO: Implement the following endpoints:
# POST /tracking/{shipment_id}/events - Create tracking event (RF-TRK-01)
# GET /tracking/{shipment_id} - Get current tracking status (RF-TRK-02)
# GET /tracking/{shipment_id}/history - Get tracking history (RF-TRK-03)
