"""
SQLAlchemy ORM models for the FinScenario database.

These map to tables in the Supabase PostgreSQL database.
The `profiles` table references `auth.users` (managed by Supabase Auth).
The `scenarios` table stores all user scenario data including conversation history and results.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Index, Enum as SAEnum,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        comment="References auth.users.id — set by the trigger, not by the app",
    )
    location = Column(Text, nullable=True)
    income_band = Column(Text, nullable=True)
    housing_situation = Column(Text, nullable=True)
    financial_goals = Column(ARRAY(Text), nullable=True)
    debt_situation = Column(Text, nullable=True)
    risk_tolerance = Column(Text, nullable=True)
    notification_prefs = Column(JSONB, nullable=True)
    currency = Column(Text, server_default="USD", nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


# The enum values must match the ScenarioType Pydantic enum exactly.
scenario_type_enum = SAEnum(
    "rent_vs_buy", "lease_vs_buy_car", "debt_vs_invest", "custom",
    name="scenario_type",
    create_type=True,
)


class ScenarioRow(Base):
    __tablename__ = "scenarios"
    __table_args__ = (
        Index("ix_scenarios_user_id", "user_id"),
        Index("ix_scenarios_type", "type"),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        comment="References auth.users.id, managed by Supabase",
    )
    type = Column(scenario_type_enum, nullable=False)
    title = Column(Text, nullable=True)
    inputs = Column(JSONB, server_default=text("'[]'::jsonb"), nullable=False)
    result = Column(JSONB, nullable=True)
    conversation = Column(JSONB, server_default=text("'[]'::jsonb"), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
