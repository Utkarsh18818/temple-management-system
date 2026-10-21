"""Personal records. Ownership is always derived from the authenticated account."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.v1.public_auth import get_devotee_for_user
from app.api.v1.receipts import ensure_receipt_pdf
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import Donation, Receipt, SevaBooking, User
from app.schemas.donation import DonationResponse
from app.schemas.receipt import ReceiptResponse
from app.services.receipt_status import annotate_receipts

router = APIRouter(prefix="/public/account", tags=["Personal history"])


def current_devotee(user: User, db: Session):
    devotee = get_devotee_for_user(user, db)
    if not devotee or not devotee.is_active:
        raise HTTPException(403, "An active devotee account is required")
    return devotee


def owned_receipts(devotee):
    return select(Receipt).where(
        Receipt.temple_id == devotee.temple_id,
        or_(
            Receipt.donation_id.in_(select(Donation.id).where(Donation.devotee_id == devotee.id)),
            Receipt.booking_id.in_(select(SevaBooking.id).where(SevaBooking.devotee_id == devotee.id)),
        ),
    )


@router.get("/donations", response_model=list[DonationResponse])
def donations(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0),
              user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    devotee = current_devotee(user, db)
    return db.scalars(select(Donation).where(
        Donation.devotee_id == devotee.id, Donation.temple_id == devotee.temple_id,
    ).order_by(Donation.donated_at.desc()).offset(offset).limit(limit)).all()


@router.get("/receipts", response_model=list[ReceiptResponse])
def receipts(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0),
             user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    devotee = current_devotee(user, db)
    return annotate_receipts(db, db.scalars(owned_receipts(devotee).order_by(Receipt.issued_at.desc()).offset(offset).limit(limit)).all())


@router.get("/receipts/{receipt_id}", response_model=ReceiptResponse)
def receipt(receipt_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    devotee = current_devotee(user, db)
    record = db.scalar(owned_receipts(devotee).where(Receipt.id == receipt_id))
    if record is None:
        raise HTTPException(404, "Receipt not found")
    return annotate_receipts(db, [record])[0]


@router.get("/receipts/{receipt_id}/pdf")
def receipt_pdf(receipt_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = receipt(receipt_id, user, db)
    if record.status == "VOID":
        raise HTTPException(409, "This payment was refunded; its original receipt is void")
    donation = db.get(Donation, record.donation_id) if record.donation_id else None
    booking = db.get(SevaBooking, record.booking_id) if record.booking_id else None
    if (donation and donation.status == "REFUNDED") or (booking and booking.payment_status == "REFUNDED"):
        raise HTTPException(409, "This payment was refunded; its original receipt is void")
    return FileResponse(ensure_receipt_pdf(record, db), media_type="application/pdf",
                        filename=f"{record.receipt_number}.pdf", headers={"Cache-Control": "private, no-store"})
