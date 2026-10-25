import uuid
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.models.base import Base, TimestampMixin, UUIDMixin


class Donation(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "donations"

    pan_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)

    temple_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("temples.id"),
        nullable=False,
        index=True,
    )

    devotee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devotees.id"),
        nullable=True,
        index=True,
    )

    donation_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    donation_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="GENERAL",
    )

    purpose: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    donor_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    donor_phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    donor_email: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    pan_number: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
        index=True,
    )

    donated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
