import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ReceiptCreate(BaseModel):
    donation_id: uuid.UUID | None = None
    booking_id: uuid.UUID | None = None

    receipt_type: str = Field(
        min_length=2,
        max_length=30,
    )

    notes: str | None = None


class ReceiptResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID
    temple_id: uuid.UUID

    donation_id: uuid.UUID | None
    booking_id: uuid.UUID | None

    receipt_number: str
    amount: Decimal
    receipt_type: str

    issued_at: datetime
    pdf_path: str | None

    notes: str | None
    status: str = "ISSUED"
