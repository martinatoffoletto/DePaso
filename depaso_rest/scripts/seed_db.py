#!/usr/bin/env python3
"""
Seed script para desarrollo local.
Crea usuarios, carriers disponibles y paquetes de referencia.
Ejecutar desde depaso_rest/: python scripts/seed_db.py
"""
import sys
import os
from datetime import datetime, timedelta, timezone

# Asegurar que el path de src esté disponible
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.app.core.config import settings
from src.app.core.security import get_password_hash
from src.app.shared.base_model import Base
from src.app.modules.users.models import User
from src.app.modules.carriers.models import Carrier
from src.app.modules.packages.models import Package
from src.app.modules.shipments.models import Shipment


def _seed_shipments(db, client_user, carriers):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    client_id = client_user.id
    # carriers ordenados por id: [0]=moto, [1]=auto, [2]=van, [3]=bici
    c_lucia  = carriers[0].id
    c_marcos = carriers[1].id
    c_sofia  = carriers[2].id
    c_diego  = carriers[3].id

    shipments = [
        # Historial — entregados
        Shipment(
            client_id=client_id, carrier_id=c_lucia,
            package_size="s", status="delivered",
            modality="collaborative", assignment_mode="on_demand",
            origin_lat=-34.5972, origin_lon=-58.4297,
            destination_lat=-34.5875, destination_lon=-58.3930,
            weight_kg=0.3, estimated_price=3900.0, co2_savings_kg=1.8,
            description="Documentos legales, firma urgente",
            photo_url="https://picsum.photos/seed/shipment-xs-1/400/300",
            created_at=now - timedelta(days=15), updated_at=now - timedelta(days=15),
        ),
        Shipment(
            client_id=client_id, carrier_id=c_marcos,
            package_size="m", status="delivered",
            modality="dedicated", assignment_mode="on_demand",
            origin_lat=-34.6083, origin_lon=-58.4375,
            destination_lat=-34.6211, destination_lon=-58.3732,
            weight_kg=6.5, estimated_price=6900.0, co2_savings_kg=0.0,
            description="Notebook Dell en caja original, frágil",
            photo_url="https://picsum.photos/seed/shipment-m-1/400/300",
            created_at=now - timedelta(days=10), updated_at=now - timedelta(days=10),
        ),
        Shipment(
            client_id=client_id, carrier_id=c_diego,
            package_size="s", status="delivered",
            modality="collaborative", assignment_mode="on_demand",
            origin_lat=-34.5627, origin_lon=-58.4530,
            destination_lat=-34.6068, destination_lon=-58.4176,
            weight_kg=1.2, estimated_price=3900.0, co2_savings_kg=1.8,
            description="Ropa doblada en bolsa, sin fragil",
            photo_url="https://picsum.photos/seed/shipment-s-1/400/300",
            created_at=now - timedelta(days=7), updated_at=now - timedelta(days=7),
        ),
        Shipment(
            client_id=client_id, carrier_id=c_lucia,
            package_size="s", status="delivered",
            modality="collaborative", assignment_mode="on_demand",
            origin_lat=-34.5875, origin_lon=-58.3930,
            destination_lat=-34.6280, destination_lon=-58.4631,
            weight_kg=0.2, estimated_price=3900.0, co2_savings_kg=1.8,
            description="Sobre con contrato de alquiler",
            photo_url=None,
            created_at=now - timedelta(days=3), updated_at=now - timedelta(days=3),
        ),
        # Activos
        Shipment(
            client_id=client_id, carrier_id=c_sofia,
            package_size="m", status="in_transit",
            modality="collaborative", assignment_mode="on_demand",
            origin_lat=-34.5972, origin_lon=-58.4297,
            destination_lat=-34.6280, destination_lon=-58.4631,
            weight_kg=4.0, estimated_price=3900.0, co2_savings_kg=1.8,
            description="Auriculares Sony + cargador, caja sellada",
            photo_url="https://picsum.photos/seed/shipment-m-2/400/300",
            created_at=now - timedelta(hours=2), updated_at=now - timedelta(minutes=30),
        ),
        Shipment(
            client_id=client_id, carrier_id=c_marcos,
            package_size="l", status="assigned",
            modality="dedicated", assignment_mode="on_demand",
            origin_lat=-34.5875, origin_lon=-58.3930,
            destination_lat=-34.6083, destination_lon=-58.4375,
            weight_kg=18.0, estimated_price=6900.0, co2_savings_kg=0.0,
            description="Monitor 27 pulgadas, caja original con esquineros",
            photo_url="https://picsum.photos/seed/shipment-l-1/400/300",
            created_at=now - timedelta(hours=1), updated_at=now - timedelta(minutes=45),
        ),
        Shipment(
            client_id=client_id, carrier_id=None,
            package_size="s", status="pending",
            modality="collaborative", assignment_mode="on_demand",
            origin_lat=-34.5972, origin_lon=-58.4297,
            destination_lat=-34.6211, destination_lon=-58.3732,
            weight_kg=0.1, estimated_price=3900.0, co2_savings_kg=1.8,
            description=None,
            photo_url=None,
            created_at=now - timedelta(minutes=20), updated_at=now - timedelta(minutes=20),
        ),
    ]
    db.add_all(shipments)
    db.commit()
    print(f"✅ {len(shipments)} envíos de historial creados para cliente@depaso.com")


def seed():
    engine = create_engine(settings.database_url)
    Base.metadata.create_all(bind=engine)

    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        has_users = db.query(User).count() > 0
        has_shipments = db.query(Shipment).count() > 0

        if has_users and has_shipments:
            print("La base ya tiene datos completos. Salteando seed.")
            print("  (Para resetear: docker compose down -v && docker compose up -d)")
            return

        # ── Usuarios ──────────────────────────────────────────────────────────
        if has_users:
            print("ℹ️  Usuarios ya existentes, salteando creación de usuarios/carriers/packages.")
            # Recuperar usuarios y carriers existentes para crear envíos
            client_user = db.query(User).filter(User.email == "cliente@depaso.com").first()
            carriers = db.query(Carrier).order_by(Carrier.id).all()
            _seed_shipments(db, client_user, carriers)
            return
        users = [
            User(
                email="cliente@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Valentina",
                last_name="Rossi",
                phone_number="+541155550001",
                user_type="client",
                is_active=True,
                rating=4.7,
            ),
            User(
                email="lucia@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Lucia",
                last_name="Fernandez",
                phone_number="+541155550101",
                user_type="carrier",
                is_active=True,
                rating=4.9,
            ),
            User(
                email="marcos@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Marcos",
                last_name="Gutierrez",
                phone_number="+541155550102",
                user_type="carrier",
                is_active=True,
                rating=4.6,
            ),
            User(
                email="sofia@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Sofia",
                last_name="Perez",
                phone_number="+541155550103",
                user_type="carrier",
                is_active=True,
                rating=4.8,
            ),
            User(
                email="diego@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Diego",
                last_name="Torres",
                phone_number="+541155550104",
                user_type="carrier",
                is_active=True,
                rating=4.5,
            ),
            User(
                email="carlos@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Carlos",
                last_name="Medina",
                phone_number="+541155550105",
                user_type="carrier",
                is_active=True,
                rating=4.7,
            ),
            User(
                email="ana@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Ana",
                last_name="Gimenez",
                phone_number="+541155550106",
                user_type="carrier",
                is_active=True,
                rating=4.8,
            ),
            User(
                email="pablo@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Pablo",
                last_name="Romero",
                phone_number="+541155550107",
                user_type="carrier",
                is_active=True,
                rating=4.4,
            ),
        ]
        db.add_all(users)
        db.commit()
        for u in users:
            db.refresh(u)
        print(f"✅ {len(users)} usuarios creados")

        # ── Carriers (todos disponibles, verificados, con ubicación en AMBA) ──
        # Coordenadas reales de distintos barrios/municipios de AMBA
        carriers = [
            Carrier(
                user_id=users[1].id,  # Lucia
                company_name="Lucia Fernandez",
                vehicle_type="motorcycle",
                license_plate="A123BCD",
                capacity_kg=30.0,
                capacity_volume_m3=0.1,
                reputation=4.9,
                is_active=True,
                is_verified=True,
                is_available=True,
                current_lat=-34.5972,  # Palermo
                current_lon=-58.4297,
            ),
            Carrier(
                user_id=users[2].id,  # Marcos
                company_name="Marcos Envios",
                vehicle_type="car",
                license_plate="B456EFG",
                capacity_kg=100.0,
                capacity_volume_m3=0.5,
                reputation=4.6,
                is_active=True,
                is_verified=True,
                is_available=True,
                current_lat=-34.6083,  # Caballito
                current_lon=-58.4375,
            ),
            Carrier(
                user_id=users[3].id,  # Sofia
                company_name="Sofia Logistica",
                vehicle_type="van",
                license_plate="C789HIJ",
                capacity_kg=500.0,
                capacity_volume_m3=3.0,
                reputation=4.8,
                is_active=True,
                is_verified=True,
                is_available=True,
                current_lat=-34.6131,  # Boedo
                current_lon=-58.4187,
            ),
            Carrier(
                user_id=users[4].id,  # Diego
                company_name="Diego Bike Delivery",
                vehicle_type="bike",
                license_plate="D012KLM",
                capacity_kg=5.0,
                capacity_volume_m3=0.02,
                reputation=4.5,
                is_active=True,
                is_verified=True,
                is_available=True,
                current_lat=-34.5888,  # Belgrano
                current_lon=-58.4438,
            ),
            Carrier(
                user_id=users[5].id,  # Carlos
                company_name="Carlos Medina Motos",
                vehicle_type="motorcycle",
                license_plate="E345NOP",
                capacity_kg=25.0,
                capacity_volume_m3=0.08,
                reputation=4.7,
                is_active=True,
                is_verified=True,
                is_available=True,
                current_lat=-34.5749,  # Villa Urquiza
                current_lon=-58.4910,
            ),
            Carrier(
                user_id=users[6].id,  # Ana
                company_name="Ana Gimenez Envios",
                vehicle_type="car",
                license_plate="F678QRS",
                capacity_kg=80.0,
                capacity_volume_m3=0.4,
                reputation=4.8,
                is_active=True,
                is_verified=True,
                is_available=True,
                current_lat=-34.6280,  # Flores
                current_lon=-58.4631,
            ),
            Carrier(
                user_id=users[7].id,  # Pablo
                company_name="Pablo Romero Flete",
                vehicle_type="truck",
                license_plate="G901TUV",
                capacity_kg=1000.0,
                capacity_volume_m3=8.0,
                reputation=4.4,
                is_active=True,
                is_verified=True,
                is_available=True,
                current_lat=-34.6401,  # Liniers
                current_lon=-58.5231,
            ),
        ]
        db.add_all(carriers)
        db.commit()
        print(f"✅ {len(carriers)} carriers creados (verificados, disponibles, con ubicación)")

        # ── Catálogo de paquetes ───────────────────────────────────────────────
        packages = [
            Package(
                size="s",
                description="Paquetes pequeños y documentos",
                max_weight_kg=3.0,
                max_length_cm=35,
                max_width_cm=25,
                max_height_cm=15,
                estimated_volume_m3=0.013,
                base_price=2500.0,
                is_active=True,
            ),
            Package(
                size="m",
                description="Caja mediana / electrodoméstico chico",
                max_weight_kg=10.0,
                max_length_cm=60,
                max_width_cm=40,
                max_height_cm=40,
                estimated_volume_m3=0.096,
                base_price=3900.0,
                is_active=True,
            ),
            Package(
                size="l",
                description="Caja grande / TV / valija",
                max_weight_kg=30.0,
                max_length_cm=100,
                max_width_cm=60,
                max_height_cm=60,
                estimated_volume_m3=0.36,
                base_price=5500.0,
                is_active=True,
            ),
            Package(
                size="xl",
                description="Muebles / mudanzas",
                max_weight_kg=200.0,
                max_length_cm=200,
                max_width_cm=150,
                max_height_cm=150,
                estimated_volume_m3=4.5,
                base_price=15000.0,
                is_active=True,
            ),
        ]
        db.add_all(packages)
        db.commit()
        print(f"✅ {len(packages)} categorías de paquetes creadas")

        _seed_shipments(db, users[0], carriers)

        print()
        print("=" * 50)
        print("Seed completado. Credenciales de prueba:")
        print("  Cliente:  cliente@depaso.com / password123")
        print("  Carrier:  lucia@depaso.com   / password123")
        print("=" * 50)

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
