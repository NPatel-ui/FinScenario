"""Create profiles and scenarios tables

Revision ID: 001
Revises: None
Create Date: 2026-07-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the scenario_type enum
    scenario_type_enum = sa.Enum(
        "rent_vs_buy", "lease_vs_buy_car", "debt_vs_invest", "custom",
        name="scenario_type",
    )

    # Create profiles table
    op.create_table(
        "profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True,
                  comment="References auth.users.id"),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("income_band", sa.Text(), nullable=True),
        sa.Column("housing_situation", sa.Text(), nullable=True),
        sa.Column("financial_goals", ARRAY(sa.Text()), nullable=True),
        sa.Column("debt_situation", sa.Text(), nullable=True),
        sa.Column("risk_tolerance", sa.Text(), nullable=True),
        sa.Column("notification_prefs", JSONB(), nullable=True),
        sa.Column("currency", sa.Text(), server_default="USD", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )

    # Create scenarios table
    op.create_table(
        "scenarios",
        sa.Column("id", UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("type", scenario_type_enum, nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("inputs", JSONB(), server_default=sa.text("'[]'::jsonb"),
                  nullable=False),
        sa.Column("result", JSONB(), nullable=True),
        sa.Column("conversation", JSONB(), server_default=sa.text("'[]'::jsonb"),
                  nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"],
                                ondelete="CASCADE"),
    )

    # Indexes
    op.create_index("ix_scenarios_user_id", "scenarios", ["user_id"])
    op.create_index("ix_scenarios_type", "scenarios", ["type"])


def downgrade() -> None:
    op.drop_index("ix_scenarios_type", table_name="scenarios")
    op.drop_index("ix_scenarios_user_id", table_name="scenarios")
    op.drop_table("scenarios")
    op.drop_table("profiles")

    # Drop the enum
    sa.Enum(name="scenario_type").drop(op.get_bind(), checkfirst=True)
