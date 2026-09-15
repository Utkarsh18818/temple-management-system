"""add razorpay order id to payments

Revision ID: 54016f51fc8a
Revises: 3eedc9614eff
Create Date: 2026-09-13
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "54016f51fc8a"
down_revision: Union[str, Sequence[str], None] = "3eedc9614eff"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column(
            "gateway_order_id",
            sa.String(length=150),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_payments_gateway_order_id",
        "payments",
        ["gateway_order_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_payments_gateway_order_id",
        table_name="payments",
    )

    op.drop_column(
        "payments",
        "gateway_order_id",
    )