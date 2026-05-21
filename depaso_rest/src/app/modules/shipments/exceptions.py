"""
Shipment-specific exceptions.
"""
from src.app.shared.exceptions import NotFoundError, ValidationError


class ShipmentNotFoundError(NotFoundError):
    """Raised when a shipment is not found."""

    def __init__(self) -> None:
        super().__init__("Shipment", "SHIPMENT_NOT_FOUND")


class InvalidShipmentStatusError(ValidationError):
    """Raised when a shipment status transition is invalid."""

    def __init__(self, current: str, target: str) -> None:
        super().__init__(
            f"Cannot transition from '{current}' to '{target}'",
            "INVALID_STATUS_TRANSITION",
        )
