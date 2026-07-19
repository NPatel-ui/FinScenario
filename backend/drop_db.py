import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Load DATABASE_URL from .env
from dotenv import load_dotenv
load_dotenv(".env")

_raw_url = os.environ.get("DATABASE_URL", "")
if _raw_url.startswith("postgresql://"):
    _db_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    _db_url = _raw_url

async def main():
    engine = create_async_engine(_db_url, isolation_level="AUTOCOMMIT")
    async with engine.connect() as conn:
        try:
            print("Dropping alembic_version...")
            await conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;"))
            print("Dropping scenarios...")
            await conn.execute(text("DROP TABLE IF EXISTS scenarios CASCADE;"))
            print("Dropping profiles...")
            await conn.execute(text("DROP TABLE IF EXISTS profiles CASCADE;"))
            print("Dropping type scenario_type...")
            await conn.execute(text("DROP TYPE IF EXISTS scenario_type CASCADE;"))
            print("Done dropping.")
        except Exception as e:
            print(f"Error: {e}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
