import uuid
from datetime import date, datetime, timezone

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
from app.core.dependencies import get_current_user, require_staff
from app.models import Seva, SevaSlot, User
from app.schemas.booking import (
    SevaSlotCreate,
    SevaSlotResponse,
    SevaSlotStatusUpdate,
    SevaSlotUpdate,
)


router = APIRouter(
    prefix="/sevas",
    tags=["Seva Slots"],
)


def verify_seva_access(
    seva: Seva,
    current_user: User,
) -> None:
    """
    Ensure the current user can access this seva.

    SUPER_ADMIN:
        Can access sevas from any temple.

    Temple-level users:
        Can only access sevas from their own temple.
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


def get_seva_or_404(
    seva_id: uuid.UUID,
    db: Session,
) -> Seva:
    seva = db.get(
        Seva,
        seva_id,
    )

    if not seva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seva not found",
        )

    if not seva.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seva is inactive",
        )

    return seva


def get_slot_or_404(
    slot_id: uuid.UUID,
    db: Session,
) -> SevaSlot:
    slot = db.get(
        SevaSlot,
        slot_id,
    )

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seva slot not found",
        )

    return slot


@router.post(
    "/{seva_id}/slots",
    response_model=SevaSlotResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_seva_slot(
    seva_id: uuid.UUID,
    request: SevaSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    seva = get_seva_or_404(
        seva_id,
        db,
    )

    verify_seva_access(
        seva,
        current_user,
    )

    if request.end_time is not None:
        if request.end_time <= request.start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "end_time must be later "
                    "than start_time"
                ),
            )

    existing_slot = db.scalar(
        select(SevaSlot).where(
            SevaSlot.seva_id == seva_id,
            SevaSlot.slot_date
            == request.slot_date,
            SevaSlot.start_time
            == request.start_time,
        )
    )

    if existing_slot:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A slot already exists for this date and start time",
        )

    if (
        seva.max_bookings is not None
        and request.capacity
        > seva.max_bookings
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Slot capacity cannot exceed "
                "the seva max_bookings"
            ),
        )

    slot = SevaSlot(
        seva_id=seva_id,
        slot_date=request.slot_date,
        start_time=request.start_time,
        end_time=request.end_time,
        capacity=request.capacity,
        booked_count=0,
        status="AVAILABLE",
    )

    db.add(slot)
    db.commit()
    db.refresh(slot)

    return slot


@router.get(
    "/{seva_id}/slots",
    response_model=list[SevaSlotResponse],
)
def list_seva_slots(
    seva_id: uuid.UUID,
    slot_date: date | None = Query(
        default=None
    ),
    slot_status: str | None = Query(
        default=None,
        alias="status",
        max_length=30,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    seva = get_seva_or_404(
        seva_id,
        db,
    )

    verify_seva_access(
        seva,
        current_user,
    )

    query = select(SevaSlot).where(
        SevaSlot.seva_id == seva_id
    )

    if slot_date is not None:
        query = query.where(
            SevaSlot.slot_date == slot_date
        )

    if slot_status is not None:
        query = query.where(
            SevaSlot.status == slot_status
        )

    query = query.order_by(
        SevaSlot.slot_date,
        SevaSlot.start_time,
    )

    return db.scalars(query).all()


@router.get(
    "/slots/{slot_id}",
    response_model=SevaSlotResponse,
)
def get_seva_slot(
    slot_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    slot = get_slot_or_404(
        slot_id,
        db,
    )

    seva = get_seva_or_404(
        slot.seva_id,
        db,
    )

    verify_seva_access(
        seva,
        current_user,
    )

    return slot


@router.put(
    "/slots/{slot_id}",
    response_model=SevaSlotResponse,
)
def update_seva_slot(
    slot_id: uuid.UUID,
    request: SevaSlotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    slot = get_slot_or_404(
        slot_id,
        db,
    )

    seva = get_seva_or_404(
        slot.seva_id,
        db,
    )

    verify_seva_access(
        seva,
        current_user,
    )

    update_data = request.model_dump(
        exclude_unset=True
    )

    new_start_time = update_data.get(
        "start_time",
        slot.start_time,
    )

    new_end_time = update_data.get(
        "end_time",
        slot.end_time,
    )

    if new_end_time is not None:
        if new_end_time <= new_start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "end_time must be later "
                    "than start_time"
                ),
            )

    new_capacity = update_data.get(
        "capacity",
        slot.capacity,
    )

    if new_capacity < slot.booked_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Capacity cannot be lower "
                "than booked_count"
            ),
        )

    if (
        seva.max_bookings is not None
        and new_capacity > seva.max_bookings
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Slot capacity cannot exceed "
                "the seva max_bookings"
            ),
        )

    new_date = update_data.get(
        "slot_date",
        slot.slot_date,
    )

    if (
        new_date != slot.slot_date
        or new_start_time != slot.start_time
    ):
        existing_slot = db.scalar(
            select(SevaSlot).where(
                SevaSlot.seva_id
                == slot.seva_id,
                SevaSlot.slot_date
                == new_date,
                SevaSlot.start_time
                == new_start_time,
                SevaSlot.id != slot.id,
            )
        )

        if existing_slot:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A slot already exists "
                    "for this date and start time"
                ),
            )

    for field, value in update_data.items():
        setattr(
            slot,
            field,
            value,
        )

    db.commit()
    db.refresh(slot)

    return slot


@router.patch(
    "/slots/{slot_id}/status",
    response_model=SevaSlotResponse,
)
def update_seva_slot_status(
    slot_id: uuid.UUID,
    request: SevaSlotStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    slot = get_slot_or_404(
        slot_id,
        db,
    )

    seva = get_seva_or_404(
        slot.seva_id,
        db,
    )

    verify_seva_access(
        seva,
        current_user,
    )

    allowed_statuses = {
        "AVAILABLE",
        "FULL",
        "CANCELLED",
        "COMPLETED",
    }

    if request.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid slot status. "
                "Allowed values: "
                "AVAILABLE, FULL, CANCELLED, COMPLETED"
            ),
        )

    if (
        request.status == "AVAILABLE"
        and slot.booked_count >= slot.capacity
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Cannot mark a fully booked "
                "slot as AVAILABLE"
            ),
        )

    slot.status = request.status

    db.commit()
    db.refresh(slot)

    return slot
