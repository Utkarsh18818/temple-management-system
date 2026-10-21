"""Slot changes occur in the same transaction as their booking/payment."""
import asyncio
import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select, func

from app.core.audit import create_audit_log
from app.models import Payment, SevaBooking, SevaSlot

RESERVATION_MINUTES = 20
logger = logging.getLogger(__name__)


def release_booking(db, booking):
    if booking.status == "CANCELLED":
        return
    if booking.slot_id:
        slot = db.scalar(select(SevaSlot).where(SevaSlot.id == booking.slot_id).with_for_update())
        if slot:
            slot.booked_count = max(0, slot.booked_count - booking.quantity)
            if slot.status == "FULL" and slot.booked_count < slot.capacity:
                slot.status = "AVAILABLE"
    booking.status = "CANCELLED"


def ensure_booking_payable(db, booking, payment=None):
    if booking.status in {"CANCELLED", "COMPLETED"}:
        if booking.status == "COMPLETED" and booking.payment_status == "PAID":
            return
        if payment is not None and payment.status == "SUCCESS":
            # The provider has already captured money. Persist that fact without
            # reopening a released slot; staff must allocate anew or refund.
            booking.payment_status = "PAID"
            payment.failure_reason = "Captured after booking closed; manual allocation or refund required"
            create_audit_log(db, current_user=None, temple_id=booking.temple_id,
                             action="PAYMENT_REVIEW_REQUIRED", entity_type="Payment", entity_id=payment.id)
            db.commit()
        raise HTTPException(409, "This booking is closed. Create a new booking; reconcile any late gateway payment with the temple.")


def expire_reservations(db, now=None):
    cutoff = (now or datetime.now(timezone.utc)) - timedelta(minutes=RESERVATION_MINUTES)
    bookings = db.scalars(select(SevaBooking).where(
        SevaBooking.status == "PENDING", SevaBooking.payment_status == "PENDING",
        SevaBooking.created_at < cutoff,
    ).order_by(SevaBooking.id).with_for_update(skip_locked=True)).all()
    for booking in bookings:
        # Do not expire a capture already recorded by a concurrent gateway callback.
        payments = db.scalars(select(Payment).where(Payment.booking_id == booking.id)
                              .with_for_update(skip_locked=True)).all()
        payment_count = db.scalar(select(func.count(Payment.id)).where(Payment.booking_id == booking.id))
        if payment_count != len(payments):
            continue
        if any(payment.status == "SUCCESS" for payment in payments):
            continue
        release_booking(db, booking)
        booking.payment_status = "FAILED"
        for payment in payments:
            if payment.status == "PENDING":
                payment.status = "FAILED"
                payment.failure_reason = "Booking reservation expired after 20 minutes"
        create_audit_log(db, current_user=None, temple_id=booking.temple_id,
                         action="RESERVATION_EXPIRED", entity_type="SevaBooking", entity_id=booking.id)
    return len(bookings)


async def reservation_worker():
    from app.core.database import SessionLocal
    def sweep():
        with SessionLocal() as db:
            expire_reservations(db)
            db.commit()
    while True:
        try:
            await asyncio.to_thread(sweep)
        except Exception:
            logger.exception("Reservation expiry failed; will retry")
        await asyncio.sleep(60)
