import uuid
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_staff
from app.models import (
    Devotee,
    Donation,
    Event,
    Festival,
    SevaBooking,
    User,
    Temple,
)
from app.schemas.dashboard import (
    DashboardBookingItem,
    DashboardDonationItem,
    DashboardResponse,
    DashboardSummary,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


def resolve_temple_id(
    requested_temple_id: uuid.UUID | None,
    current_user: User,
) -> uuid.UUID:
    """
    Resolve the temple that the dashboard should display.

    Temple-scoped users always use their own temple.

    SUPER_ADMIN must explicitly provide a temple_id.
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
                    "You can only access the dashboard "
                    "for your own temple"
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


@router.get(
    "",
    response_model=DashboardResponse,
)
def get_dashboard(
    temple_id: uuid.UUID | None = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """
    Return the main TempleOS dashboard.

    Includes:

    - Donation statistics
    - Booking statistics
    - Devotee statistics
    - Festival statistics
    - Event statistics
    - Recent donations
    - Recent bookings
    """

    resolved_temple_id = resolve_temple_id(
        temple_id,
        current_user,
    )

    temple = db.get(Temple, resolved_temple_id)
    if temple is None:
        raise HTTPException(404, "Temple not found")
    temple_timezone = ZoneInfo(temple.timezone or "Asia/Kolkata")
    today = datetime.now(temple_timezone).date()

    month_start = today.replace(
        day=1
    )

    tomorrow = today + timedelta(
        days=1
    )

    month_start_datetime = datetime.combine(
        month_start,
        time.min,
        tzinfo=temple_timezone,
    )

    tomorrow_datetime = datetime.combine(
        tomorrow,
        time.min,
        tzinfo=temple_timezone,
    )

    today_datetime = datetime.combine(
        today,
        time.min,
        tzinfo=temple_timezone,
    )

    # ---------------------------------------------------------
    # Donation statistics
    # ---------------------------------------------------------

    total_donations = db.scalar(
        select(
            func.count(Donation.id)
        ).where(
            Donation.temple_id
            == resolved_temple_id
        )
    ) or 0

    completed_donations = db.scalar(
        select(
            func.count(Donation.id)
        ).where(
            Donation.temple_id
            == resolved_temple_id,
            Donation.status == "COMPLETED",
        )
    ) or 0

    pending_donations = db.scalar(
        select(
            func.count(Donation.id)
        ).where(
            Donation.temple_id
            == resolved_temple_id,
            Donation.status == "PENDING",
        )
    ) or 0

    today_donations = db.scalar(
        select(
            func.count(Donation.id)
        ).where(
            Donation.temple_id
            == resolved_temple_id,
            Donation.donated_at
            >= today_datetime,
            Donation.donated_at
            < tomorrow_datetime,
        )
    ) or 0

    month_donations = db.scalar(
        select(
            func.count(Donation.id)
        ).where(
            Donation.temple_id
            == resolved_temple_id,
            Donation.donated_at
            >= month_start_datetime,
            Donation.donated_at
            < tomorrow_datetime,
        )
    ) or 0

    total_donation_amount = db.scalar(
        select(
            func.coalesce(
                func.sum(Donation.amount),
                0,
            )
        ).where(
            Donation.temple_id
            == resolved_temple_id,
            Donation.status == "COMPLETED",
        )
    ) or Decimal("0.00")

    today_donation_amount = db.scalar(
        select(
            func.coalesce(
                func.sum(Donation.amount),
                0,
            )
        ).where(
            Donation.temple_id
            == resolved_temple_id,
            Donation.status == "COMPLETED",
            Donation.donated_at
            >= today_datetime,
            Donation.donated_at
            < tomorrow_datetime,
        )
    ) or Decimal("0.00")

    month_donation_amount = db.scalar(
        select(
            func.coalesce(
                func.sum(Donation.amount),
                0,
            )
        ).where(
            Donation.temple_id
            == resolved_temple_id,
            Donation.status == "COMPLETED",
            Donation.donated_at
            >= month_start_datetime,
            Donation.donated_at
            < tomorrow_datetime,
        )
    ) or Decimal("0.00")

    # ---------------------------------------------------------
    # Booking statistics
    # ---------------------------------------------------------

    total_bookings = db.scalar(
        select(
            func.count(SevaBooking.id)
        ).where(
            SevaBooking.temple_id
            == resolved_temple_id
        )
    ) or 0

    pending_bookings = db.scalar(
        select(
            func.count(SevaBooking.id)
        ).where(
            SevaBooking.temple_id
            == resolved_temple_id,
            SevaBooking.status == "PENDING",
        )
    ) or 0

    confirmed_bookings = db.scalar(
        select(
            func.count(SevaBooking.id)
        ).where(
            SevaBooking.temple_id
            == resolved_temple_id,
            SevaBooking.status == "CONFIRMED",
        )
    ) or 0

    completed_bookings = db.scalar(
        select(
            func.count(SevaBooking.id)
        ).where(
            SevaBooking.temple_id
            == resolved_temple_id,
            SevaBooking.status == "COMPLETED",
        )
    ) or 0

    cancelled_bookings = db.scalar(
        select(
            func.count(SevaBooking.id)
        ).where(
            SevaBooking.temple_id
            == resolved_temple_id,
            SevaBooking.status == "CANCELLED",
        )
    ) or 0

    today_bookings = db.scalar(
        select(
            func.count(SevaBooking.id)
        ).where(
            SevaBooking.temple_id
            == resolved_temple_id,
            SevaBooking.booking_date
            == today,
        )
    ) or 0

    # ---------------------------------------------------------
    # Devotee statistics
    # ---------------------------------------------------------

    total_devotees = db.scalar(
        select(
            func.count(Devotee.id)
        ).where(
            Devotee.temple_id
            == resolved_temple_id
        )
    ) or 0

    active_devotees = db.scalar(
        select(
            func.count(Devotee.id)
        ).where(
            Devotee.temple_id
            == resolved_temple_id,
            Devotee.is_active == True,
        )
    ) or 0

    new_devotees_this_month = db.scalar(
        select(
            func.count(Devotee.id)
        ).where(
            Devotee.temple_id
            == resolved_temple_id,
            Devotee.created_at
            >= month_start_datetime,
            Devotee.created_at
            < tomorrow_datetime,
        )
    ) or 0

    # ---------------------------------------------------------
    # Festival statistics
    # ---------------------------------------------------------

    active_festivals = db.scalar(
        select(
            func.count(Festival.id)
        ).where(
            Festival.temple_id
            == resolved_temple_id,
            Festival.is_active == True,
            Festival.start_date <= today,
            Festival.end_date >= today,
        )
    ) or 0

    # ---------------------------------------------------------
    # Event statistics
    # ---------------------------------------------------------

    today_events = db.scalar(
        select(
            func.count(Event.id)
        ).where(
            Event.temple_id
            == resolved_temple_id,
            Event.event_date == today,
            Event.is_active == True,
        )
    ) or 0

    upcoming_events = db.scalar(
        select(
            func.count(Event.id)
        ).where(
            Event.temple_id
            == resolved_temple_id,
            Event.event_date >= today,
            Event.is_active == True,
        )
    ) or 0

    # ---------------------------------------------------------
    # Recent donations
    # ---------------------------------------------------------

    recent_donations = db.scalars(
        select(Donation)
        .where(
            Donation.temple_id
            == resolved_temple_id
        )
        .order_by(
            Donation.donated_at.desc()
        )
        .limit(10)
    ).all()

    recent_donation_items = [
        DashboardDonationItem(
            id=str(donation.id),
            donation_number=donation.donation_number,
            donor_name=donation.donor_name,
            amount=donation.amount,
            donation_type=donation.donation_type,
            status=donation.status,
            donated_at=donation.donated_at,
        )
        for donation in recent_donations
    ]

    # ---------------------------------------------------------
    # Recent bookings
    # ---------------------------------------------------------

    recent_bookings = db.scalars(
        select(SevaBooking)
        .where(
            SevaBooking.temple_id
            == resolved_temple_id
        )
        .order_by(
            SevaBooking.created_at.desc()
        )
        .limit(10)
    ).all()

    recent_booking_items = [
        DashboardBookingItem(
            id=str(booking.id),
            booking_number=booking.booking_number,
            amount=booking.amount,
            status=booking.status,
            payment_status=booking.payment_status,
            booking_date=booking.booking_date,
        )
        for booking in recent_bookings
    ]

    # ---------------------------------------------------------
    # Response
    # ---------------------------------------------------------

    summary = DashboardSummary(
        total_donations=total_donations,
        completed_donations=completed_donations,
        pending_donations=pending_donations,
        today_donations=today_donations,
        month_donations=month_donations,
        total_donation_amount=total_donation_amount,
        today_donation_amount=today_donation_amount,
        month_donation_amount=month_donation_amount,
        total_bookings=total_bookings,
        pending_bookings=pending_bookings,
        confirmed_bookings=confirmed_bookings,
        completed_bookings=completed_bookings,
        cancelled_bookings=cancelled_bookings,
        today_bookings=today_bookings,
        total_devotees=total_devotees,
        active_devotees=active_devotees,
        new_devotees_this_month=new_devotees_this_month,
        active_festivals=active_festivals,
        upcoming_events=upcoming_events,
        today_events=today_events,
    )

    return DashboardResponse(
        summary=summary,
        recent_donations=recent_donation_items,
        recent_bookings=recent_booking_items,
    )
