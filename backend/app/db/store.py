"""
Database operations for scenarios and profiles.

All functions take an AsyncSession and use the verified user_id
from the JWT auth dependency for row-level scoping.
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ScenarioRow, Profile

logger = logging.getLogger(__name__)


# ── Scenarios ────────────────────────────────────────────────────────────────

async def create_scenario(
    db: AsyncSession,
    user_id: str,
    scenario_type: str,
    title: Optional[str] = None,
) -> ScenarioRow:
    """Create a new scenario row for the given user."""
    row = ScenarioRow(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        type=scenario_type,
        title=title,
        inputs=[],
        result=None,
        conversation=[],
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    logger.info(f"Created scenario {row.id} for user {user_id}")
    return row


async def get_scenario(
    db: AsyncSession,
    scenario_id: str,
    user_id: str,
) -> Optional[ScenarioRow]:
    """Fetch a single scenario, scoped to the authenticated user."""
    stmt = select(ScenarioRow).where(
        ScenarioRow.id == uuid.UUID(scenario_id),
        ScenarioRow.user_id == uuid.UUID(user_id),
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_user_scenarios(
    db: AsyncSession,
    user_id: str,
) -> list[ScenarioRow]:
    """List all scenarios for the authenticated user, newest first."""
    stmt = (
        select(ScenarioRow)
        .where(ScenarioRow.user_id == uuid.UUID(user_id))
        .order_by(ScenarioRow.updated_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def save_scenario(
    db: AsyncSession,
    row: ScenarioRow,
) -> ScenarioRow:
    """Persist updates to an existing scenario row."""
    row.updated_at = datetime.now(timezone.utc)
    merged = await db.merge(row)
    await db.commit()
    await db.refresh(merged)
    return merged


async def delete_scenario(
    db: AsyncSession,
    scenario_id: str,
    user_id: str,
) -> bool:
    """Delete a scenario. Returns True if a row was deleted."""
    row = await get_scenario(db, scenario_id, user_id)
    if row:
        await db.delete(row)
        await db.commit()
        return True
    return False


# ── Profiles ─────────────────────────────────────────────────────────────────

async def get_profile(
    db: AsyncSession,
    user_id: str,
) -> Optional[Profile]:
    """Fetch the profile for the authenticated user."""
    stmt = select(Profile).where(Profile.id == uuid.UUID(user_id))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def update_profile(
    db: AsyncSession,
    user_id: str,
    data: dict,
) -> Optional[Profile]:
    """Update profile fields for the authenticated user."""
    # Filter to only valid column names
    valid_fields = {
        "location", "income_band", "housing_situation", "financial_goals",
        "debt_situation", "risk_tolerance", "notification_prefs", "currency",
    }
    filtered = {k: v for k, v in data.items() if k in valid_fields}

    if not filtered:
        return await get_profile(db, user_id)

    filtered["updated_at"] = datetime.now(timezone.utc)

    stmt = (
        update(Profile)
        .where(Profile.id == uuid.UUID(user_id))
        .values(**filtered)
    )
    await db.execute(stmt)
    await db.commit()

    return await get_profile(db, user_id)
