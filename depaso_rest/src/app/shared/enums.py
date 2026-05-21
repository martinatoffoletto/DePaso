"""
Shared enums used across multiple modules.
Centralizing enums prevents circular imports and ensures consistency.
"""
from enum import Enum


class UserType(str, Enum):
    """User type enumeration."""

    CLIENT = "client"
    CARRIER = "carrier"


class VehicleType(str, Enum):
    """Vehicle type enumeration matching the spec (section 2.2)."""

    PEDESTRIAN = "pedestrian"
    BIKE = "bike"
    MOTORCYCLE = "motorcycle"
    CAR = "car"
    VAN = "van"
    TRUCK = "truck"


class PackageSize(str, Enum):
    """Package size categories from the AI classifier (section 5.1)."""

    XS = "xs"   # Documentos, sobres
    S = "s"     # Caja chica, libro
    M = "m"     # Caja mediana, electrodoméstico chico
    L = "l"     # Caja grande, TV, valija
    XL = "xl"   # Muebles, mudanzas (freight)


class ShipmentStatus(str, Enum):
    """Shipment lifecycle states (RF-SHP-05)."""

    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class ShipmentModality(str, Enum):
    """Shipment modality (section 3)."""

    DEDICATED = "dedicated"
    COLLABORATIVE = "collaborative"


class AssignmentMode(str, Enum):
    """Assignment sub-modality (section 3)."""

    ON_DEMAND = "on_demand"
    BY_AVAILABILITY = "by_availability"
