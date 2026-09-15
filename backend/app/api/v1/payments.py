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
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import create_audit_log
from app.core.numbering import acquire_numbering_lock
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import (
    Donation,
    Payment,
    SevaBooking,
    User,
)
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentUpdate,
)


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
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
        return [make_json_safe(item) for item in value]

    return value


def payment_snapshot(payment: Payment) -> dict[str, Any]:
    """
    Capture the important Payment fields for audit logging.
    """
    return make_json_safe(
        {
            "temple_id": payment.temple_id,
            "donation_id": payment.donation_id,
            "booking_id": payment.booking_id,
            "transaction_id": payment.transaction_id,
            "amount": payment.amount,
            "currency": payment.currency,
            "payment_method": payment.payment_method,
            "gateway": payment.gateway,
            "gateway_transaction_id": payment.gateway_transaction_id,
            "status": payment.status,
            "paid_at": payment.paid_at,
            "failure_reason": payment.failure_reason,
        }
    )


def verify_payment_access(
    payment: Payment,
    current_user: User,
) -> None:
    """
    Temple users can only access payments belonging
    to their own temple.

    SUPER_ADMIN has cross-temple access.
    """
    if (
        current_user.temple_id is not None
        and payment.temple_id != current_user.temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot access payments "
                "from another temple"
            ),
        )


def get_payment_or_404(
    payment_id: uuid.UUID,
    db: Session,
) -> Payment:
    payment = db.get(
        Payment,
        payment_id,
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    return payment


def generate_transaction_id(
    db: Session,
) -> str:
    """
    Generate an internal transaction ID.

    Example:
        TXN-20260910-00001

    A transaction-scoped PostgreSQL advisory lock prevents
    concurrent requests from generating the same number.
    """
    today = datetime.now(
        timezone.utc
    ).strftime("%Y%m%d")

    prefix = f"TXN-{today}-"

    acquire_numbering_lock(
        db,
        f"payment:{today}",
    )

    count = db.scalar(
        select(
            func.count(Payment.id)
        ).where(
            Payment.transaction_id.like(
                f"{prefix}%"
            )
        )
    )

    sequence = (count or 0) + 1

    return f"{prefix}{sequence:05d}"


def get_active_payment_for_donation(
    db: Session,
    donation_id: uuid.UUID,
    exclude_payment_id: uuid.UUID | None = None,
) -> Payment | None:
    """
    Return an existing active payment for a donation.

    Active payment statuses are PENDING and SUCCESS.
    """
    query = select(Payment).where(
        Payment.donation_id == donation_id,
        Payment.status.in_(("PENDING", "SUCCESS")),
    )

    if exclude_payment_id is not None:
        query = query.where(
            Payment.id != exclude_payment_id
        )

    return db.scalar(query)


def get_active_payment_for_booking(
    db: Session,
    booking_id: uuid.UUID,
    exclude_payment_id: uuid.UUID | None = None,
) -> Payment | None:
    """
    Return an existing active payment for a booking.

    Active payment statuses are PENDING and SUCCESS.
    """
    query = select(Payment).where(
        Payment.booking_id == booking_id,
        Payment.status.in_(("PENDING", "SUCCESS")),
    )

    if exclude_payment_id is not None:
        query = query.where(
            Payment.id != exclude_payment_id
        )

    return db.scalar(query)


def get_payment_by_gateway_transaction_id(
    db: Session,
    gateway_transaction_id: str,
    exclude_payment_id: uuid.UUID | None = None,
) -> Payment | None:
    """
    Return an existing payment using the supplied gateway
    transaction reference.
    """
    query = select(Payment).where(
        Payment.gateway_transaction_id
        == gateway_transaction_id
    )

    if exclude_payment_id is not None:
        query = query.where(
            Payment.id != exclude_payment_id
        )

    return db.scalar(query)


# ============================================================
# CREATE PAYMENT
# ============================================================


@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    request: PaymentCreate,
    temple_id: uuid.UUID = Query(...),
    http_request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a payment.

    A payment must be linked to exactly one of:

    - a donation
    - a seva booking

    The payment amount must exactly match
    the linked donation or booking amount.

    Payment status always starts as PENDING.

    Only one active payment (PENDING or SUCCESS)
    is allowed for a donation or booking at a time.
    """

    # --------------------------------------------------------
    # Validate payment source
    # --------------------------------------------------------

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
                "A payment cannot be linked "
                "to both donation and booking"
            ),
        )

    # --------------------------------------------------------
    # Temple access
    # --------------------------------------------------------

    if current_user.temple_id is not None:
        if temple_id != current_user.temple_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can only create payments "
                    "for your own temple"
                ),
            )

    # --------------------------------------------------------
    # Validate linked entity
    # --------------------------------------------------------

    linked_amount = None

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

        linked_amount = donation.amount

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

        linked_amount = booking.amount

    # --------------------------------------------------------
    # Validate amount
    # --------------------------------------------------------

    if request.amount != linked_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Payment amount must match "
                f"the linked amount of {linked_amount}"
            ),
        )

    # --------------------------------------------------------
    # Active payment uniqueness
    # --------------------------------------------------------

    if request.donation_id is not None:
        existing_active_payment = (
            get_active_payment_for_donation(
                db,
                request.donation_id,
            )
        )

        if existing_active_payment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "An active payment already exists "
                    "for this donation"
                ),
            )

    if request.booking_id is not None:
        existing_active_payment = (
            get_active_payment_for_booking(
                db,
                request.booking_id,
            )
        )

        if existing_active_payment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "An active payment already exists "
                    "for this booking"
                ),
            )

    # --------------------------------------------------------
    # Gateway transaction uniqueness
    # --------------------------------------------------------

    if request.gateway_transaction_id:
        existing_gateway_payment = (
            get_payment_by_gateway_transaction_id(
                db,
                request.gateway_transaction_id,
            )
        )

        if existing_gateway_payment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Gateway transaction ID "
                    "already exists"
                ),
            )

    # --------------------------------------------------------
    # Create payment
    # --------------------------------------------------------

    transaction_id = generate_transaction_id(db)

    payment = Payment(
        temple_id=temple_id,
        donation_id=request.donation_id,
        booking_id=request.booking_id,
        transaction_id=transaction_id,
        amount=request.amount,
        currency=request.currency,
        payment_method=request.payment_method,
        gateway=request.gateway,
        gateway_transaction_id=(
            request.gateway_transaction_id
        ),
        status="PENDING",
    )

    try:
        db.add(payment)

        # Generate UUID before audit creation.
        db.flush()

        # ----------------------------------------------------
        # Audit: PAYMENT_CREATED
        # ----------------------------------------------------

        create_audit_log(
            db,
            current_user=current_user,
            action="PAYMENT_CREATED",
            entity_type="Payment",
            entity_id=payment.id,
            old_values=None,
            new_values=payment_snapshot(payment),
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
        db.refresh(payment)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Payment could not be created because "
                "an active payment or unique transaction "
                "reference already exists"
            ),
        )

    except Exception:
        db.rollback()
        raise

    return payment


# ============================================================
# LIST PAYMENTS
# ============================================================


@router.get(
    "",
    response_model=list[PaymentResponse],
)
def list_payments(
    temple_id: uuid.UUID | None = Query(
        default=None
    ),
    payment_status: str | None = Query(
        default=None,
        alias="status",
        max_length=30,
    ),
    payment_method: str | None = Query(
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
    query = select(Payment)

    if current_user.temple_id is not None:
        query = query.where(
            Payment.temple_id
            == current_user.temple_id
        )

    elif temple_id is not None:
        query = query.where(
            Payment.temple_id
            == temple_id
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "temple_id is required for SUPER_ADMIN"
            ),
        )

    if payment_status:
        query = query.where(
            Payment.status
            == payment_status
        )

    if payment_method:
        query = query.where(
            Payment.payment_method
            == payment_method
        )

    if donation_id:
        query = query.where(
            Payment.donation_id
            == donation_id
        )

    if booking_id:
        query = query.where(
            Payment.booking_id
            == booking_id
        )

    query = (
        query
        .order_by(
            Payment.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


# ============================================================
# GET PAYMENT
# ============================================================


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def get_payment(
    payment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = get_payment_or_404(
        payment_id,
        db,
    )

    verify_payment_access(
        payment,
        current_user,
    )

    return payment


# ============================================================
# UPDATE PAYMENT
# ============================================================


@router.put(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def update_payment(
    payment_id: uuid.UUID,
    request: PaymentUpdate,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.scalar(
        select(Payment)
        .where(Payment.id == payment_id)
        .with_for_update()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    verify_payment_access(
        payment,
        current_user,
    )

    old_snapshot = payment_snapshot(payment)

    update_data = request.model_dump(
        exclude_unset=True
    )

    allowed_statuses = {
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED",
    }

    # --------------------------------------------------------
    # Validate status
    # --------------------------------------------------------

    if "status" in update_data:
        requested_status = update_data["status"]

        if requested_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid payment status. "
                    "Allowed values: "
                    "PENDING, SUCCESS, FAILED, "
                    "REFUNDED"
                ),
            )

        allowed_transitions = {
            "PENDING": {
                "PENDING",
                "SUCCESS",
                "FAILED",
            },
            "FAILED": {
                "FAILED",
                "PENDING",
            },
            "SUCCESS": {
                "SUCCESS",
                "REFUNDED",
            },
            "REFUNDED": {
                "REFUNDED",
            },
        }

        current_status = payment.status

        if requested_status not in allowed_transitions[current_status]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid payment status transition: "
                    f"{current_status} -> {requested_status}"
                ),
            )

    # --------------------------------------------------------
    # Gateway transaction uniqueness
    # --------------------------------------------------------

    if "gateway_transaction_id" in update_data:
        requested_gateway_transaction_id = (
            update_data["gateway_transaction_id"]
        )

        if requested_gateway_transaction_id:
            existing_gateway_payment = (
                get_payment_by_gateway_transaction_id(
                    db,
                    requested_gateway_transaction_id,
                    exclude_payment_id=payment.id,
                )
            )

            if existing_gateway_payment:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Gateway transaction ID "
                        "already exists"
                    ),
                )

    # --------------------------------------------------------
    # Active payment uniqueness
    # --------------------------------------------------------

    requested_status = update_data.get(
        "status",
        payment.status,
    )

    if requested_status in {
        "PENDING",
        "SUCCESS",
    }:
        if payment.donation_id:
            existing_active_payment = (
                get_active_payment_for_donation(
                    db,
                    payment.donation_id,
                    exclude_payment_id=payment.id,
                )
            )

            if existing_active_payment:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "An active payment already exists "
                        "for this donation"
                    ),
                )

        if payment.booking_id:
            existing_active_payment = (
                get_active_payment_for_booking(
                    db,
                    payment.booking_id,
                    exclude_payment_id=payment.id,
                )
            )

            if existing_active_payment:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "An active payment already exists "
                        "for this booking"
                    ),
                )

    try:
        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

        if (
            update_data.get("status")
            == "SUCCESS"
            and payment.status != "SUCCESS"
        ):
            payment.paid_at = datetime.now(
                timezone.utc
            )

            # ----------------------------------------------
            # Complete linked donation
            # ----------------------------------------------

            if payment.donation_id:
                donation = db.get(
                    Donation,
                    payment.donation_id,
                )

                if donation:
                    donation.status = "COMPLETED"

            # ----------------------------------------------
            # Confirm linked booking
            # ----------------------------------------------

            if payment.booking_id:
                booking = db.get(
                    SevaBooking,
                    payment.booking_id,
                )

                if booking:
                    booking.status = "CONFIRMED"
                    booking.payment_status = "PAID"
                    booking.confirmed_at = (
                        datetime.now(timezone.utc)
                    )

        # ----------------------------------------------------
        # FAILED
        # ----------------------------------------------------

        if (
            update_data.get("status")
            == "FAILED"
        ):
            payment.paid_at = None

        # ----------------------------------------------------
        # REFUNDED
        # ----------------------------------------------------

        if (
            update_data.get("status")
            == "REFUNDED"
        ):
            payment.paid_at = None

        # ----------------------------------------------------
        # Apply requested fields
        # ----------------------------------------------------

        for field, value in update_data.items():
            setattr(
                payment,
                field,
                value,
            )

        db.flush()

        new_snapshot = payment_snapshot(payment)

        # ----------------------------------------------------
        # Audit action
        # ----------------------------------------------------

        action = (
            "PAYMENT_STATUS_CHANGED"
            if "status" in update_data
            and old_snapshot["status"]
            != new_snapshot["status"]
            else "PAYMENT_UPDATED"
        )

        create_audit_log(
            db,
            current_user=current_user,
            action=action,
            entity_type="Payment",
            entity_id=payment.id,
            old_values=old_snapshot,
            new_values=new_snapshot,
            ip_address=(
                http_request.client.host
                if http_request.client
                else None
            ),
            user_agent=(
                http_request.headers.get("user-agent")
            ),
            temple_id=payment.temple_id,
        )

        db.commit()
        db.refresh(payment)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Payment update conflicts with an existing "
                "active payment or unique gateway reference"
            ),
        )

    except Exception:
        db.rollback()
        raise

    return payment