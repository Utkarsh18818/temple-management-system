import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SevaCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    code: str = Field(
        min_length=2,
        max_length=50,
    )

    description: str | None = None

    seva_type: str = Field(
        default="GENERAL",
        min_length=2,
        max_length=50,
    )

    amount: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        decimal_places=2,
    )

    duration_minutes: int | None = Field(
        default=None,
        ge=1,
    )

    max_bookings: int | None = Field(
        default=None,
        ge=1,
    )

    requires_slot: bool = False

    is_online: bool = True


class SevaUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    code: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    description: str | None = None

    seva_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    amount: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )

    duration_minutes: int | None = Field(
        default=None,
        ge=1,
    )

    max_bookings: int | None = Field(
        default=None,
        ge=1,
    )

    requires_slot: bool | None = None

    is_online: bool | None = None


class SevaStatusUpdate(BaseModel):
    is_active: bool


class SevaResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID
    temple_id: uuid.UUID

    name: str
    code: str
    description: str | None

    seva_type: str
    amount: Decimal

    duration_minutes: int | None
    max_bookings: int | None

    requires_slot: bool
    is_online: bool
    is_active: bool