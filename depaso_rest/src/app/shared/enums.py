"""
Shared enums used across multiple modules.
Centralizing enums prevents circular imports and ensures consistency.
"""
from enum import Enum


class UserType(str, Enum):
    """User type enumeration."""

    CLIENT = "client"
    CARRIER = "carrier"
    ADMIN = "admin"


class VehicleType(str, Enum):
    """Vehicle type enumeration matching the spec (section 2.2)."""

    PEDESTRIAN = "pedestrian"
    BIKE = "bike"
    MOTORCYCLE = "motorcycle"
    CAR = "car"
    VAN = "van"
    TRUCK = "truck"


class PackageSize(str, Enum):
    """4 package categories from the AI classifier (section 5.1)."""

    S = "s"     # Paquetes pequeños y documentos
    M = "m"     # Cargas medianas
    L = "l"     # Cargas grandes o voluminosas
    XL = "xl"   # Mudanzas o fletes


class ShipmentStatus(str, Enum):
    """Shipment lifecycle states (RF-SHP-05, carrier milestones RF-CAR-05)."""

    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKUP_ARRIVED = "pickup_arrived"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    """Simulated payment lifecycle for a shipment (scope: la pasarela de pagos
    se simula en el prototipo). Escrow model that mirrors the 'dinero puesto vs
    ganado' narrative: the client pays up front (PAID = money held), and on
    delivery the carrier's share is released (RELEASED); a cancellation of an
    already-paid shipment is refunded (REFUNDED)."""

    PENDING = "pending"      # created, not yet paid
    PAID = "paid"            # client paid; platform holds the amount (simulated)
    RELEASED = "released"    # delivered; carrier payout released (minus commission)
    REFUNDED = "refunded"    # cancelled after payment; amount returned to client


class ShipmentModality(str, Enum):
    """Shipment modality (section 3)."""

    DEDICATED = "dedicated"
    COLLABORATIVE = "collaborative"


class AssignmentMode(str, Enum):
    """Assignment sub-modality (section 3)."""

    ON_DEMAND = "on_demand"
    BY_AVAILABILITY = "by_availability"


class OrganizationKind(str, Enum):
    """Type of B2B organization (pyme).

    fleet    -> owns a carrier fleet, manages carrier linking/unlinking.
    merchant -> uses DePaso for its own logistics, creates/schedules shipments.
    both     -> operates as fleet and merchant.
    """

    FLEET = "fleet"
    MERCHANT = "merchant"
    BOTH = "both"


class OrganizationMemberRole(str, Enum):
    """Role of a user inside an organization (the 'org' role is derived from
    membership, never stored in the JWT)."""

    OWNER = "owner"
    MANAGER = "manager"


class OrganizationCarrierStatus(str, Enum):
    """Link status between an organization and one of its carriers.

    Unlinking a carrier sets status=inactive and stamps unlinked_at; the
    underlying user/carrier is never deleted.
    """

    ACTIVE = "active"
    INACTIVE = "inactive"
