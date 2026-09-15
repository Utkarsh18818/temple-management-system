import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.numbering import acquire_numbering_lock
from app.models import Donation, Receipt
from app.services.receipt_pdf import generate_receipt_pdf


def generate_receipt_number(
    issued_at: datetime,
    db: Session,
) -> str:
    """
    Generate a date-based receipt number.

    Example:
        RC-20260914-00001
    """

    date_prefix = issued_at.strftime("%Y%m%d")
    prefix = f"RC-{date_prefix}-"

    acquire_numbering_lock(
        db,
        f"receipt:{date_prefix}",
    )

    existing_numbers = db.scalars(
        select(Receipt.receipt_number).where(
            Receipt.receipt_number.like(
                f"{prefix}%"
            )
        )
    ).all()

    used_numbers: set[int] = set()

    for receipt_number in existing_numbers:
        try:
            used_numbers.add(
                int(
                    receipt_number.replace(
                        prefix,
                        "",
                        1,
                    )
                )
            )
        except (ValueError, TypeError):
            continue

    sequence = 1

    while sequence in used_numbers:
        sequence += 1

    return f"{prefix}{sequence:05d}"


def get_booking_receipt(
    booking_id: uuid.UUID,
    db: Session,
) -> Receipt | None:
    return db.scalar(
        select(Receipt).where(
            Receipt.booking_id == booking_id,
        )
    )


def get_donation_receipt(
    donation_id: uuid.UUID,
    db: Session,
) -> Receipt | None:
    return db.scalar(
        select(Receipt).where(
            Receipt.donation_id == donation_id,
        )
    )


def create_booking_receipt(
    *,
    booking_id: uuid.UUID,
    temple_id: uuid.UUID,
    amount,
    db: Session,
    notes: str | None = None,
    temple_name: str = "Temple",
    devotee_name: str | None = None,
    seva_name: str | None = None,
) -> Receipt:
    """
    Create a seva booking receipt and generate its PDF.

    The operation is idempotent for the booking.
    """

    existing_receipt = get_booking_receipt(
        booking_id=booking_id,
        db=db,
    )

    if existing_receipt:
        return existing_receipt

    issued_at = datetime.now(timezone.utc)

    receipt_number = generate_receipt_number(
        issued_at=issued_at,
        db=db,
    )

    receipt = Receipt(
        temple_id=temple_id,
        donation_id=None,
        booking_id=booking_id,
        receipt_number=receipt_number,
        amount=amount,
        receipt_type="SEVA",
        issued_at=issued_at,
        pdf_path=None,
        notes=notes,
    )

    try:
        with db.begin_nested():
            db.add(receipt)
            db.flush()

            pdf_path = generate_receipt_pdf(
                receipt=receipt,
                temple_name=temple_name,
                devotee_name=devotee_name,
                seva_name=seva_name,
            )

            receipt.pdf_path = pdf_path

            db.flush()

    except IntegrityError:
        existing_receipt = get_booking_receipt(
            booking_id=booking_id,
            db=db,
        )

        if existing_receipt:
            return existing_receipt

        raise

    return receipt


def create_donation_receipt(
    *,
    donation_id: uuid.UUID,
    temple_id: uuid.UUID,
    amount,
    db: Session,
    notes: str | None = None,
    temple_name: str = "Temple",
    devotee_name: str | None = None,
) -> Receipt:
    """
    Create a donation receipt and generate its PDF.

    The operation is idempotent for the donation.
    """

    existing_receipt = get_donation_receipt(
        donation_id=donation_id,
        db=db,
    )

    if existing_receipt:
        return existing_receipt

    issued_at = datetime.now(timezone.utc)

    receipt_number = generate_receipt_number(
        issued_at=issued_at,
        db=db,
    )

    receipt = Receipt(
        temple_id=temple_id,
        donation_id=donation_id,
        booking_id=None,
        receipt_number=receipt_number,
        amount=amount,
        receipt_type="DONATION",
        issued_at=issued_at,
        pdf_path=None,
        notes=notes,
    )

    try:
        with db.begin_nested():
            db.add(receipt)
            db.flush()

            pdf_path = generate_receipt_pdf(
                receipt=receipt,
                temple_name=temple_name,
                devotee_name=devotee_name,
                seva_name=None,
            )

            receipt.pdf_path = pdf_path

            db.flush()

    except IntegrityError:
        existing_receipt = get_donation_receipt(
            donation_id=donation_id,
            db=db,
        )

        if existing_receipt:
            return existing_receipt

        raise

    return receipt
