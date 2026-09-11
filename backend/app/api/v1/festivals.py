import uuid
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_staff,
    require_temple_admin,
)
from app.models import Festival, User
from app.schemas.festival import (
    FestivalCreate,
    FestivalResponse,
    FestivalStatusUpdate,
    FestivalUpdate,
)


router = APIRouter(
    prefix="/festivals",
    tags=["Festivals"],
)


def verify_temple_access(
    temple_id: uuid.UUID,
    current_user: User,
) -> None:
    """
    Ensure temple-scoped users can only access
    their own temple.
    """

    if (
        current_user.temple_id is not None
        and current_user.temple_id != temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You can only access festivals "
                "from your own temple"
            ),
        )


def get_festival_or_404(
    festival_id: uuid.UUID,
    db: Session,
) -> Festival:
    festival = db.get(
        Festival,
        festival_id,
    )

    if not festival:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Festival not found",
        )

    return festival


@router.post(
    "",
    response_model=FestivalResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_festival(
    request: FestivalCreate,
    temple_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_temple_admin),
):
    """
    Create a festival for a temple.

    SUPER_ADMIN can create festivals for any temple.
    TEMPLE_ADMIN can create festivals only for their
    own temple.
    """

    verify_temple_access(
        temple_id,
        current_user,
    )

    existing = db.scalar(
        select(Festival).where(
            Festival.temple_id == temple_id,
            Festival.code == request.code,
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A festival with this code "
                "already exists for this temple"
            ),
        )

    festival = Festival(
        temple_id=temple_id,
        name=request.name,
        code=request.code,
        description=request.description,
        start_date=request.start_date,
        end_date=request.end_date,
        location=request.location,
        deity=request.deity,
        is_active=request.is_active,
    )

    db.add(festival)

    try:
        db.commit()
        db.refresh(festival)
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A festival with this code "
                "already exists for this temple"
            ),
        )

    return festival


@router.get(
    "",
    response_model=list[FestivalResponse],
)
def list_festivals(
    temple_id: uuid.UUID | None = Query(
        default=None
    ),
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    start_date: date | None = Query(
        default=None
    ),
    end_date: date | None = Query(
        default=None
    ),
    is_active: bool | None = Query(
        default=None
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
    """
    List festivals with search, date filtering,
    pagination and temple isolation.
    """

    query = select(Festival)

    if current_user.temple_id is not None:
        query = query.where(
            Festival.temple_id
            == current_user.temple_id
        )
    elif temple_id is not None:
        query = query.where(
            Festival.temple_id
            == temple_id
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "temple_id is required for SUPER_ADMIN"
            ),
        )

    if search:
        search_pattern = f"%{search}%"

        query = query.where(
            or_(
                Festival.name.ilike(search_pattern),
                Festival.code.ilike(search_pattern),
                Festival.deity.ilike(search_pattern),
                Festival.location.ilike(search_pattern),
            )
        )

    if start_date is not None:
        query = query.where(
            Festival.end_date >= start_date
        )

    if end_date is not None:
        query = query.where(
            Festival.start_date <= end_date
        )

    if is_active is not None:
        query = query.where(
            Festival.is_active == is_active
        )

    query = (
        query
        .order_by(
            Festival.start_date.asc(),
            Festival.name.asc(),
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


@router.get(
    "/{festival_id}",
    response_model=FestivalResponse,
)
def get_festival(
    festival_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a single festival.
    """

    festival = get_festival_or_404(
        festival_id,
        db,
    )

    verify_temple_access(
        festival.temple_id,
        current_user,
    )

    return festival


@router.put(
    "/{festival_id}",
    response_model=FestivalResponse,
)
def update_festival(
    festival_id: uuid.UUID,
    request: FestivalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_temple_admin),
):
    """
    Update festival details.
    """

    festival = get_festival_or_404(
        festival_id,
        db,
    )

    verify_temple_access(
        festival.temple_id,
        current_user,
    )

    if (
        request.start_date is not None
        and request.end_date is not None
        and request.end_date < request.start_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "end_date cannot be earlier "
                "than start_date"
            ),
        )

    if request.code is not None:
        existing = db.scalar(
            select(Festival).where(
                Festival.temple_id
                == festival.temple_id,
                Festival.code
                == request.code,
                Festival.id
                != festival.id,
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A festival with this code "
                    "already exists for this temple"
                ),
            )

    update_data = request.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            festival,
            field,
            value,
        )

    if (
        festival.end_date
        < festival.start_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "end_date cannot be earlier "
                "than start_date"
            ),
        )

    try:
        db.commit()
        db.refresh(festival)
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A festival with this code "
                "already exists for this temple"
            ),
        )

    return festival


@router.patch(
    "/{festival_id}/status",
    response_model=FestivalResponse,
)
def update_festival_status(
    festival_id: uuid.UUID,
    request: FestivalStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_temple_admin),
):
    """
    Activate or deactivate a festival.
    """

    festival = get_festival_or_404(
        festival_id,
        db,
    )

    verify_temple_access(
        festival.temple_id,
        current_user,
    )

    festival.is_active = request.is_active

    db.commit()
    db.refresh(festival)

    return festival