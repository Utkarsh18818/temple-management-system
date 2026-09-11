import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import Seva, Temple, User
from app.schemas.seva import (
    SevaCreate,
    SevaResponse,
    SevaStatusUpdate,
    SevaUpdate,
)


router = APIRouter(
    prefix="/sevas",
    tags=["Sevas"],
)


def get_accessible_temple_id(
    current_user: User,
    requested_temple_id: uuid.UUID | None = None,
) -> uuid.UUID:
    """
    Resolve the temple accessible to the current user.

    SUPER_ADMIN:
        Can access any temple when temple_id is provided.

    Temple-level users:
        Can only access their own temple.
    """

    if current_user.temple_id is not None:
        if (
            requested_temple_id is not None
            and requested_temple_id
            != current_user.temple_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can only access sevas "
                    "from your own temple"
                ),
            )

        return current_user.temple_id

    if requested_temple_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "temple_id is required for SUPER_ADMIN"
            ),
        )

    return requested_temple_id


def verify_temple(
    temple_id: uuid.UUID,
    db: Session,
) -> Temple:
    temple = db.get(
        Temple,
        temple_id,
    )

    if not temple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temple not found",
        )

    if not temple.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Temple is inactive",
        )

    return temple


def verify_seva_access(
    seva: Seva,
    current_user: User,
) -> None:
    """
    Prevent temple-level users from accessing
    sevas belonging to another temple.
    """

    if (
        current_user.temple_id is not None
        and seva.temple_id
        != current_user.temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot access sevas "
                "from another temple"
            ),
        )


@router.post(
    "",
    response_model=SevaResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_seva(
    request: SevaCreate,
    temple_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_temple_id = get_accessible_temple_id(
        current_user,
        temple_id,
    )

    verify_temple(
        target_temple_id,
        db,
    )

    existing_seva = db.scalar(
        select(Seva).where(
            Seva.temple_id == target_temple_id,
            Seva.code == request.code,
        )
    )

    if existing_seva:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Seva code already exists "
                "in this temple"
            ),
        )

    seva = Seva(
        temple_id=target_temple_id,
        name=request.name,
        code=request.code,
        description=request.description,
        seva_type=request.seva_type,
        amount=request.amount,
        duration_minutes=request.duration_minutes,
        max_bookings=request.max_bookings,
        requires_slot=request.requires_slot,
        is_online=request.is_online,
        is_active=True,
    )

    db.add(seva)
    db.commit()
    db.refresh(seva)

    return seva


@router.get(
    "",
    response_model=list[SevaResponse],
)
def list_sevas(
    temple_id: uuid.UUID | None = Query(
        default=None
    ),
    seva_type: str | None = Query(
        default=None,
        max_length=50,
    ),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=100,
    ),
    is_active: bool | None = Query(
        default=True
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_temple_id = get_accessible_temple_id(
        current_user,
        temple_id,
    )

    verify_temple(
        target_temple_id,
        db,
    )

    query = select(Seva).where(
        Seva.temple_id == target_temple_id
    )

    if seva_type:
        query = query.where(
            Seva.seva_type == seva_type
        )

    if is_active is not None:
        query = query.where(
            Seva.is_active == is_active
        )

    if search:
        search_pattern = f"%{search}%"

        query = query.where(
            Seva.name.ilike(search_pattern)
            | Seva.code.ilike(search_pattern)
            | Seva.description.ilike(
                search_pattern
            )
        )

    query = (
        query
        .order_by(Seva.name)
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


@router.get(
    "/{seva_id}",
    response_model=SevaResponse,
)
def get_seva(
    seva_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    seva = db.get(
        Seva,
        seva_id,
    )

    if not seva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seva not found",
        )

    verify_seva_access(
        seva,
        current_user,
    )

    return seva


@router.put(
    "/{seva_id}",
    response_model=SevaResponse,
)
def update_seva(
    seva_id: uuid.UUID,
    request: SevaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    seva = db.get(
        Seva,
        seva_id,
    )

    if not seva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seva not found",
        )

    verify_seva_access(
        seva,
        current_user,
    )

    update_data = request.model_dump(
        exclude_unset=True
    )

    if "code" in update_data:
        existing_seva = db.scalar(
            select(Seva).where(
                Seva.temple_id == seva.temple_id,
                Seva.code == update_data["code"],
                Seva.id != seva.id,
            )
        )

        if existing_seva:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Seva code already exists "
                    "in this temple"
                ),
            )

    for field, value in update_data.items():
        setattr(
            seva,
            field,
            value,
        )

    db.commit()
    db.refresh(seva)

    return seva


@router.patch(
    "/{seva_id}/status",
    response_model=SevaResponse,
)
def update_seva_status(
    seva_id: uuid.UUID,
    request: SevaStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    seva = db.get(
        Seva,
        seva_id,
    )

    if not seva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seva not found",
        )

    verify_seva_access(
        seva,
        current_user,
    )

    seva.is_active = request.is_active

    db.commit()
    db.refresh(seva)

    return seva