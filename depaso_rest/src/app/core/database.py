"""
Database configuration and session management (async SQLAlchemy).

- Async engine: asyncpg (PostgreSQL) / aiosqlite (SQLite for dev & tests).
- Transaction per request: get_db() commits once when the request handler
  finishes without raising, and rolls back otherwise. Repositories flush,
  they never commit — this keeps multi-write operations atomic.
- A sync engine is exported ONLY for CLI scripts (seed) that don't run
  inside an event loop.
"""
from typing import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

from src.app.core.config import settings


def _is_sqlite(url: str) -> bool:
    return url.startswith("sqlite")


def _async_url(url: str) -> str:
    """Map a friendly DATABASE_URL to its async driver equivalent."""
    if url.startswith("sqlite+aiosqlite"):
        return url
    if url.startswith("sqlite"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    if url.startswith("postgresql+asyncpg"):
        return url
    if url.startswith("postgresql+psycopg"):
        return url.replace("postgresql+psycopg", "postgresql+asyncpg", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _sync_url(url: str) -> str:
    """Map a friendly DATABASE_URL to its sync driver equivalent (scripts only)."""
    if url.startswith("sqlite+aiosqlite"):
        return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
    if url.startswith("postgresql+asyncpg"):
        return url.replace("postgresql+asyncpg", "postgresql+psycopg", 1)
    return url


_pool_kwargs = (
    {"connect_args": {"check_same_thread": False}}
    if _is_sqlite(settings.database_url)
    # pool_pre_ping detecta conexiones muertas (Supabase/Render cierran idles);
    # pool_recycle las renueva antes de que el servidor las corte.
    else {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": settings.db_pool_size,
        "max_overflow": settings.db_max_overflow,
    }
)

engine = create_async_engine(
    _async_url(settings.database_url),
    echo=settings.debug,
    **_pool_kwargs,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# Sync engine for CLI scripts (seed_demo, smoke_test) — not used by the API.
sync_engine = create_engine(_sync_url(settings.database_url), future=True)
SyncSessionLocal = sessionmaker(bind=sync_engine, autoflush=False, autocommit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Session per request with a single transaction: commit on success,
    rollback on any exception (atomicity — no partial writes)."""
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
