import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_staff
from app.models import Devotee, Temple, User
from app.schemas.devotee import (
    DevoteeCreate,
    DevoteeResponse,
    DevoteeStatusUpdate,
    DevoteeUpdate,
)


router = APIRouter(
    prefix="/devotees",
    tags=["Devotees"],
)


def get_accessible_temple_id(
    current_user: User,
    requested_temple_id: uuid.UUID | None = None,
) -> uuid.UUID:
    """
    Resolve the temple that the current user can access.

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
                    "You can only access devotees "
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


def verify_devotee_access(
    devotee: Devotee,
    current_user: User,
) -> None:
    """
    Prevent temple-level users from accessing
    devotees belonging to another temple.
    """

    if (
        current_user.temple_id is not None
        and devotee.temple_id
        != current_user.temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot access devotees "
                "from another temple"
            ),
        )


@router.post(
    "",
    response_model=DevoteeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_devotee(
    request: DevoteeCreate,
    temple_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    target_temple_id = get_accessible_temple_id(
        current_user,
        temple_id,
    )

    verify_temple(
        target_temple_id,
        db,
    )

    duplicate_conditions = []

    if request.email:
        duplicate_conditions.append(
            Devotee.email == request.email
        )

    if request.phone:
        duplicate_conditions.append(
            Devotee.phone == request.phone
        )

    if duplicate_conditions:
        existing_devotee = db.scalar(
            select(Devotee).where(
                Devotee.temple_id
                == target_temple_id,
                or_(*duplicate_conditions),
            )
        )

        if existing_devotee:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Devotee with this email or phone "
                    "already exists in this temple"
                ),
            )

    devotee = Devotee(
        temple_id=target_temple_id,
        first_name=request.first_name,
        last_name=request.last_name,
        email=request.email,
        phone=request.phone,
        address=request.address,
        city=request.city,
        state=request.state,
        country=request.country,
        pincode=request.pincode,
        gotra=request.gotra,
        date_of_birth=request.date_of_birth,
        notes=request.notes,
        is_verified=False,
        is_active=True,
    )

    db.add(devotee)
    db.commit()
    db.refresh(devotee)

    return devotee


@router.get(
    "",
    response_model=list[DevoteeResponse],
)
def list_devotees(
    temple_id: uuid.UUID | None = Query(
        default=None
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
    current_user: User = Depends(require_staff),
):
    target_temple_id = get_accessible_temple_id(
        current_user,
        temple_id,
    )

    verify_temple(
        target_temple_id,
        db,
    )

    query = select(Devotee).where(
        Devotee.temple_id
        == target_temple_id
    )

    if is_active is not None:
        query = query.where(
            Devotee.is_active == is_active
        )

    if search:
        search_pattern = f"%{search}%"

        query = query.where(
            or_(
                Devotee.first_name.ilike(
                    search_pattern
                ),
                Devotee.last_name.ilike(
                    search_pattern
                ),
                Devotee.email.ilike(
                    search_pattern
                ),
                Devotee.phone.ilike(
                    search_pattern
                ),
            )
        )

    query = (
        query
        .order_by(
            Devotee.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


@router.get(
    "/{devotee_id}",
    response_model=DevoteeResponse,
)
def get_devotee(
    devotee_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    devotee = db.get(
        Devotee,
        devotee_id,
    )

    if not devotee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Devotee not found",
        )

    verify_devotee_access(
        devotee,
        current_user,
    )

    return devotee


@router.put(
    "/{devotee_id}",
    response_model=DevoteeResponse,
)
def update_devotee(
    devotee_id: uuid.UUID,
    request: DevoteeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    devotee = db.get(
        Devotee,
        devotee_id,
    )

    if not devotee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Devotee not found",
        )

    verify_devotee_access(
        devotee,
        current_user,
    )

    update_data = request.model_dump(
        exclude_unset=True
    )

    email = update_data.get(
        "email",
        devotee.email,
    )

    phone = update_data.get(
        "phone",
        devotee.phone,
    )

    duplicate_conditions = []

    if email:
        duplicate_conditions.append(
            Devotee.email == email
        )

    if phone:
        duplicate_conditions.append(
            Devotee.phone == phone
        )

    if duplicate_conditions:
        existing_devotee = db.scalar(
            select(Devotee).where(
                Devotee.temple_id
                == devotee.temple_id,
                Devotee.id
                != devotee.id,
                or_(*duplicate_conditions),
            )
        )

        if existing_devotee:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Another devotee with this "
                    "email or phone already exists "
                    "in this temple"
                ),
            )

    for field, value in update_data.items():
        setattr(
            devotee,
            field,
            value,
        )

    db.commit()
    db.refresh(devotee)

    return devotee


@router.patch(
    "/{devotee_id}/status",
    response_model=DevoteeResponse,
)
def update_devotee_status(
    devotee_id: uuid.UUID,
    request: DevoteeStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    devotee = db.get(
        Devotee,
        devotee_id,
    )

    if not devotee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Devotee not found",
        )

    verify_devotee_access(
        devotee,
        current_user,
    )

    devotee.is_active = request.is_active

    db.commit()
    db.refresh(devotee)

    return devotee
