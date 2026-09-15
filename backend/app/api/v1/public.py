import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Event, Festival, Seva, SevaSlot, Temple
from app.schemas.booking import SevaSlotResponse
from app.schemas.event import EventResponse
from app.schemas.festival import FestivalResponse
from app.schemas.seva import SevaResponse
from app.schemas.temple import TempleResponse


router = APIRouter(
    prefix="/public",
    tags=["Public Portal"],
)


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def get_active_temple(
    temple_id: uuid.UUID,
    db: Session,
) -> Temple:
    temple = db.get(
        Temple,
        temple_id,
    )

    if not temple or not temple.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temple not found",
        )

    return temple


def get_active_seva(
    seva_id: uuid.UUID,
    db: Session,
) -> Seva:
    seva = db.get(
        Seva,
        seva_id,
    )

    if (
        not seva
        or not seva.is_active
        or not seva.is_online
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seva not found",
        )

    temple = db.get(
        Temple,
        seva.temple_id,
    )

    if not temple or not temple.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seva not found",
        )

    return seva


# ---------------------------------------------------------
# Temples
# ---------------------------------------------------------

@router.get(
    "/temples",
    response_model=list[TempleResponse],
)
def list_public_temples(
    search: str | None = Query(
        default=None,
        max_length=150,
    ),
    city: str | None = Query(
        default=None,
        max_length=100,
    ),
    state: str | None = Query(
        default=None,
        max_length=100,
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
):
    query = select(Temple).where(
        Temple.is_active.is_(True)
    )

    if search:
        pattern = f"%{search}%"

        query = query.where(
            Temple.name.ilike(pattern)
            | Temple.code.ilike(pattern)
            | Temple.city.ilike(pattern)
        )

    if city:
        query = query.where(
            Temple.city.ilike(city)
        )

    if state:
        query = query.where(
            Temple.state.ilike(state)
        )

    query = (
        query
        .order_by(Temple.name.asc())
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


@router.get(
    "/temples/{temple_id}",
    response_model=TempleResponse,
)
def get_public_temple(
    temple_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    return get_active_temple(
        temple_id,
        db,
    )


# ---------------------------------------------------------
# Sevas
# ---------------------------------------------------------

@router.get(
    "/temples/{temple_id}/sevas",
    response_model=list[SevaResponse],
)
def list_public_sevas(
    temple_id: uuid.UUID,
    search: str | None = Query(
        default=None,
        max_length=150,
    ),
    seva_type: str | None = Query(
        default=None,
        max_length=50,
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
):
    get_active_temple(
        temple_id,
        db,
    )

    query = select(Seva).where(
        Seva.temple_id == temple_id,
        Seva.is_active.is_(True),
        Seva.is_online.is_(True),
    )

    if search:
        pattern = f"%{search}%"

        query = query.where(
            Seva.name.ilike(pattern)
            | Seva.code.ilike(pattern)
            | Seva.description.ilike(pattern)
        )

    if seva_type:
        query = query.where(
            Seva.seva_type == seva_type
        )

    query = (
        query
        .order_by(Seva.name.asc())
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


@router.get(
    "/sevas/{seva_id}",
    response_model=SevaResponse,
)
def get_public_seva(
    seva_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    return get_active_seva(
        seva_id,
        db,
    )


# ---------------------------------------------------------
# Events
# ---------------------------------------------------------

@router.get(
    "/temples/{temple_id}/events",
    response_model=list[EventResponse],
)
def list_public_events(
    temple_id: uuid.UUID,
    start_date: date | None = Query(
        default=None,
    ),
    end_date: date | None = Query(
        default=None,
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
):
    get_active_temple(
        temple_id,
        db,
    )

    query = select(Event).where(
        Event.temple_id == temple_id,
        Event.is_active.is_(True),
    )

    if start_date:
        query = query.where(
            Event.event_date >= start_date
        )

    if end_date:
        query = query.where(
            Event.event_date <= end_date
        )

    query = (
        query
        .order_by(
            Event.event_date.asc(),
            Event.start_time.asc(),
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


# ---------------------------------------------------------
# Festivals
# ---------------------------------------------------------

@router.get(
    "/temples/{temple_id}/festivals",
    response_model=list[FestivalResponse],
)
def list_public_festivals(
    temple_id: uuid.UUID,
    start_date: date | None = Query(
        default=None,
    ),
    end_date: date | None = Query(
        default=None,
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
):
    get_active_temple(
        temple_id,
        db,
    )

    query = select(Festival).where(
        Festival.temple_id == temple_id,
        Festival.is_active.is_(True),
    )

    if start_date:
        query = query.where(
            Festival.end_date >= start_date
        )

    if end_date:
        query = query.where(
            Festival.start_date <= end_date
        )

    query = (
        query
        .order_by(
            Festival.start_date.asc()
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


# ---------------------------------------------------------
# Seva Slots
# ---------------------------------------------------------

@router.get(
    "/sevas/{seva_id}/slots",
    response_model=list[SevaSlotResponse],
)
def list_public_seva_slots(
    seva_id: uuid.UUID,
    slot_date: date | None = Query(
        default=None,
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
):
    seva = get_active_seva(
        seva_id,
        db,
    )

    query = select(SevaSlot).where(
        SevaSlot.seva_id == seva.id,
        SevaSlot.status == "AVAILABLE",
        SevaSlot.booked_count < SevaSlot.capacity,
    )

    if slot_date:
        query = query.where(
            SevaSlot.slot_date == slot_date
        )
    else:
        query = query.where(
            SevaSlot.slot_date >= date.today()
        )

    query = (
        query
        .order_by(
            SevaSlot.slot_date.asc(),
            SevaSlot.start_time.asc(),
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()
