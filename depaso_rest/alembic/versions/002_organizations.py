"""organizations module (pymes): fleets, merchants, fleet carriers

Adds organizations, organization_members, organization_carriers and the
shipments.organization_id FK.

Revision ID: 002
Revises: 001
Create Date: 2026-07-05

"""
import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("cuit", sa.String(length=20), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("owner_user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cuit"),
    )
    op.create_index(op.f("ix_organizations_id"), "organizations", ["id"], unique=False)
    op.create_index(op.f("ix_organizations_cuit"), "organizations", ["cuit"], unique=False)
    op.create_index(
        op.f("ix_organizations_owner_user_id"), "organizations", ["owner_user_id"], unique=False
    )

    op.create_table(
        "organization_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("org_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("joined_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("org_id", "user_id", name="uq_org_member"),
    )
    op.create_index(
        op.f("ix_organization_members_id"), "organization_members", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_organization_members_org_id"), "organization_members", ["org_id"], unique=False
    )
    op.create_index(
        op.f("ix_organization_members_user_id"), "organization_members", ["user_id"], unique=False
    )

    op.create_table(
        "organization_carriers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("org_id", sa.Integer(), nullable=False),
        sa.Column("carrier_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("linked_at", sa.DateTime(), nullable=True),
        sa.Column("unlinked_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"]),
        sa.ForeignKeyConstraint(["carrier_id"], ["carriers.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("org_id", "carrier_id", name="uq_org_carrier"),
    )
    op.create_index(
        op.f("ix_organization_carriers_id"), "organization_carriers", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_organization_carriers_org_id"), "organization_carriers", ["org_id"], unique=False
    )
    op.create_index(
        op.f("ix_organization_carriers_carrier_id"),
        "organization_carriers", ["carrier_id"], unique=False,
    )

    with op.batch_alter_table("shipments") as batch:
        batch.add_column(sa.Column("organization_id", sa.Integer(), nullable=True))
        batch.create_foreign_key(
            "fk_shipments_organization_id", "organizations", ["organization_id"], ["id"]
        )
    op.create_index(
        op.f("ix_shipments_organization_id"), "shipments", ["organization_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_shipments_organization_id"), table_name="shipments")
    with op.batch_alter_table("shipments") as batch:
        batch.drop_constraint("fk_shipments_organization_id", type_="foreignkey")
        batch.drop_column("organization_id")

    op.drop_table("organization_carriers")
    op.drop_table("organization_members")
    op.drop_table("organizations")
