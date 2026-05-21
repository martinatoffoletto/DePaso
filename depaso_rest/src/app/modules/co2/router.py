"""
CO2 module API router.
TODO: Implement CO2 calculation endpoints.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/co2", tags=["co2"])


# TODO: Implement the following endpoints:
# POST /co2/calculate - Calculate CO2 savings for a shipment
# GET /co2/summary - Get accumulated CO2 savings (platform-wide)
# GET /co2/user/{user_id} - Get user's CO2 savings history
