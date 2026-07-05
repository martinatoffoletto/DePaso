"""
Organizations module domain exceptions.
"""
from src.app.shared.exceptions import (
    AlreadyExistsError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
)


class OrganizationNotFoundError(NotFoundError):
    def __init__(self) -> None:
        super().__init__("Organization", "ORG_NOT_FOUND")


class OrganizationAlreadyExistsError(AlreadyExistsError):
    def __init__(self) -> None:
        super().__init__("Organization with this CUIT", "ORG_ALREADY_EXISTS")


class NotAnOrgMemberError(ForbiddenError):
    def __init__(self) -> None:
        super().__init__("User is not a member of any organization", "NOT_ORG_MEMBER")


class OrgKindNotAllowedError(ForbiddenError):
    def __init__(self, action: str) -> None:
        super().__init__(f"Organization kind does not allow: {action}", "ORG_KIND_FORBIDDEN")


class CarrierNotLinkableError(ValidationError):
    def __init__(self, message: str) -> None:
        super().__init__(message, "CARRIER_NOT_LINKABLE")
