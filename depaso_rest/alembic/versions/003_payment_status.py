"""shipment payment_status (simulated pasarela de pagos)

Adds shipments.payment_status to track the simulated payment lifecycle
(pending -> paid -> released / refunded). Existing delivered shipments are
backfilled to 'released' so the finance views stay coherent; everything else
defaults to 'pending'.

Revision ID: 003
Revises: 002
Create Date: 2026-07-07

"""
import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "shipments",
        sa.Column(
            "payment_status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
    )
    # Backfill: treat already-delivered shipments as paid-and-released so the
    # 'ganado' aggregates remain consistent with the escrow model.
    op.execute(
        "UPDATE shipments SET payment_status = 'released' WHERE status = 'delivered'"
    )


def downgrade() -> None:
    op.drop_column("shipments", "payment_status")
