"""
Reglas de carga compartidas entre shipments y matching (spec 3.3).

Viven en shared porque tanto la creación del envío (shipments) como el
ranking/feed (matching) deben aplicar exactamente las mismas restricciones:
si solo las filtrara el matching, un POST directo podría saltárselas.
"""
from src.app.shared.enums import PackageSize, VehicleType

# Vehicle -> categories it may carry (spec 3.3). Empty intersection = knockout.
CARGO_COMPATIBILITY: dict[str, set[str]] = {
    VehicleType.PEDESTRIAN: {PackageSize.S},
    VehicleType.BIKE:       {PackageSize.S},
    VehicleType.MOTORCYCLE: {PackageSize.S, PackageSize.M},
    VehicleType.CAR:        {PackageSize.S, PackageSize.M, PackageSize.L},
    VehicleType.VAN:        {PackageSize.S, PackageSize.M, PackageSize.L, PackageSize.XL},
    VehicleType.TRUCK:      {PackageSize.S, PackageSize.M, PackageSize.L, PackageSize.XL},
}

# Moves/freight (XL) are always dedicated, never collaborative (spec 3.3).
COLLABORATIVE_FORBIDDEN_SIZES = {PackageSize.XL}

# Peso máximo por categoría (kg) — coincide con las etiquetas del front
# (s ≤3, m ≤10, l ≤30, xl >30). El tope de XL es una cota de sanidad.
MAX_WEIGHT_KG: dict[str, float] = {
    PackageSize.S: 3.0,
    PackageSize.M: 10.0,
    PackageSize.L: 30.0,
    PackageSize.XL: 2000.0,
}

# Un flete/mudanza (XL) es por definición carga que excede la categoría L.
XL_MIN_WEIGHT_KG = 30.0


def cargo_compatible(vehicle_type: str, package_size: str) -> bool:
    """Hard filter: can this vehicle carry this package category? (spec 3.3)"""
    return package_size in CARGO_COMPATIBILITY.get(vehicle_type, set())
