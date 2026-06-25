"""
Pytest configuration and fixtures.
"""
import os

# Must be set before importing the app: disables slowapi on auth endpoints
# so tests can hit /auth/login y /auth/register freely.
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from src.app.main import create_app
from src.app.core.database import get_db
from src.app.shared.base_model import Base
from src.app.modules.auth.models import PasswordResetToken
from src.app.modules.carriers.models import Carrier
from src.app.modules.matching.models import MatchingWeight
from src.app.modules.packages.models import Package
from src.app.modules.routes.models import CarrierRoute
from src.app.modules.shipments.models import Rating, Shipment, ShipmentEvent
from src.app.modules.tracking.models import GpsTrace
from src.app.modules.users.models import User

# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override get_db dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    """Create test database and session."""
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create test client with overridden dependency.

    Uses TestClient as a context manager so Starlette's lifespan (startup /
    shutdown) runs for every test.  Without __enter__, app.state.classifier
    (set by the vision lifespan hook) would never be initialised and every
    request that touches the classifier would blow up with AttributeError.
    """
    app = create_app()
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db):
    """Create a test user."""
    from src.app.core.security import get_password_hash

    user = User(
        email="test@example.com",
        password_hash=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="User",
        phone_number="+1234567890",
        user_type="client",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
