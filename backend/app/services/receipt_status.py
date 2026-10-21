from sqlalchemy import select
from app.models import Donation, SevaBooking, Payment


def annotate_receipts(db, receipts):
    """Keep issued documents as history, while explicitly marking refunded ones."""
    donation_ids = [r.donation_id for r in receipts if r.donation_id]
    booking_ids = [r.booking_id for r in receipts if r.booking_id]
    refunded_donations = set(db.scalars(select(Donation.id).where(Donation.id.in_(donation_ids), Donation.status == "REFUNDED")).all()) if donation_ids else set()
    refunded_bookings = set(db.scalars(select(SevaBooking.id).where(SevaBooking.id.in_(booking_ids), SevaBooking.payment_status == "REFUNDED")).all()) if booking_ids else set()
    # Legacy refunds may predate linked-record reconciliation. The payment
    # ledger still marks their original receipt void.
    if donation_ids:
        refunded_donations.update(db.scalars(select(Payment.donation_id).where(Payment.donation_id.in_(donation_ids), Payment.status == "REFUNDED")).all())
    if booking_ids:
        refunded_bookings.update(db.scalars(select(Payment.booking_id).where(Payment.booking_id.in_(booking_ids), Payment.status == "REFUNDED")).all())
    for receipt in receipts:
        receipt.status = "VOID" if receipt.donation_id in refunded_donations or receipt.booking_id in refunded_bookings else "ISSUED"
    return receipts
