"""
Scenario API endpoints.

All endpoints require JWT authentication and scope data to the authenticated user.
Scenarios are persisted to PostgreSQL via async SQLAlchemy.
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scenario import Scenario, ScenarioType, ScenarioResult, ScenarioInput, Message
from app.db.session import get_db
from app.db.store import (
    create_scenario as db_create_scenario,
    get_scenario as db_get_scenario,
    list_user_scenarios as db_list_user_scenarios,
    save_scenario as db_save_scenario,
    delete_scenario as db_delete_scenario,
)
from app.auth.dependencies import get_current_user_id
from app.agent.orchestrator import process_message

logger = logging.getLogger(__name__)

router = APIRouter()


class CreateScenarioRequest(BaseModel):
    type: ScenarioType
    title: Optional[str] = None


class MessageRequest(BaseModel):
    message: str


# ── Helpers: convert between SQLAlchemy row and Pydantic response model ──────

def _row_to_pydantic(row) -> Scenario:
    """Convert a ScenarioRow ORM object to the Pydantic Scenario response model."""
    return Scenario(
        id=str(row.id),
        user_id=str(row.user_id),
        type=row.type,
        title=row.title,
        inputs=[ScenarioInput(**inp) for inp in (row.inputs or [])],
        result=ScenarioResult(**row.result) if row.result else None,
        conversation=[Message(**msg) for msg in (row.conversation or [])],
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/", response_model=Scenario)
async def create_scenario(
    req: CreateScenarioRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db_create_scenario(db, user_id, req.type.value, req.title)
    return _row_to_pydantic(row)


@router.get("/", response_model=List[Scenario])
async def get_scenarios(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    rows = await db_list_user_scenarios(db, user_id)
    return [_row_to_pydantic(r) for r in rows]


@router.get("/{scenario_id}", response_model=Scenario)
async def get_scenario_by_id(
    scenario_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db_get_scenario(db, scenario_id, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return _row_to_pydantic(row)


@router.delete("/{scenario_id}")
async def delete_scenario(
    scenario_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    deleted = await db_delete_scenario(db, scenario_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return {"status": "deleted"}


@router.post("/{scenario_id}/message", response_model=Scenario)
async def send_message(
    scenario_id: str,
    req: MessageRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db_get_scenario(db, scenario_id, user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Build lightweight dict for the orchestrator (it doesn't need the ORM object)
    scenario_data = {
        "id": str(row.id),
        "user_id": str(row.user_id),
        "type": row.type,
        "inputs": row.inputs or [],
        "result": row.result,
        "conversation": row.conversation or [],
    }

    # Process the message through the agent orchestrator
    updated_data, agent_text = process_message(scenario_data, req.message)

    # Persist the updated state back to the database
    row.inputs = updated_data.get("inputs", row.inputs)
    row.result = updated_data.get("result")
    row.conversation = updated_data.get("conversation", row.conversation)

    row = await db_save_scenario(db, row)

    return _row_to_pydantic(row)
