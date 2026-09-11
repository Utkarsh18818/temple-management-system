"""fix audit log created at default

Revision ID: 7502c1edf343
Revises: ac9c9f66d875
Create Date: 2026-09-10 16:24:43.755506

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7502c1edf343"
down_revision: Union[str, Sequence[str], None] = "ac9c9f66d875"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.alter_column(
        "audit_logs",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        existing_nullable=False,
    )

    op.create_index(
        op.f("ix_audit_logs_created_at"),
        "audit_logs",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f("ix_audit_logs_created_at"),
        table_name="audit_logs",
    )

    op.alter_column(
        "audit_logs",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        server_default=None,
        existing_nullable=False,
    )