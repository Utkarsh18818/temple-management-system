import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import create_audit_log
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.numbering import acquire_numbering_lock
from app.models import (
    Donation,
    Receipt,
    SevaBooking,
    User,
)
from app.schemas.receipt import (
    ReceiptCreate,
    ReceiptResponse,
)


router = APIRouter(
    prefix="/receipts",
    tags=["Receipts"],
)


# ============================================================
# HELPERS
# ============================================================

def make_json_safe(value: Any) -> Any:
    """
    Convert SQLAlchemy/Python values into JSON-safe values
    for audit log storage.
    """

    if isinstance(value, uuid.UUID):
        return str(value)

    if isinstance(value, Decimal):
        return str(value)

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, dict):
        return {
            str(key): make_json_safe(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple)):
        return [
            make_json_safe(item)
            for item in value
        ]

    return value


def receipt_snapshot(
    receipt: Receipt,
) -> dict[str, Any]:
    """
    Capture the important Receipt fields for audit logging.
    """

    return make_json_safe(
        {
            "temple_id": receipt.temple_id,
            "donation_id": receipt.donation_id,
            "booking_id": receipt.booking_id,
            "receipt_number": receipt.receipt_number,
            "amount": receipt.amount,
            "receipt_type": receipt.receipt_type,
            "issued_at": receipt.issued_at,
            "pdf_path": receipt.pdf_path,
            "notes": receipt.notes,
        }
    )


def verify_receipt_access(
    receipt: Receipt,
    current_user: User,
) -> None:
    """
    Temple users can only access receipts belonging
    to their own temple.

    SUPER_ADMIN has cross-temple access.
    """

    if (
        current_user.temple_id is not None
        and receipt.temple_id
        != current_user.temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot access receipts "
                "from another temple"
            ),
        )


def get_receipt_or_404(
    receipt_id: uuid.UUID,
    db: Session,
) -> Receipt:
    receipt = db.get(
        Receipt,
        receipt_id,
    )

    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found",
        )

    return receipt


def generate_receipt_number(
    issued_at: datetime,
    db: Session,
) -> str:
    """
    Generate a human-readable receipt number.

    A PostgreSQL transaction-level advisory lock is acquired
    for the date-specific numbering scope before calculating
    the next sequence number.

    Example:
        RC-20260910-00001
    """

    date_prefix = issued_at.strftime(
        "%Y%m%d"
    )

    prefix = f"RC-{date_prefix}-"

    # Serialize receipt number generation for this date.
    #
    # The lock is transaction-scoped and is automatically
    # released when the current transaction commits or rolls
    # back.
    acquire_numbering_lock(
        db,
        f"receipt:{date_prefix}",
    )

    count = db.scalar(
        select(
            func.count(Receipt.id)
        ).where(
            Receipt.receipt_number.like(
                f"{prefix}%"
            )
        )
    )

    sequence = (count or 0) + 1

    return f"{prefix}{sequence:05d}"


# ============================================================
# CREATE RECEIPT
# ============================================================

@router.post(
    "",
    response_model=ReceiptResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_receipt(
    request: ReceiptCreate,
    temple_id: uuid.UUID = Query(...),
    http_request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a receipt for a completed payment.

    A receipt must be linked to either:

    - a completed donation
    - a confirmed/completed seva booking

    but not both.

    The receipt amount is taken directly from
    the linked record.
    """

    if (
        request.donation_id is None
        and request.booking_id is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Either donation_id or "
                "booking_id is required"
            ),
        )

    if (
        request.donation_id is not None
        and request.booking_id is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "A receipt cannot be linked "
                "to both donation and booking"
            ),
        )

    if current_user.temple_id is not None:
        if (
            temple_id
            != current_user.temple_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can only create receipts "
                    "for your own temple"
                ),
            )

    linked_amount = None

    # --------------------------------------------------------
    # Donation receipt
    # --------------------------------------------------------

    if request.donation_id is not None:
        donation = db.get(
            Donation,
            request.donation_id,
        )

        if not donation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donation not found",
            )

        if donation.temple_id != temple_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Donation does not belong "
                    "to this temple"
                ),
            )

        if donation.status != "COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Receipt can only be generated "
                    "for a completed donation"
                ),
            )

        existing_receipt = db.scalar(
            select(Receipt).where(
                Receipt.donation_id
                == donation.id
            )
        )

        if existing_receipt:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A receipt already exists "
                    "for this donation"
                ),
            )

        linked_amount = donation.amount

    # --------------------------------------------------------
    # Booking receipt
    # --------------------------------------------------------

    if request.booking_id is not None:
        booking = db.get(
            SevaBooking,
            request.booking_id,
        )

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        if booking.temple_id != temple_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Booking does not belong "
                    "to this temple"
                ),
            )

        if booking.status not in {
            "CONFIRMED",
            "COMPLETED",
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Receipt can only be generated "
                    "for a confirmed or completed booking"
                ),
            )

        if booking.payment_status != "PAID":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Receipt can only be generated "
                    "after payment is completed"
                ),
            )

        existing_receipt = db.scalar(
            select(Receipt).where(
                Receipt.booking_id
                == booking.id
            )
        )

        if existing_receipt:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "A receipt already exists "
                    "for this booking"
                ),
            )

        linked_amount = booking.amount

    # --------------------------------------------------------
    # Create receipt
    # --------------------------------------------------------

    issued_at = datetime.now(
        timezone.utc
    )

    receipt_number = generate_receipt_number(
        issued_at,
        db,
    )

    receipt = Receipt(
        temple_id=temple_id,
        donation_id=request.donation_id,
        booking_id=request.booking_id,
        receipt_number=receipt_number,
        amount=linked_amount,
        receipt_type=request.receipt_type,
        issued_at=issued_at,
        pdf_path=None,
        notes=request.notes,
    )

    try:
        db.add(receipt)

        # Generate receipt UUID before creating audit.
        db.flush()

        # ----------------------------------------------------
        # Audit: RECEIPT_CREATED
        # ----------------------------------------------------

        create_audit_log(
            db,
            current_user=current_user,
            action="RECEIPT_CREATED",
            entity_type="Receipt",
            entity_id=receipt.id,
            old_values=None,
            new_values=receipt_snapshot(receipt),
            ip_address=(
                http_request.client.host
                if http_request and http_request.client
                else None
            ),
            user_agent=(
                http_request.headers.get("user-agent")
                if http_request
                else None
            ),
            temple_id=temple_id,
        )

        db.commit()
        db.refresh(receipt)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Receipt could not be created because "
                "a unique receipt constraint was violated"
            ),
        )

    except Exception:
        db.rollback()
        raise

    return receipt


# ============================================================
# LIST RECEIPTS
# ============================================================

@router.get(
    "",
    response_model=list[ReceiptResponse],
)
def list_receipts(
    temple_id: uuid.UUID | None = Query(
        default=None
    ),
    receipt_type: str | None = Query(
        default=None,
        max_length=30,
    ),
    donation_id: uuid.UUID | None = Query(
        default=None
    ),
    booking_id: uuid.UUID | None = Query(
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
    query = select(Receipt)

    if current_user.temple_id is not None:
        query = query.where(
            Receipt.temple_id
            == current_user.temple_id
        )

    elif temple_id is not None:
        query = query.where(
            Receipt.temple_id
            == temple_id
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "temple_id is required for SUPER_ADMIN"
            ),
        )

    if receipt_type:
        query = query.where(
            Receipt.receipt_type
            == receipt_type
        )

    if donation_id:
        query = query.where(
            Receipt.donation_id
            == donation_id
        )

    if booking_id:
        query = query.where(
            Receipt.booking_id
            == booking_id
        )

    query = (
        query
        .order_by(
            Receipt.issued_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


# ============================================================
# GET RECEIPT
# ============================================================

@router.get(
    "/{receipt_id}",
    response_model=ReceiptResponse,
)
def get_receipt(
    receipt_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = get_receipt_or_404(
        receipt_id,
        db,
    )

    verify_receipt_access(
        receipt,
        current_user,
    )

    return receipt