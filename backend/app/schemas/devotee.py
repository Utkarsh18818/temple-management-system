import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DevoteeCreate(BaseModel):
    first_name: str = Field(
        min_length=2,
        max_length=100,
    )

    last_name: str | None = Field(
        default=None,
        max_length=100,
    )

    email: EmailStr | None = None

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    address: str | None = None

    city: str | None = Field(
        default=None,
        max_length=100,
    )

    state: str | None = Field(
        default=None,
        max_length=100,
    )

    country: str = Field(
        default="India",
        max_length=100,
    )

    pincode: str | None = Field(
        default=None,
        max_length=10,
    )

    gotra: str | None = Field(
        default=None,
        max_length=100,
    )

    date_of_birth: str | None = Field(
        default=None,
        max_length=20,
    )

    notes: str | None = None


class DevoteeUpdate(BaseModel):
    first_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    last_name: str | None = Field(
        default=None,
        max_length=100,
    )

    email: EmailStr | None = None

    phone: str | None = Field(
        default=None,
        max_length=20,
    )

    address: str | None = None

    city: str | None = Field(
        default=None,
        max_length=100,
    )

    state: str | None = Field(
        default=None,
        max_length=100,
    )

    country: str | None = Field(
        default=None,
        max_length=100,
    )

    pincode: str | None = Field(
        default=None,
        max_length=10,
    )

    gotra: str | None = Field(
        default=None,
        max_length=100,
    )

    date_of_birth: str | None = Field(
        default=None,
        max_length=20,
    )

    notes: str | None = None


class DevoteeStatusUpdate(BaseModel):
    is_active: bool


class DevoteeResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID
    temple_id: uuid.UUID

    first_name: str
    last_name: str | None

    email: str | None
    phone: str | None

    address: str | None
    city: str | None
    state: str | None
    country: str
    pincode: str | None

    gotra: str | None
    date_of_birth: str | None

    is_verified: bool
    is_active: bool

    notes: str | None