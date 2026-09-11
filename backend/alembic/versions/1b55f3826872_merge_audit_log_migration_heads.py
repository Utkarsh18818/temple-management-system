"""merge audit log migration heads

Revision ID: 1b55f3826872
Revises: 67aec3089c03, cf2bc9f63e1b
Create Date: 2026-09-10 16:33:02.407019

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b55f3826872'
down_revision: Union[str, Sequence[str], None] = ('67aec3089c03', 'cf2bc9f63e1b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
