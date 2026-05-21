"""
Domain and HTTP exceptions.
"""


class DomainException(Exception):
    """Base exception for domain errors."""

    def __init__(self, message: str, code: str = "UNKNOWN_ERROR") -> None:
        self.message = message
        self.code = code
        super().__init__(self.message)


class UserNotFoundError(DomainException):
    """Raised when a user is not found."""

    def __init__(self) -> None:
        super().__init__("User not found", "USER_NOT_FOUND")


class UserAlreadyExistsError(DomainException):
    """Raised when trying to create a user with an existing email."""

    def __init__(self) -> None:
        super().__init__("User already exists", "USER_ALREADY_EXISTS")


class InvalidCredentialsError(DomainException):
    """Raised when login credentials are invalid."""

    def __init__(self) -> None:
        super().__init__("Invalid email or password", "INVALID_CREDENTIALS")


class CarrierNotFoundError(DomainException):
    """Raised when a carrier is not found."""

    def __init__(self) -> None:
        super().__init__("Carrier not found", "CARRIER_NOT_FOUND")


class ShipmentNotFoundError(DomainException):
    """Raised when a shipment is not found."""

    def __init__(self) -> None:
        super().__init__("Shipment not found", "SHIPMENT_NOT_FOUND")
