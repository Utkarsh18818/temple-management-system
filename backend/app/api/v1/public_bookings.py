import uuid
from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.v1.public_auth import get_devotee_for_user
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.numbering import acquire_numbering_lock
from app.models import Seva, SevaBooking, SevaSlot, Temple, User


router = APIRouter(
    prefix="/public/bookings",
    tags=["Public Bookings"],
)


class PublicBookingCreateRequest(BaseModel):
    seva_id: uuid.UUID
    slot_id: uuid.UUID | None = None
    booking_date: date
    quantity: int = Field(default=1, ge=1, le=100)
    special_request: str | None = None


def _booking_response(booking: SevaBooking) -> dict:
    return {
        "id": booking.id,
        "booking_number": booking.booking_number,
        "temple_id": booking.temple_id,
        "devotee_id": booking.devotee_id,
        "seva_id": booking.seva_id,
        "slot_id": booking.slot_id,
        "booking_date": booking.booking_date,
        "quantity": booking.quantity,
        "amount": booking.amount,
        "status": booking.status,
        "payment_status": booking.payment_status,
        "special_request": booking.special_request,
    }


@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
)
def create_public_booking(
    payload: PublicBookingCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a booking for the currently authenticated public devotee.

    devotee_id is always resolved server-side from the authenticated user.
    """

    devotee = get_devotee_for_user(current_user, db)

    if not devotee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user is not linked to an active devotee.",
        )

    if not devotee.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Devotee account is inactive.",
        )

    temple = db.get(Temple, devotee.temple_id)
    if temple is None or not temple.is_active:
        raise HTTPException(404, "Temple not found or inactive")
    if payload.booking_date < datetime.now(ZoneInfo(temple.timezone or "Asia/Kolkata")).date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking date cannot be in the past.",
        )

    seva = db.get(Seva, payload.seva_id)

    if not seva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seva not found.",
        )

    if not seva.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This seva is not currently available.",
        )

    if not seva.is_online:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This seva is not available for online booking.",
        )

    if seva.temple_id != devotee.temple_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot book a seva belonging to another temple.",
        )

    slot = None

    if payload.slot_id:
        slot = db.execute(
            select(SevaSlot)
            .where(SevaSlot.id == payload.slot_id)
            .with_for_update()
        ).scalar_one_or_none()

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot not found.",
            )

        if slot.seva_id != seva.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected slot does not belong to this seva.",
            )

        if slot.slot_date != payload.booking_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected slot is not available for the selected booking date.",
            )

        if slot.status != "AVAILABLE":
            if slot.status == "FULL":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected slot is full.",
                )

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected slot is not available.",
            )

        remaining_capacity = max(
            slot.capacity - slot.booked_count,
            0,
        )

        if remaining_capacity <= 0:
            slot.status = "FULL"
            db.commit()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected slot is full.",
            )

        if payload.quantity > remaining_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only {remaining_capacity} booking(s) remaining "
                    "for the selected slot."
                ),
            )

    elif seva.requires_slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A slot is required for this seva.",
        )

    amount = seva.amount * payload.quantity

    # Serialize booking-number generation by booking date.
    numbering_scope = (
        f"booking:{payload.booking_date.strftime('%Y%m%d')}"
    )
    acquire_numbering_lock(db, numbering_scope)

    booking_count = db.scalar(
        select(func.count(SevaBooking.id)).where(
            SevaBooking.booking_date == payload.booking_date
        )
    ) or 0

    booking_number = (
        f"BK-{payload.booking_date.strftime('%Y%m%d')}-"
        f"{booking_count + 1:05d}"
    )

    booking = SevaBooking(
        booking_number=booking_number,
        temple_id=devotee.temple_id,
        devotee_id=devotee.id,
        seva_id=seva.id,
        slot_id=slot.id if slot else None,
        booking_date=payload.booking_date,
        quantity=payload.quantity,
        amount=amount,
        status="PENDING",
        payment_status="PENDING",
        special_request=payload.special_request,
    )

    db.add(booking)

    if slot:
        slot.booked_count += payload.quantity

        if slot.booked_count >= slot.capacity:
            slot.booked_count = slot.capacity
            slot.status = "FULL"
        else:
            slot.status = "AVAILABLE"

    db.commit()
    db.refresh(booking)

    return _booking_response(booking)


@router.get(
    "",
    response_model=dict,
)
def get_public_bookings(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return bookings belonging only to the authenticated public devotee.
    """

    devotee = get_devotee_for_user(current_user, db)

    if not devotee or not devotee.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user is not linked to an active devotee.",
        )

    offset = (page - 1) * limit

    total_count = db.scalar(
        select(func.count(SevaBooking.id)).where(
            SevaBooking.devotee_id == devotee.id
        )
    ) or 0

    bookings = db.scalars(
        select(SevaBooking)
        .where(SevaBooking.devotee_id == devotee.id)
        .order_by(
            SevaBooking.booking_date.desc(),
            SevaBooking.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
    ).all()

    return {
        "items": [_booking_response(booking) for booking in bookings],
        "page": page,
        "limit": limit,
        "total": total_count,
        "pages": (
            (total_count + limit - 1) // limit
            if total_count
            else 0
        ),
    }


@router.get(
    "/{booking_id}",
    response_model=dict,
)
def get_public_booking(
    booking_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return one booking only if it belongs to the authenticated devotee.
    """

    devotee = get_devotee_for_user(current_user, db)

    if not devotee or not devotee.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user is not linked to an active devotee.",
        )

    booking = db.scalar(
        select(SevaBooking).where(
            SevaBooking.id == booking_id,
            SevaBooking.devotee_id == devotee.id,
        )
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    return _booking_response(booking)
