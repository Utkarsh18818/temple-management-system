import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Payment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "payments"

    temple_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("temples.id"),
        nullable=False,
        index=True,
    )

    donation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("donations.id"),
        nullable=True,
        index=True,
    )

    booking_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("seva_bookings.id"),
        nullable=True,
        index=True,
    )

    transaction_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="INR",
    )

    payment_method: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    gateway: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    gateway_transaction_id: Mapped[str | None] = mapped_column(
        String(150),
        unique=True,
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        index=True,
    )

    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    failure_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )