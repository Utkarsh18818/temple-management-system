import uuid
from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Time, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class SevaSlot(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "seva_slots"

    seva_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sevas.id"),
        nullable=False,
        index=True,
    )

    slot_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    end_time: Mapped[time | None] = mapped_column(
        Time,
        nullable=True,
    )

    capacity: Mapped[int] = mapped_column(
        nullable=False,
        default=1,
    )

    booked_count: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="AVAILABLE",
    )

    __table_args__ = (
        UniqueConstraint(
            "seva_id",
            "slot_date",
            "start_time",
            name="uq_seva_slot",
        ),
    )


class SevaBooking(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "seva_bookings"

    temple_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("temples.id"),
        nullable=False,
        index=True,
    )

    devotee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devotees.id"),
        nullable=False,
        index=True,
    )

    seva_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sevas.id"),
        nullable=False,
        index=True,
    )

    slot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("seva_slots.id"),
        nullable=True,
        index=True,
    )

    booking_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    booking_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(
        nullable=False,
        default=1,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        index=True,
    )

    payment_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        index=True,
    )

    special_request: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )