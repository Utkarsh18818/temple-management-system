"""set audit log created at default

Revision ID: 67aec3089c03
Revises: 7502c1edf343
Create Date: 2026-09-10 16:29:30.476375

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '67aec3089c03'
down_revision: Union[str, Sequence[str], None] = '7502c1edf343'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
