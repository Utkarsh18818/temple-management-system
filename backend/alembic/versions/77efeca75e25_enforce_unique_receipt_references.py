"""enforce unique receipt references

Revision ID: 77efeca75e25
Revises: 532e66236847
Create Date: 2026-09-10 23:53:47.597853

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "77efeca75e25"
down_revision: Union[str, Sequence[str], None] = "532e66236847"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Enforce one receipt per donation and one receipt per booking."""
    op.create_index(
        "uq_receipts_donation_id",
        "receipts",
        ["donation_id"],
        unique=True,
        postgresql_where="donation_id IS NOT NULL",
    )

    op.create_index(
        "uq_receipts_booking_id",
        "receipts",
        ["booking_id"],
        unique=True,
        postgresql_where="booking_id IS NOT NULL",
    )


def downgrade() -> None:
    """Remove receipt reference uniqueness enforcement."""
    op.drop_index(
        "uq_receipts_booking_id",
        table_name="receipts",
    )

    op.drop_index(
        "uq_receipts_donation_id",
        table_name="receipts",
    )