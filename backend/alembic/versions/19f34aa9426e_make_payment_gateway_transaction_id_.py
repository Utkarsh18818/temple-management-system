"""make payment gateway transaction id unique

Revision ID: 19f34aa9426e
Revises: 1b55f3826872
Create Date: 2026-09-10 22:29:44.241037

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '19f34aa9426e'
down_revision: Union[str, Sequence[str], None] = '1b55f3826872'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
