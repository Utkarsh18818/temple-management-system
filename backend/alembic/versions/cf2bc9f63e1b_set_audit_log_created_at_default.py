"""set audit log created at default

Revision ID: cf2bc9f63e1b
Revises: 7502c1edf343
Create Date: 2026-09-10

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "cf2bc9f63e1b"
down_revision: Union[str, Sequence[str], None] = "7502c1edf343"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Set the database default for audit log created_at."""

    op.execute(
        """
        ALTER TABLE audit_logs
        ALTER COLUMN created_at SET DEFAULT now()
        """
    )


def downgrade() -> None:
    """Remove the database default for audit log created_at."""

    op.execute(
        """
        ALTER TABLE audit_logs
        ALTER COLUMN created_at DROP DEFAULT
        """
    )