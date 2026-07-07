"""shipment recipient contact (name + phone)

Adds shipments.recipient_name and shipments.recipient_phone so the assigned
carrier can reach the person receiving the package at the destination.

Revision ID: 004
Revises: 003
Create Date: 2026-07-08

"""
import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("shipments", sa.Column("recipient_name", sa.String(length=120), nullable=True))
    op.add_column("shipments", sa.Column("recipient_phone", sa.String(length=30), nullable=True))


def downgrade() -> None:
    op.drop_column("shipments", "recipient_phone")
    op.drop_column("shipments", "recipient_name")
