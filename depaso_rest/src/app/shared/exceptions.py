"""
Base exception classes for the domain layer.
Module-specific exceptions should inherit from these base classes.
"""


class DomainException(Exception):
    """Base exception for domain errors."""

    def __init__(self, message: str, code: str = "UNKNOWN_ERROR") -> None:
        self.message = message
        self.code = code
        super().__init__(self.message)


class NotFoundError(DomainException):
    """Base class for entity-not-found errors."""

    def __init__(self, entity: str = "Resource", code: str = "NOT_FOUND") -> None:
        super().__init__(f"{entity} not found", code)


class AlreadyExistsError(DomainException):
    """Base class for duplicate-entity errors."""

    def __init__(self, entity: str = "Resource", code: str = "ALREADY_EXISTS") -> None:
        super().__init__(f"{entity} already exists", code)


class ValidationError(DomainException):
    """Raised when domain validation fails."""

    def __init__(self, message: str, code: str = "VALIDATION_ERROR") -> None:
        super().__init__(message, code)


class ForbiddenError(DomainException):
    """Raised when an action is not permitted."""

    def __init__(self, message: str = "Action not permitted", code: str = "FORBIDDEN") -> None:
        super().__init__(message, code)


class UnauthorizedError(DomainException):
    """Raised when authentication fails (missing/invalid credentials or token).

    Deliberately generic: auth endpoints must not reveal whether an email
    exists or an account is disabled.
    """

    def __init__(self, message: str = "Invalid credentials", code: str = "UNAUTHORIZED") -> None:
        super().__init__(message, code)
