"""
Demo seed script — creates a ready-to-demo dataset.

Run:  python -m scripts.seed_demo

Creates (idempotent — skips if the admin already exists):
  - admin@depaso.com / admin1234        (admin, dashboard access)
  - cliente@depaso.com / cliente1234    (client)
  - lucia@depaso.com / lucia1234        (carrier, moto, verified, on a route
                                         Caballito -> Microcentro)
  - carlos@depaso.com / carlos1234      (carrier, camion, verified, available)
  - 1 pending collaborative shipment on Lucia's route
  - 1 pending dedicated XL shipment for Carlos
"""
from datetime import datetime, timedelta, timezone

from src.app.core.database import SessionLocal, engine
from src.app.core.security import get_password_hash
from src.app.shared.base_model import Base
from src.app.modules.users.models import User
from src.app.modules.carriers.models import Carrier
from src.app.modules.packages.models import Package
from src.app.modules.routes.models import CarrierRoute
from src.app.modules.shipments.models import Shipment, ShipmentEvent, Rating  # noqa: F401
from src.app.modules.tracking.models import GpsTrace  # noqa: F401
from src.app.modules.vision.models import Classification  # noqa: F401
from src.app.modules.shipments import pricing
from src.app.shared.geo import Point

# AMBA reference coordinates
CABALLITO = (-34.6186, -58.4399)
MICROCENTRO = (-34.6037, -58.3816)
ALMAGRO = (-34.6103, -58.4209)   # on the Caballito->Microcentro corridor
BALVANERA = (-34.6092, -58.4017)
LANUS = (-34.7065, -58.3914)
QUILMES = (-34.7203, -58.2542)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "admin@depaso.com").first():
            print("Seed already applied — skipping.")
            return

        def user(email, pwd, first, last, utype):
            u = User(email=email, password_hash=get_password_hash(pwd),
                     first_name=first, last_name=last, user_type=utype)
            db.add(u)
            db.flush()
            return u

        admin = user("admin@depaso.com", "admin1234", "Admin", "DePaso", "admin")
        client = user("cliente@depaso.com", "cliente1234", "Juan", "García", "client")
        lucia_u = user("lucia@depaso.com", "lucia1234", "Lucía", "Fernández", "carrier")
        carlos_u = user("carlos@depaso.com", "carlos1234", "Carlos", "Gómez", "carrier")

        lucia = Carrier(user_id=lucia_u.id, company_name="Lucía Fernández",
                        vehicle_type="motorcycle", license_plate="A123BCD",
                        capacity_kg=15, reputation=4.9, is_active=True,
                        is_verified=True, is_available=True,
                        current_lat=CABALLITO[0], current_lon=CABALLITO[1])
        carlos = Carrier(user_id=carlos_u.id, company_name="Fletes Gómez",
                         vehicle_type="truck", license_plate="AD456EF",
                         capacity_kg=2000, reputation=4.7, is_active=True,
                         is_verified=True, is_available=True,
                         current_lat=QUILMES[0], current_lon=QUILMES[1])
        db.add_all([lucia, carlos])
        db.flush()

        # Package size catalog (spec 3.3) — límites y precio base por categoría
        db.add_all([
            Package(size="s", description="Paquetes pequeños y documentos", max_weight_kg=5,
                    max_length_cm=40, max_width_cm=30, max_height_cm=20, base_price=1300),
            Package(size="m", description="Caja mediana", max_weight_kg=15,
                    max_length_cm=60, max_width_cm=40, max_height_cm=40, base_price=1800),
            Package(size="l", description="Caja grande / electrodoméstico chico", max_weight_kg=30,
                    max_length_cm=100, max_width_cm=60, max_height_cm=60, base_price=2600),
            Package(size="xl", description="Mudanza / flete", max_weight_kg=500,
                    max_length_cm=300, max_width_cm=200, max_height_cm=200, base_price=6000),
        ])

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        db.add(CarrierRoute(
            carrier_id=lucia.id, kind="collaborative_route",
            origin_lat=CABALLITO[0], origin_lon=CABALLITO[1],
            destination_lat=MICROCENTRO[0], destination_lon=MICROCENTRO[1],
            window_start=now - timedelta(hours=1), window_end=now + timedelta(hours=8),
            recurrence_days="mon,tue,wed,thu,fri", is_active=True,
        ))

        def shipment(origin, dest, size, modality, weight, desc):
            price = pricing.price_for(Point(*origin), Point(*dest), size, modality)
            s = Shipment(
                client_id=client.id, package_size=size, status="pending",
                modality=modality, assignment_mode="on_demand",
                origin_lat=origin[0], origin_lon=origin[1],
                destination_lat=dest[0], destination_lon=dest[1],
                weight_kg=weight, description=desc, estimated_price=price,
            )
            db.add(s)
            db.flush()
            db.add(ShipmentEvent(shipment_id=s.id, status="pending",
                                 actor_user_id=client.id))
            return s

        shipment(ALMAGRO, BALVANERA, "s", "collaborative", 2.5,
                 "Caja chica con repuestos — va de paso por el corredor de Lucía")
        shipment(LANUS, QUILMES, "xl", "dedicated", 180,
                 "Mudanza chica: 1 sillón y 4 cajas")

        db.commit()
        print("Seed OK:")
        print("  admin@depaso.com / admin1234")
        print("  cliente@depaso.com / cliente1234")
        print("  lucia@depaso.com / lucia1234   (moto, ruta Caballito→Microcentro)")
        print("  carlos@depaso.com / carlos1234 (camión, Quilmes)")
        print("  2 envíos pendientes creados")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
