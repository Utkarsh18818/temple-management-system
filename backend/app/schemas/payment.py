import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class PaymentCreate(BaseModel):
    donation_id: uuid.UUID | None = None
    booking_id: uuid.UUID | None = None

    amount: Decimal = Field(
        gt=0,
        decimal_places=2,
    )

    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=10,
    )

    payment_method: str = Field(
        min_length=2,
        max_length=30,
    )

    gateway: str | None = Field(
        default=None,
        max_length=50,
    )

    gateway_transaction_id: str | None = Field(
        default=None,
        max_length=150,
    )


class PaymentUpdate(BaseModel):
    status: str | None = Field(
        default=None,
        max_length=30,
    )

    gateway_transaction_id: str | None = Field(
        default=None,
        max_length=150,
    )

    paid_at: datetime | None = None

    failure_reason: str | None = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID
    temple_id: uuid.UUID

    donation_id: uuid.UUID | None
    booking_id: uuid.UUID | None

    transaction_id: str
    gateway_order_id: str | None

    amount: Decimal
    currency: str
    payment_method: str

    gateway: str | None
    gateway_transaction_id: str | None

    status: str
    paid_at: datetime | None
    failure_reason: str | None