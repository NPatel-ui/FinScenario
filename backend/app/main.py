import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import scenarios
from app.auth.dependencies import get_current_user_id
from app.db.session import get_db
from app.db.store import get_profile, update_profile

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="FinScenario API")

# Add CORS middleware to allow frontend (React) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://fin-scenario-taupe.vercel.app",
        "https://fin-scenario-git-main-nitya-patels-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenarios.router, prefix="/api/scenarios", tags=["scenarios"])


# ── Auth endpoints ───────────────────────────────────────────────────────────

@app.get("/api/auth/me")
async def get_me(user_id: str = Depends(get_current_user_id)):
    """Return the authenticated user's ID (verified from JWT)."""
    return {"user_id": user_id}


# ── Profile endpoints ────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    location: Optional[str] = None
    income_band: Optional[str] = None
    housing_situation: Optional[str] = None
    financial_goals: Optional[List[str]] = None
    debt_situation: Optional[str] = None
    risk_tolerance: Optional[str] = None
    notification_prefs: Optional[dict] = None
    currency: Optional[str] = None


@app.get("/api/profile")
async def get_user_profile(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Fetch the authenticated user's profile."""
    profile = await get_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "id": str(profile.id),
        "location": profile.location,
        "income_band": profile.income_band,
        "housing_situation": profile.housing_situation,
        "financial_goals": profile.financial_goals,
        "debt_situation": profile.debt_situation,
        "risk_tolerance": profile.risk_tolerance,
        "notification_prefs": profile.notification_prefs,
        "currency": profile.currency,
    }


@app.put("/api/profile")
async def update_user_profile(
    req: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's profile (used by the onboarding wizard)."""
    data = req.model_dump(exclude_none=True)
    profile = await update_profile(db, user_id, data)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "id": str(profile.id),
        "location": profile.location,
        "income_band": profile.income_band,
        "housing_situation": profile.housing_situation,
        "financial_goals": profile.financial_goals,
        "debt_situation": profile.debt_situation,
        "risk_tolerance": profile.risk_tolerance,
        "notification_prefs": profile.notification_prefs,
        "currency": profile.currency,
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}
