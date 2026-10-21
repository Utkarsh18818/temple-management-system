from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.devotee import Devotee
from app.models.role import Role
from app.models.temple import Temple
from app.models.user import User


router = APIRouter(
    prefix="/public/auth",
    tags=["Public Authentication"],
)


class PublicDevoteeRegisterRequest(BaseModel):
    temple_id: UUID
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    password: str = Field(min_length=8, max_length=72)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str = Field(default="India", max_length=100)
    pincode: str | None = Field(default=None, max_length=10)
    gotra: str | None = Field(default=None, max_length=100)
    date_of_birth: str | None = Field(default=None, max_length=20)


class PublicDevoteeLoginRequest(BaseModel):
    temple_id: UUID
    identifier: str = Field(min_length=1, max_length=255)
    password: str


class PublicDevoteeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    temple_id: UUID
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


class PublicDevoteeAuthResponse(BaseModel):
    access_token: str
    token_type: str
    devotee: PublicDevoteeResponse


def _validate_date_of_birth(value: str | None) -> str | None:
    if not value:
        return None

    value = value.strip()

    if not value:
        return None

    accepted_formats = (
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
    )

    for date_format in accepted_formats:
        try:
            datetime.strptime(value, date_format)
            return value
        except ValueError:
            continue

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid date_of_birth. Use YYYY-MM-DD.",
    )


def _to_public_devotee_response(
    devotee: Devotee,
) -> PublicDevoteeResponse:
    return PublicDevoteeResponse.model_validate(devotee)


def get_devotee_for_user(
    current_user: User,
    db: Session,
) -> Devotee | None:
    conditions = []

    if current_user.email:
        conditions.append(Devotee.email == current_user.email)

    if current_user.phone:
        conditions.append(Devotee.phone == current_user.phone)

    if not conditions:
        return None

    return db.scalar(
        select(Devotee).where(
            Devotee.temple_id == current_user.temple_id,
            or_(*conditions),
        )
    )


@router.post(
    "/register",
    response_model=PublicDevoteeAuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_public_devotee(
    payload: PublicDevoteeRegisterRequest,
    db: Session = Depends(get_db),
):
    temple = db.scalar(
        select(Temple).where(
            Temple.id == payload.temple_id,
            Temple.is_active.is_(True),
        )
    )

    if not temple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temple not found or inactive.",
        )

    email = str(payload.email).strip().lower()
    phone = payload.phone.strip() if payload.phone else None

    duplicate_user_conditions = [User.email == email]

    if phone:
        duplicate_user_conditions.append(User.phone == phone)

    existing_user = db.scalar(
        select(User).where(
            User.temple_id == payload.temple_id,
            or_(*duplicate_user_conditions),
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email or phone already exists.",
        )

    duplicate_devotee_conditions = [Devotee.email == email]

    if phone:
        duplicate_devotee_conditions.append(
            Devotee.phone == phone
        )

    existing_devotee = db.scalar(
        select(Devotee).where(
            Devotee.temple_id == payload.temple_id,
            or_(*duplicate_devotee_conditions),
        )
    )

    if existing_devotee:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A devotee with this email or phone already "
                "exists for this temple."
            ),
        )

    role = db.scalar(
        select(Role).where(
            Role.name == "VOLUNTEER",
        )
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Public devotee role is not configured.",
        )

    date_of_birth = _validate_date_of_birth(
        payload.date_of_birth
    )

    user = User(
        temple_id=payload.temple_id,
        role_id=role.id,
        first_name=payload.first_name.strip(),
        last_name=(
            payload.last_name.strip()
            if payload.last_name
            else None
        ),
        email=email,
        phone=phone,
        password_hash=hash_password(payload.password),
        is_active=True,
    )

    db.add(user)
    db.flush()

    devotee = Devotee(
        temple_id=payload.temple_id,
        first_name=payload.first_name.strip(),
        last_name=(
            payload.last_name.strip()
            if payload.last_name
            else None
        ),
        email=email,
        phone=phone,
        address=(
            payload.address.strip()
            if payload.address
            else None
        ),
        city=payload.city.strip() if payload.city else None,
        state=payload.state.strip() if payload.state else None,
        country=payload.country.strip(),
        pincode=(
            payload.pincode.strip()
            if payload.pincode
            else None
        ),
        gotra=payload.gotra.strip() if payload.gotra else None,
        date_of_birth=date_of_birth,
        is_verified=False,
        is_active=True,
    )

    db.add(devotee)
    db.commit()

    db.refresh(user)
    db.refresh(devotee)

    access_token = create_access_token(
        subject=str(user.id),
        role="VOLUNTEER",
        temple_id=str(user.temple_id),
    )

    return PublicDevoteeAuthResponse(
        access_token=access_token,
        token_type="bearer",
        devotee=_to_public_devotee_response(devotee),
    )


@router.post(
    "/login",
    response_model=PublicDevoteeAuthResponse,
)
def login_public_devotee(
    payload: PublicDevoteeLoginRequest,
    db: Session = Depends(get_db),
):
    identifier = payload.identifier.strip()

    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password.",
        )

    identifier_lower = identifier.lower()

    temple = db.get(Temple, payload.temple_id)
    if temple is None or not temple.is_active:
        raise HTTPException(404, "Temple portal not found or inactive")

    user = db.scalar(
        select(User).where(
            User.temple_id == payload.temple_id,
            or_(
                User.email == identifier_lower,
                User.phone == identifier,
            )
        )
    )

    if not user or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password for this temple. Accounts from other temples cannot sign in here.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    devotee = get_devotee_for_user(
        current_user=user,
        db=db,
    )

    if not devotee or not devotee.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active devotee profile not found.",
        )

    access_token = create_access_token(
        subject=str(user.id),
        role="VOLUNTEER",
        temple_id=str(user.temple_id),
    )

    return PublicDevoteeAuthResponse(
        access_token=access_token,
        token_type="bearer",
        devotee=_to_public_devotee_response(devotee),
    )


@router.get(
    "/me",
    response_model=PublicDevoteeResponse,
)
def get_public_devotee_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    devotee = get_devotee_for_user(
        current_user=current_user,
        db=db,
    )

    if not devotee or not devotee.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Devotee profile not found.",
        )

    return _to_public_devotee_response(devotee)
