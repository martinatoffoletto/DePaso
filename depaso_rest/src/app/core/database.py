"""
Database configuration and session management.
Supports PostgreSQL+PostGIS for production and SQLite for local development.
"""
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session

from src.app.core.config import settings


def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


# Create engine — SQLite for dev, PostgreSQL for prod
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
    # SQLite needs this for FK support
    **({} if not _is_sqlite(settings.database_url) else {"connect_args": {"check_same_thread": False}}),
)

# PostGIS extension only for PostgreSQL
if not _is_sqlite(settings.database_url):
    try:
        from geoalchemy2 import Geography  # noqa: F401

        @event.listens_for(engine, "connect")
        def receive_connect(dbapi_conn: object, connection_record: object) -> None:
            """Enable PostGIS extension on connection."""
            cursor = dbapi_conn.cursor()
            try:
                cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis")
            except Exception:
                pass
            finally:
                cursor.close()
    except ImportError:
        pass  # geoalchemy2 not installed, skip PostGIS


# Session factory
SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


def get_db() -> Generator[Session, None, None]:
    """Dependency injection for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
