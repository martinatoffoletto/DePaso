"""
Pytest configuration and fixtures.

The app now uses an ASYNC engine (aiosqlite), while test fixtures seed data
with a plain sync session. Both engines point at the SAME file-based SQLite
database so the data the fixtures write is visible to the app under test.
(A :memory: database cannot be shared between two engines.)
"""
import os

# Must be set before importing the app: disables slowapi on auth endpoints
# so tests can hit /auth/login y /auth/register freely.
TEST_DB_FILE = "./depaso_test.db"
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
os.environ.setdefault("DATABASE_URL", f"sqlite:///{TEST_DB_FILE}")

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from src.app.main import create_app
from src.app.core.database import get_db, SessionLocal as AppAsyncSessionLocal
from src.app.shared.base_model import Base
from src.app.modules.auth.models import PasswordResetToken  # noqa: F401
from src.app.modules.carriers.models import Carrier  # noqa: F401
from src.app.modules.matching.models import MatchingWeight  # noqa: F401
from src.app.modules.routes.models import CarrierRoute  # noqa: F401
from src.app.modules.shipments.models import Rating, Shipment, ShipmentEvent  # noqa: F401
from src.app.modules.tracking.models import GpsTrace  # noqa: F401
from src.app.modules.users.models import User

# Sync engine for fixtures, over the same file the app's async engine uses.
engine = create_engine(
    f"sqlite:///{TEST_DB_FILE}",
    connect_args={"check_same_thread": False, "timeout": 30},
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def override_get_db():
    """Same semantics as prod get_db (commit per request), on the test DB."""
    async with AppAsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@pytest.fixture(scope="function")
def db():
    """Create test database and a sync session for seeding data."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
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
