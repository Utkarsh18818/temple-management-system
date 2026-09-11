import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Receipt(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "receipts"

    __table_args__ = (
        Index(
            "uq_receipts_donation_id",
            "donation_id",
            unique=True,
            postgresql_where=text("donation_id IS NOT NULL"),
        ),
        Index(
            "uq_receipts_booking_id",
            "booking_id",
            unique=True,
            postgresql_where=text("booking_id IS NOT NULL"),
        ),
    )

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

    receipt_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    receipt_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    pdf_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )