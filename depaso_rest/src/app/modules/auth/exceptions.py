"""
Auth-specific exceptions.
"""
from src.app.shared.exceptions import DomainException


class InvalidCredentialsError(DomainException):
    """Raised when authentication fails."""

    def __init__(self) -> None:
        super().__init__("Invalid email or password", "INVALID_CREDENTIALS")


class TokenExpiredError(DomainException):
    """Raised when a token has expired."""

    def __init__(self) -> None:
        super().__init__("Token has expired", "TOKEN_EXPIRED")


class TokenInvalidError(DomainException):
    """Raised when a token is invalid."""

    def __init__(self) -> None:
        super().__init__("Invalid token", "TOKEN_INVALID")
