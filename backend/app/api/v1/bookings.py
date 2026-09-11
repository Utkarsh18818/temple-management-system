import uuid
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.numbering import acquire_numbering_lock
from app.models import (
    Devotee,
    Seva,
    SevaBooking,
    SevaSlot,
    User,
)
from app.schemas.booking import (
    SevaBookingCreate,
    SevaBookingResponse,
    SevaBookingUpdate,
)


router = APIRouter(
    prefix="/bookings",
    tags=["Seva Bookings"],
)


def verify_booking_access(
    booking: SevaBooking,
    current_user: User,
) -> None:
    """
    Ensure the current user can access this booking.

    SUPER_ADMIN:
        Can access bookings from any temple.

    Temple-level users:
        Can only access bookings from their own temple.
    """

    if (
        current_user.temple_id is not None
        and booking.temple_id
        != current_user.temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot access bookings "
                "from another temple"
            ),
        )


def get_booking_or_404(
    booking_id: uuid.UUID,
    db: Session,
) -> SevaBooking:
    booking = db.get(
        SevaBooking,
        booking_id,
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    return booking


def generate_booking_number(
    booking_date,
    db: Session,
) -> str:
    """
    Generate a human-readable booking number.

    A PostgreSQL transaction-level advisory lock is acquired
    for the date-specific numbering scope before calculating
    the next sequence number.

    Example:
        BK-20260915-00001
    """

    date_prefix = booking_date.strftime("%Y%m%d")

    prefix = f"BK-{date_prefix}-"

    # Serialize booking number generation for this date.
    #
    # The lock is transaction-scoped and is automatically
    # released when the current transaction commits or rolls
    # back.
    acquire_numbering_lock(
        db,
        f"booking:{date_prefix}",
    )

    count = db.scalar(
        select(
            func.count(SevaBooking.id)
        ).where(
            SevaBooking.booking_number.like(
                f"{prefix}%"
            )
        )
    )

    sequence = (count or 0) + 1

    return f"{prefix}{sequence:05d}"


@router.post(
    "",
    response_model=SevaBookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    request: SevaBookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a seva booking.

    Validates:

    - Devotee exists
    - Seva exists and is active
    - Devotee belongs to the same temple as seva
    - Slot belongs to the selected seva
    - Slot date matches booking date
    - Slot is available
    - Requested quantity fits remaining capacity

    Amount is calculated automatically from:

        seva.amount × quantity
    """

    devotee = db.get(
        Devotee,
        request.devotee_id,
    )

    if not devotee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Devotee not found",
        )

    if not devotee.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Devotee is inactive",
        )

    seva = db.get(
        Seva,
        request.seva_id,
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

    if (
        current_user.temple_id is not None
        and seva.temple_id
        != current_user.temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot create bookings "
                "for another temple"
            ),
        )

    if devotee.temple_id != seva.temple_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Devotee and seva must belong "
                "to the same temple"
            ),
        )

    if (
        current_user.temple_id is not None
        and devotee.temple_id
        != current_user.temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot create bookings "
                "for another temple"
            ),
        )

    slot = None

    if request.slot_id is not None:
        slot = db.get(
            SevaSlot,
            request.slot_id,
        )

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seva slot not found",
            )

        if slot.seva_id != seva.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Selected slot does not belong "
                    "to the selected seva"
                ),
            )

        if slot.slot_date != request.booking_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Slot date must match "
                    "booking date"
                ),
            )

        if slot.status != "AVAILABLE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Selected slot is not available"
                ),
            )

        remaining_capacity = (
            slot.capacity
            - slot.booked_count
        )

        if request.quantity > remaining_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only {remaining_capacity} "
                    "booking(s) remaining for this slot"
                ),
            )

    elif seva.requires_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This seva requires a slot"
            ),
        )

    amount = seva.amount * request.quantity

    booking_number = generate_booking_number(
        request.booking_date,
        db,
    )

    booking = SevaBooking(
        temple_id=seva.temple_id,
        devotee_id=devotee.id,
        seva_id=seva.id,
        slot_id=(
            slot.id
            if slot
            else None
        ),
        booking_number=booking_number,
        booking_date=request.booking_date,
        quantity=request.quantity,
        amount=amount,
        status="PENDING",
        payment_status="PENDING",
        special_request=request.special_request,
    )

    db.add(booking)

    if slot:
        slot.booked_count += request.quantity

        if slot.booked_count >= slot.capacity:
            slot.status = "FULL"

    db.commit()
    db.refresh(booking)

    return booking


@router.get(
    "",
    response_model=list[SevaBookingResponse],
)
def list_bookings(
    temple_id: uuid.UUID | None = Query(
        default=None
    ),
    booking_date=None,
    booking_status: str | None = Query(
        default=None,
        alias="status",
        max_length=30,
    ),
    payment_status: str | None = Query(
        default=None,
        max_length=30,
    ),
    devotee_id: uuid.UUID | None = Query(
        default=None
    ),
    seva_id: uuid.UUID | None = Query(
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
    query = select(SevaBooking)

    if current_user.temple_id is not None:
        query = query.where(
            SevaBooking.temple_id
            == current_user.temple_id
        )
    elif temple_id is not None:
        query = query.where(
            SevaBooking.temple_id
            == temple_id
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "temple_id is required for SUPER_ADMIN"
            ),
        )

    if booking_date is not None:
        query = query.where(
            SevaBooking.booking_date
            == booking_date
        )

    if booking_status is not None:
        query = query.where(
            SevaBooking.status
            == booking_status
        )

    if payment_status is not None:
        query = query.where(
            SevaBooking.payment_status
            == payment_status
        )

    if devotee_id is not None:
        query = query.where(
            SevaBooking.devotee_id
            == devotee_id
        )

    if seva_id is not None:
        query = query.where(
            SevaBooking.seva_id
            == seva_id
        )

    query = (
        query
        .order_by(
            SevaBooking.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


@router.get(
    "/{booking_id}",
    response_model=SevaBookingResponse,
)
def get_booking(
    booking_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking_or_404(
        booking_id,
        db,
    )

    verify_booking_access(
        booking,
        current_user,
    )

    return booking


@router.put(
    "/{booking_id}",
    response_model=SevaBookingResponse,
)
def update_booking(
    booking_id: uuid.UUID,
    request: SevaBookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = get_booking_or_404(
        booking_id,
        db,
    )

    verify_booking_access(
        booking,
        current_user,
    )

    update_data = request.model_dump(
        exclude_unset=True
    )

    allowed_statuses = {
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
    }

    allowed_payment_statuses = {
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
    }

    if "status" in update_data:
        if (
            update_data["status"]
            not in allowed_statuses
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid booking status. "
                    "Allowed values: "
                    "PENDING, CONFIRMED, "
                    "CANCELLED, COMPLETED"
                ),
            )

    if "payment_status" in update_data:
        if (
            update_data["payment_status"]
            not in allowed_payment_statuses
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid payment status. "
                    "Allowed values: "
                    "PENDING, PAID, FAILED, REFUNDED"
                ),
            )

    if (
        update_data.get("status")
        == "CONFIRMED"
        and booking.status
        != "CONFIRMED"
    ):
        booking.confirmed_at = datetime.now(
            timezone.utc
        )

    if (
        update_data.get("status")
        == "CANCELLED"
        and booking.status
        != "CANCELLED"
    ):
        if booking.slot_id is not None:
            slot = db.get(
                SevaSlot,
                booking.slot_id,
            )

            if slot:
                slot.booked_count = max(
                    0,
                    slot.booked_count
                    - booking.quantity,
                )

                if (
                    slot.status == "FULL"
                    and slot.booked_count
                    < slot.capacity
                ):
                    slot.status = "AVAILABLE"

    for field, value in update_data.items():
        setattr(
            booking,
            field,
            value,
        )

    db.commit()
    db.refresh(booking)

    return booking