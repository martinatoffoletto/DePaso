"""
Organizations module models.

Three tables model the B2B (pyme) domain:
  - organizations: the company itself (fleet operator, merchant, or both).
  - organization_members: which users administer the org and with what role.
    The "org" role is derived from membership here, never from the JWT.
  - organization_carriers: which carriers belong to a fleet org. Unlinking sets
    status=inactive + unlinked_at, it never deletes the carrier/user.
"""
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)

from src.app.shared.base_model import Base, TimestampMixin
from src.app.shared.enums import (
    OrganizationCarrierStatus,
    OrganizationKind,
    OrganizationMemberRole,
)


class Organization(Base, TimestampMixin):
    """A B2B customer: fleet operator, merchant, or both."""

    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    cuit = Column(String(20), unique=True, nullable=False, index=True)
    kind = Column(String(20), nullable=False, default=OrganizationKind.MERCHANT)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)


class OrganizationMember(Base, TimestampMixin):
    """A user that administers an organization (owner or manager)."""

    __tablename__ = "organization_members"
    __table_args__ = (
        UniqueConstraint("org_id", "user_id", name="uq_org_member"),
    )

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False, default=OrganizationMemberRole.MANAGER)
    joined_at = Column(DateTime, nullable=True)


class OrganizationCarrier(Base, TimestampMixin):
    """Link between a fleet organization and one of its carriers."""

    __tablename__ = "organization_carriers"
    __table_args__ = (
        UniqueConstraint("org_id", "carrier_id", name="uq_org_carrier"),
    )

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    carrier_id = Column(Integer, ForeignKey("carriers.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default=OrganizationCarrierStatus.ACTIVE)
    linked_at = Column(DateTime, nullable=True)
    unlinked_at = Column(DateTime, nullable=True)
