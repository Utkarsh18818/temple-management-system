import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DonationCreate(BaseModel):
    devotee_id: uuid.UUID | None = None

    amount: Decimal = Field(
        gt=0,
        decimal_places=2,
    )

    donation_type: str = Field(
        default="GENERAL",
        min_length=2,
        max_length=50,
    )

    purpose: str | None = Field(
        default=None,
        max_length=200,
    )

    donor_name: str = Field(
        min_length=2,
        max_length=150,
    )

    donor_phone: str | None = Field(
        default=None,
        max_length=20,
    )

    donor_email: EmailStr | None = None

    pan_number: str | None = Field(
        default=None,
        max_length=20,
    )

    donated_at: datetime | None = None

    notes: str | None = None


class DonationUpdate(BaseModel):
    amount: Decimal | None = Field(
        default=None,
        gt=0,
        decimal_places=2,
    )

    donation_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    purpose: str | None = Field(
        default=None,
        max_length=200,
    )

    donor_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    donor_phone: str | None = Field(
        default=None,
        max_length=20,
    )

    donor_email: EmailStr | None = None

    pan_number: str | None = Field(
        default=None,
        max_length=20,
    )

    status: str | None = Field(
        default=None,
        max_length=30,
    )

    donated_at: datetime | None = None

    notes: str | None = None


class DonationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID
    temple_id: uuid.UUID

    devotee_id: uuid.UUID | None

    donation_number: str

    amount: Decimal
    donation_type: str

    purpose: str | None

    donor_name: str
    donor_phone: str | None
    donor_email: str | None

    pan_number: str | None

    status: str

    donated_at: datetime

    notes: str | None