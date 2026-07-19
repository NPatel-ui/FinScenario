"""
Alembic environment configuration for async PostgreSQL migrations.

Reads DATABASE_URL from .env and uses asyncpg for async migration execution.
Imports the ORM Base metadata for autogenerate support.
"""
import os
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# Load .env so DATABASE_URL is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Alembic Config object
config = context.config

# Set up loggers from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import ORM models so Alembic sees them for autogenerate
from app.db.models import Base  # noqa: E402
target_metadata = Base.metadata

# Build the async database URL
_raw_url = os.environ.get("DATABASE_URL", "")
if _raw_url.startswith("postgresql://"):
    _db_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgres://"):
    _db_url = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
else:
    _db_url = _raw_url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL without connecting."""
    context.configure(
        url=_db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    """Run migrations in 'online' mode with an async engine."""
    engine = create_async_engine(_db_url, poolclass=pool.NullPool)
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    """Entry point for online migrations."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
