import uuid
from datetime import date, time

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    String,
    Text,
    Time,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Event(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "events"

    temple_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("temples.id"),
        nullable=False,
        index=True,
    )

    festival_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("festivals.id"),
        nullable=True,
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

    event_date: Mapped[date] = mapped_column(
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

    location: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    organizer: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    max_capacity: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    is_online: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )