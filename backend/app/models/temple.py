import uuid

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Temple(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "temples"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(
        String(100),
        default="India",
        nullable=False,
    )
    pincode: Mapped[str | None] = mapped_column(String(10))

    phone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(150))
    website: Mapped[str | None] = mapped_column(String(255))

    timezone: Mapped[str] = mapped_column(
        String(50),
        default="Asia/Kolkata",
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )