import uuid
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_temple_admin,
)
from app.models import Event, Festival, User
from app.schemas.event import (
    EventCreate,
    EventResponse,
    EventStatusUpdate,
    EventUpdate,
)


router = APIRouter(
    prefix="/events",
    tags=["Events"],
)


def verify_temple_access(
    temple_id: uuid.UUID,
    current_user: User,
) -> None:
    if (
        current_user.temple_id is not None
        and current_user.temple_id != temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You can only access events "
                "from your own temple"
            ),
        )


def get_event_or_404(
    event_id: uuid.UUID,
    db: Session,
) -> Event:
    event = db.get(
        Event,
        event_id,
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    return event


def validate_festival(
    festival_id: uuid.UUID | None,
    temple_id: uuid.UUID,
    db: Session,
) -> None:
    if festival_id is None:
        return

    festival = db.get(
        Festival,
        festival_id,
    )

    if not festival:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Festival not found",
        )

    if festival.temple_id != temple_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Festival does not belong "
                "to this temple"
            ),
        )


def validate_event_time(
    event: Event,
) -> None:
    if (
        event.end_time is not None
        and event.end_time <= event.start_time
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "end_time must be later "
                "than start_time"
            ),
        )


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    request: EventCreate,
    temple_id: uuid.UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_temple_admin),
):
    """
    Create an event for a temple.

    SUPER_ADMIN can create events for any temple.
    TEMPLE_ADMIN can create events only for their
    own temple.
    """

    verify_temple_access(
        temple_id,
        current_user,
    )

    validate_festival(
        request.festival_id,
        temple_id,
        db,
    )

    existing = db.scalar(
        select(Event).where(
            Event.temple_id == temple_id,
            Event.code == request.code,
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An event with this code "
                "already exists for this temple"
            ),
        )

    event = Event(
        temple_id=temple_id,
        festival_id=request.festival_id,
        name=request.name,
        code=request.code,
        description=request.description,
        event_date=request.event_date,
        start_time=request.start_time,
        end_time=request.end_time,
        location=request.location,
        organizer=request.organizer,
        max_capacity=request.max_capacity,
        is_online=request.is_online,
        is_active=request.is_active,
    )

    validate_event_time(event)

    db.add(event)

    try:
        db.commit()
        db.refresh(event)
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An event with this code "
                "already exists for this temple"
            ),
        )

    return event


@router.get(
    "",
    response_model=list[EventResponse],
)
def list_events(
    temple_id: uuid.UUID | None = Query(
        default=None
    ),
    festival_id: uuid.UUID | None = Query(
        default=None
    ),
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    event_date: date | None = Query(
        default=None
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
    is_online: bool | None = Query(
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
    List events with filtering, search,
    pagination and temple isolation.
    """

    query = select(Event)

    if current_user.temple_id is not None:
        query = query.where(
            Event.temple_id
            == current_user.temple_id
        )
    elif temple_id is not None:
        query = query.where(
            Event.temple_id
            == temple_id
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "temple_id is required for SUPER_ADMIN"
            ),
        )

    if festival_id is not None:
        query = query.where(
            Event.festival_id
            == festival_id
        )

    if search:
        search_pattern = f"%{search}%"

        query = query.where(
            or_(
                Event.name.ilike(search_pattern),
                Event.code.ilike(search_pattern),
                Event.location.ilike(
                    search_pattern
                ),
                Event.organizer.ilike(
                    search_pattern
                ),
            )
        )

    if event_date is not None:
        query = query.where(
            Event.event_date == event_date
        )

    if start_date is not None:
        query = query.where(
            Event.event_date >= start_date
        )

    if end_date is not None:
        query = query.where(
            Event.event_date <= end_date
        )

    if is_active is not None:
        query = query.where(
            Event.is_active == is_active
        )

    if is_online is not None:
        query = query.where(
            Event.is_online == is_online
        )

    query = (
        query
        .order_by(
            Event.event_date.asc(),
            Event.start_time.asc(),
            Event.name.asc(),
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


@router.get(
    "/{event_id}",
    response_model=EventResponse,
)
def get_event(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = get_event_or_404(
        event_id,
        db,
    )

    verify_temple_access(
        event.temple_id,
        current_user,
    )

    return event


@router.put(
    "/{event_id}",
    response_model=EventResponse,
)
def update_event(
    event_id: uuid.UUID,
    request: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_temple_admin),
):
    event = get_event_or_404(
        event_id,
        db,
    )

    verify_temple_access(
        event.temple_id,
        current_user,
    )

    if request.festival_id is not None:
        validate_festival(
            request.festival_id,
            event.temple_id,
            db,
        )

    if request.code is not None:
        existing = db.scalar(
            select(Event).where(
                Event.temple_id
                == event.temple_id,
                Event.code
                == request.code,
                Event.id
                != event.id,
            )
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "An event with this code "
                    "already exists for this temple"
                ),
            )

    update_data = request.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            event,
            field,
            value,
        )

    validate_event_time(event)

    if (
        event.max_capacity is not None
        and event.max_capacity <= 0
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_capacity must be greater than 0",
        )

    try:
        db.commit()
        db.refresh(event)
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An event with this code "
                "already exists for this temple"
            ),
        )

    return event


@router.patch(
    "/{event_id}/status",
    response_model=EventResponse,
)
def update_event_status(
    event_id: uuid.UUID,
    request: EventStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_temple_admin),
):
    event = get_event_or_404(
        event_id,
        db,
    )

    verify_temple_access(
        event.temple_id,
        current_user,
    )

    event.is_active = request.is_active

    db.commit()
    db.refresh(event)

    return event