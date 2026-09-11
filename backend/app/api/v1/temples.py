import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_super_admin
from app.models import Temple, User
from app.schemas.temple import (
    TempleCreate,
    TempleResponse,
    TempleUpdate,
)


router = APIRouter(
    prefix="/temples",
    tags=["Temples"],
)


@router.post(
    "",
    response_model=TempleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_temple(
    request: TempleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    existing_temple = db.scalar(
        select(Temple).where(
            Temple.code == request.code
        )
    )

    if existing_temple:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Temple code already exists",
        )

    temple = Temple(
        name=request.name,
        code=request.code,
        description=request.description,
        address=request.address,
        city=request.city,
        state=request.state,
        country=request.country,
        pincode=request.pincode,
        phone=request.phone,
        email=request.email,
        website=request.website,
        timezone=request.timezone,
        is_active=True,
    )

    db.add(temple)
    db.commit()
    db.refresh(temple)

    return temple


@router.get(
    "",
    response_model=list[TempleResponse],
)
def list_temples(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    return db.scalars(
        select(Temple).order_by(Temple.name)
    ).all()


@router.get(
    "/{temple_id}",
    response_model=TempleResponse,
)
def get_temple(
    temple_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    temple = db.get(Temple, temple_id)

    if not temple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temple not found",
        )

    return temple


@router.put(
    "/{temple_id}",
    response_model=TempleResponse,
)
def update_temple(
    temple_id: uuid.UUID,
    request: TempleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    temple = db.get(Temple, temple_id)

    if not temple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temple not found",
        )

    update_data = request.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(temple, field, value)

    db.commit()
    db.refresh(temple)

    return temple


@router.patch(
    "/{temple_id}/status",
    response_model=TempleResponse,
)
def update_temple_status(
    temple_id: uuid.UUID,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    temple = db.get(Temple, temple_id)

    if not temple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temple not found",
        )

    temple.is_active = is_active

    db.commit()
    db.refresh(temple)

    return temple