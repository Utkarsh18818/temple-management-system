import uuid
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Seva(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "sevas"

    temple_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("temples.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    seva_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="GENERAL",
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    duration_minutes: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    max_bookings: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    requires_slot: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    is_online: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )