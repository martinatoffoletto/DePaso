"""
User-specific exceptions.
"""
from src.app.shared.exceptions import NotFoundError, AlreadyExistsError


class UserNotFoundError(NotFoundError):
    """Raised when a user is not found."""

    def __init__(self) -> None:
        super().__init__("User", "USER_NOT_FOUND")


class UserAlreadyExistsError(AlreadyExistsError):
    """Raised when trying to create a user with an existing email."""

    def __init__(self) -> None:
        super().__init__("User", "USER_ALREADY_EXISTS")
