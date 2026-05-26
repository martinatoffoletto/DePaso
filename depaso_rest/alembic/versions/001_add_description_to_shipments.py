"""add description to shipments

Revision ID: 001
Revises:
Create Date: 2026-05-22
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    cols = [c["name"] for c in sa.inspect(bind).get_columns("shipments")]
    if "description" not in cols:
        op.add_column("shipments", sa.Column("description", sa.String(500), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    cols = [c["name"] for c in sa.inspect(bind).get_columns("shipments")]
    if "description" in cols:
        op.drop_column("shipments", "description")
