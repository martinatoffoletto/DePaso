"""
Freight module API router.
TODO: Implement freight/mudanza endpoints.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/freight", tags=["freight"])


# TODO: Implement the following endpoints:
# POST /freight - Create freight shipment (always dedicated, van/truck only)
# GET /freight/{id} - Get freight shipment details
# GET /freight/available-carriers - List carriers for freight (van/truck only)
