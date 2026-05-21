"""
Carrier-specific exceptions.
"""
from src.app.shared.exceptions import NotFoundError


class CarrierNotFoundError(NotFoundError):
    """Raised when a carrier is not found."""

    def __init__(self) -> None:
        super().__init__("Carrier", "CARRIER_NOT_FOUND")
