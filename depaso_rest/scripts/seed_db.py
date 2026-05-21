#!/usr/bin/env python3
"""
Development database seeding script.
Creates sample data for testing and development.
"""
import sys
from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.app.core.config import settings
from src.app.core.security import get_password_hash
from src.app.modules.users.models import User, Base as UsersBase
from src.app.modules.carriers.models import Carrier, Base as CarriersBase
from src.app.modules.packages.models import Package, Base as PackagesBase


def seed_database():
    """Seed the database with sample data."""
    # Create engine and session
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    try:
        # Create tables
        UsersBase.metadata.create_all(bind=engine)
        CarriersBase.metadata.create_all(bind=engine)
        PackagesBase.metadata.create_all(bind=engine)

        # Check if data already exists
        if session.query(User).count() > 0:
            print("Database already seeded, skipping...")
            return

        # Create sample users
        users = [
            User(
                email="client1@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Juan",
                last_name="García",
                phone_number="+34600000001",
                user_type="client",
                is_active=True,
            ),
            User(
                email="client2@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="María",
                last_name="López",
                phone_number="+34600000002",
                user_type="client",
                is_active=True,
            ),
            User(
                email="carrier1@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Carlos",
                last_name="Pérez",
                phone_number="+34600000101",
                user_type="carrier",
                is_active=True,
            ),
            User(
                email="carrier2@depaso.com",
                password_hash=get_password_hash("password123"),
                first_name="Ana",
                last_name="Martínez",
                phone_number="+34600000102",
                user_type="carrier",
                is_active=True,
            ),
        ]
        session.add_all(users)
        session.commit()
        print(f"✅ Created {len(users)} users")

        # Create sample carriers
        carriers = [
            Carrier(
                user_id=users[2].id,  # Carlos
                company_name="CargoExpress",
                vehicle_type="van",
                license_plate="ABC-1234",
                capacity_kg=500.0,
                reputation=4.8,
                is_active=True,
            ),
            Carrier(
                user_id=users[3].id,  # Ana
                company_name="MoveIt Logistics",
                vehicle_type="truck",
                license_plate="XYZ-5678",
                capacity_kg=1000.0,
                reputation=4.9,
                is_active=True,
            ),
        ]
        session.add_all(carriers)
        session.commit()
        print(f"✅ Created {len(carriers)} carriers")

        # Create package sizes
        packages = [
            Package(
                size="xs",
                description="Extra small package",
                max_weight_kg=1.0,
                max_length_cm=20,
                max_width_cm=15,
                max_height_cm=10,
                base_price=5.0,
                is_active=True,
            ),
            Package(
                size="s",
                description="Small package",
                max_weight_kg=5.0,
                max_length_cm=40,
                max_width_cm=30,
                max_height_cm=20,
                base_price=10.0,
                is_active=True,
            ),
            Package(
                size="m",
                description="Medium package",
                max_weight_kg=20.0,
                max_length_cm=60,
                max_width_cm=40,
                max_height_cm=40,
                base_price=20.0,
                is_active=True,
            ),
            Package(
                size="l",
                description="Large package",
                max_weight_kg=50.0,
                max_length_cm=100,
                max_width_cm=60,
                max_height_cm=60,
                base_price=40.0,
                is_active=True,
            ),
            Package(
                size="xl",
                description="Extra large package",
                max_weight_kg=100.0,
                max_length_cm=150,
                max_width_cm=100,
                max_height_cm=100,
                base_price=80.0,
                is_active=True,
            ),
            Package(
                size="freight",
                description="Freight/mudanza",
                max_weight_kg=2000.0,
                max_length_cm=500,
                max_width_cm=250,
                max_height_cm=250,
                base_price=500.0,
                is_active=True,
            ),
        ]
        session.add_all(packages)
        session.commit()
        print(f"✅ Created {len(packages)} package sizes")

        print("\n✅ Database seeded successfully!")
        print(f"Users: {len(users)}")
        print(f"Carriers: {len(carriers)}")
        print(f"Package sizes: {len(packages)}")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        session.rollback()
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
