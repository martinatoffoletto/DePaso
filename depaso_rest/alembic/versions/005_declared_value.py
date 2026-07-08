"""shipment declared value

Adds shipments.declared_value (ARS) so the carrier can see what the package
is worth when deciding whether to accept the offer.

Revision ID: 005
Revises: 004
Create Date: 2026-07-07

"""
import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("shipments", sa.Column("declared_value", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("shipments", "declared_value")
