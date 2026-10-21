import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint, Index, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("temple_id", "email", name="uq_users_temple_email"),
        UniqueConstraint("temple_id", "phone", name="uq_users_temple_phone"),
        Index("uq_users_platform_email", "email", unique=True, postgresql_where=text("temple_id IS NULL"), sqlite_where=text("temple_id IS NULL")),
        Index("uq_users_platform_phone", "phone", unique=True, postgresql_where=text("temple_id IS NULL"), sqlite_where=text("temple_id IS NULL")),
    )

    temple_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("temples.id"),
        nullable=True,
    )

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id"),
        nullable=False,
    )

    email: Mapped[str | None] = mapped_column(
        String(150),
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str | None] = mapped_column(
        String(100)
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    last_login_at: Mapped[datetime | None] = mapped_column(
        nullable=True
    )
