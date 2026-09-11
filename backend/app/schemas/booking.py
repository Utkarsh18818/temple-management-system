import uuid
from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SevaSlotCreate(BaseModel):
    slot_date: date
    start_time: time
    end_time: time | None = None

    capacity: int = Field(
        default=1,
        ge=1,
    )


class SevaSlotUpdate(BaseModel):
    slot_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None

    capacity: int | None = Field(
        default=None,
        ge=1,
    )

    status: str | None = Field(
        default=None,
        max_length=30,
    )


class SevaSlotStatusUpdate(BaseModel):
    status: str = Field(
        min_length=1,
        max_length=30,
    )


class SevaSlotResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID
    seva_id: uuid.UUID

    slot_date: date
    start_time: time
    end_time: time | None

    capacity: int
    booked_count: int
    status: str


class SevaBookingCreate(BaseModel):
    devotee_id: uuid.UUID
    seva_id: uuid.UUID
    slot_id: uuid.UUID | None = None

    booking_date: date

    quantity: int = Field(
        default=1,
        ge=1,
    )

    special_request: str | None = Field(
        default=None,
        max_length=500,
    )


class SevaBookingUpdate(BaseModel):
    status: str | None = Field(
        default=None,
        max_length=30,
    )

    payment_status: str | None = Field(
        default=None,
        max_length=30,
    )

    special_request: str | None = Field(
        default=None,
        max_length=500,
    )


class SevaBookingResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID
    temple_id: uuid.UUID

    devotee_id: uuid.UUID
    seva_id: uuid.UUID
    slot_id: uuid.UUID | None

    booking_number: str
    booking_date: date

    quantity: int
    amount: Decimal

    status: str
    payment_status: str

    special_request: str | None
    confirmed_at: datetime | None