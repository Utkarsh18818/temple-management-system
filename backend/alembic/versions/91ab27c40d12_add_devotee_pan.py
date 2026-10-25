"""Store devotee PAN encrypted, with a separate display mask."""
from alembic import op
import sqlalchemy as sa

revision = "91ab27c40d12"
down_revision = "8c21a0b731e4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("devotees", sa.Column("pan_encrypted", sa.Text(), nullable=True))
    op.add_column("devotees", sa.Column("pan_masked", sa.String(10), nullable=True))
    op.add_column("donations", sa.Column("pan_encrypted", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("donations", "pan_encrypted")
    op.drop_column("devotees", "pan_masked")
    op.drop_column("devotees", "pan_encrypted")
