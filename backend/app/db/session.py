"""
Async SQLAlchemy engine and session factory.

Reads DATABASE_URL from environment variables and provides a FastAPI dependency
`get_db` that yields an AsyncSession per request.
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# DATABASE_URL from .env should look like:
#   postgresql://user:pass@host:port/dbname
# We need to convert the scheme to postgresql+asyncpg for the async driver.
_raw_url = os.environ.get("DATABASE_URL", "")

if _raw_url.startswith("postgresql://"):
    DATABASE_URL = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgres://"):
    DATABASE_URL = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
else:
    DATABASE_URL = _raw_url  # may already have the right scheme or be empty

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=5,
    max_overflow=10,
) if DATABASE_URL else None

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
) if engine else None


async def get_db():
    """FastAPI dependency — yields one AsyncSession per request, then closes it."""
    if async_session_factory is None:
        raise RuntimeError(
            "DATABASE_URL is not configured. "
            "Set it in backend/.env to connect to Supabase PostgreSQL."
        )
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
