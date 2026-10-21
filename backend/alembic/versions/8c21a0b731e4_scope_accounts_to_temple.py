"""Scope account identifiers to each temple; keep platform accounts unique."""
from alembic import op
import sqlalchemy as sa

revision = "8c21a0b731e4"
down_revision = "411d2ec9a4d3"
branch_labels = None
depends_on = None


def upgrade():
    for constraint in sa.inspect(op.get_bind()).get_unique_constraints("users"):
        if constraint["column_names"] in (["email"], ["phone"]):
            op.drop_constraint(constraint["name"], "users", type_="unique")
    op.create_unique_constraint("uq_users_temple_email", "users", ["temple_id", "email"])
    op.create_unique_constraint("uq_users_temple_phone", "users", ["temple_id", "phone"])
    op.create_index("uq_users_platform_email", "users", ["email"], unique=True, postgresql_where=sa.text("temple_id IS NULL"))
    op.create_index("uq_users_platform_phone", "users", ["phone"], unique=True, postgresql_where=sa.text("temple_id IS NULL"))


def downgrade():
    # This fails safely if identifiers now exist in multiple temples. It never
    # deletes or merges accounts to force a downgrade.
    op.create_unique_constraint("users_email_key", "users", ["email"])
    op.create_unique_constraint("users_phone_key", "users", ["phone"])
    op.drop_index("uq_users_platform_email", table_name="users")
    op.drop_index("uq_users_platform_phone", table_name="users")
    op.drop_constraint("uq_users_temple_email", "users", type_="unique")
    op.drop_constraint("uq_users_temple_phone", "users", type_="unique")
