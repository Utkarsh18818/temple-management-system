import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TempleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    code: str = Field(min_length=2, max_length=50)
    description: str | None = None

    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str = "India"
    pincode: str | None = None

    phone: str | None = None
    email: EmailStr | None = None
    website: str | None = None

    timezone: str = "Asia/Kolkata"


class TempleUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    description: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    pincode: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    website: str | None = None
    timezone: str | None = None


class TempleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    code: str

    description: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str
    pincode: str | None

    phone: str | None
    email: str | None
    website: str | None

    timezone: str
    is_active: bool