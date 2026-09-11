import uuid

from pydantic import BaseModel, ConfigDict, EmailStr


class RegisterRequest(BaseModel):
    temple_id: uuid.UUID | None = None
    role_id: uuid.UUID
    email: EmailStr | None = None
    phone: str | None = None
    password: str
    first_name: str
    last_name: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


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