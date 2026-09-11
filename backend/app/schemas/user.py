import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    temple_id: uuid.UUID
    role: str = Field(
        pattern="^(TEMPLE_ADMIN|STAFF|PANDIT|VOLUNTEER)$"
    )

    email: EmailStr | None = None
    phone: str | None = None

    password: str = Field(min_length=8, max_length=72)

    first_name: str = Field(
        min_length=2,
        max_length=100,
    )

    last_name: str | None = Field(
        default=None,
        max_length=100,
    )


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    temple_id: uuid.UUID | None
    role_id: uuid.UUID

    email: str | None
    phone: str | None

    first_name: str
    last_name: str | None

    is_active: bool
    is_verified: bool


class UserStatusUpdate(BaseModel):
    is_active: bool