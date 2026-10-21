from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.booking import SevaBooking
from app.models.devotee import Devotee
from app.models.payment import Payment
from app.models.temple import Temple
from app.models.user import User
from app.services.razorpay import razorpay_service
from app.services.booking_lifecycle import ensure_booking_payable
from app.services.receipt_service import create_booking_receipt


router = APIRouter(
    prefix="/public/payments",
    tags=["Public Payments"],
)


class PublicBookingPaymentOrderResponse(BaseModel):
    payment_id: UUID
    transaction_id: str
    booking_id: UUID
    amount: Decimal
    currency: str
    razorpay_order_id: str
    razorpay_key_id: str


class PublicBookingPaymentVerifyRequest(BaseModel):
    razorpay_order_id: str = Field(min_length=1)
    razorpay_payment_id: str = Field(min_length=1)
    razorpay_signature: str = Field(min_length=1)


class PublicBookingPaymentVerifyResponse(BaseModel):
    payment_id: UUID
    transaction_id: str
    booking_id: UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    amount: Decimal
    currency: str
    payment_status: str
    booking_status: str


class PublicBookingPaymentReconcileResponse(BaseModel):
    payment_id: UUID
    transaction_id: str
    booking_id: UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    amount: Decimal
    currency: str
    payment_status: str
    booking_status: str
    reconciled: bool


def get_devotee_for_user(
    current_user: User,
    db: Session,
) -> Devotee | None:
    conditions = []

    if current_user.email:
        conditions.append(
            Devotee.email == current_user.email
        )

    if current_user.phone:
        conditions.append(
            Devotee.phone == current_user.phone
        )

    if not conditions:
        return None

    return db.scalar(
        select(Devotee)
        .where(
            Devotee.temple_id == current_user.temple_id,
            or_(*conditions),
        )
    )


def get_current_devotee(
    current_user: User,
    db: Session,
) -> Devotee:
    devotee = get_devotee_for_user(
        current_user=current_user,
        db=db,
    )

    if not devotee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Devotee account was not found.",
        )

    if not devotee.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Devotee account is inactive.",
        )

    return devotee


def generate_transaction_id(db: Session) -> str:
    """
    Generate a transaction ID using a PostgreSQL transaction-scoped
    advisory lock so concurrent payment creation cannot generate the
    same sequence number.
    """

    today = datetime.now(timezone.utc).date()

    prefix = f"TXN-{today.strftime('%Y%m%d')}-"
    numbering_scope = f"payment:{today.strftime('%Y%m%d')}"

    db.execute(
        select(
            func.pg_advisory_xact_lock(
                func.hashtext(numbering_scope)
            )
        )
    )

    existing_transactions = db.scalars(
        select(Payment.transaction_id).where(
            Payment.transaction_id.like(f"{prefix}%")
        )
    ).all()

    used_numbers: set[int] = set()

    for transaction_id in existing_transactions:
        try:
            used_numbers.add(
                int(
                    transaction_id.replace(
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


def get_active_booking_payment(
    db: Session,
    booking_id: UUID,
) -> Payment | None:
    return db.scalar(
        select(Payment)
        .where(
            Payment.booking_id == booking_id,
            Payment.gateway == "RAZORPAY",
            Payment.status.in_(["PENDING", "SUCCESS"]),
        )
        .order_by(Payment.created_at.desc())
    )


@router.post(
    "/booking/{booking_id}/order",
    response_model=PublicBookingPaymentOrderResponse,
)
def create_booking_payment_order(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    devotee = get_current_devotee(
        current_user=current_user,
        db=db,
    )

    booking = db.scalar(
        select(SevaBooking)
        .where(
            SevaBooking.id == booking_id,
        )
        .with_for_update()
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    if booking.devotee_id != devotee.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to pay for this booking.",
        )

    temple = db.scalar(
        select(Temple).where(
            Temple.id == booking.temple_id,
            Temple.is_active.is_(True),
        )
    )

    if not temple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temple not found or inactive.",
        )

    if (
        booking.status == "CONFIRMED"
        or booking.payment_status == "PAID"
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This booking has already been paid and confirmed.",
        )

    if booking.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Booking cannot be paid in status "
                f"{booking.status}."
            ),
        )

    existing_payment = get_active_booking_payment(
        db=db,
        booking_id=booking.id,
    )

    if existing_payment:
        if (
            existing_payment.status == "SUCCESS"
            and existing_payment.gateway_transaction_id
        ):
            ensure_booking_payable(db, booking, existing_payment)
            booking.status = "COMPLETED" if booking.status == "COMPLETED" else "CONFIRMED"
            booking.payment_status = "PAID"

            if not booking.confirmed_at:
                booking.confirmed_at = datetime.now(timezone.utc)

            create_booking_receipt(
                booking_id=booking.id,
                temple_id=booking.temple_id,
                amount=existing_payment.amount,
                db=db,
            )

            db.commit()

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This booking has already been paid "
                    "and confirmed."
                ),
            )

        if (
            existing_payment.status == "PENDING"
            and existing_payment.gateway_order_id
        ):
            return PublicBookingPaymentOrderResponse(
                payment_id=existing_payment.id,
                transaction_id=existing_payment.transaction_id,
                booking_id=booking.id,
                amount=existing_payment.amount,
                currency=existing_payment.currency,
                razorpay_order_id=(
                    existing_payment.gateway_order_id
                ),
                razorpay_key_id=(
                    razorpay_service._get_key_id()
                ),
            )

    try:
        transaction_id = generate_transaction_id(db)

        razorpay_order = razorpay_service.create_order(
            amount=booking.amount,
            currency="INR",
            receipt=booking.booking_number,
        )

        razorpay_order_id = razorpay_order["id"]

        payment = Payment(
            temple_id=booking.temple_id,
            booking_id=booking.id,
            transaction_id=transaction_id,
            gateway_order_id=razorpay_order_id,
            amount=booking.amount,
            currency="INR",
            payment_method="ONLINE",
            gateway="RAZORPAY",
            status="PENDING",
        )

        db.add(payment)
        db.commit()
        db.refresh(payment)

        return PublicBookingPaymentOrderResponse(
            payment_id=payment.id,
            transaction_id=payment.transaction_id,
            booking_id=booking.id,
            amount=payment.amount,
            currency=payment.currency,
            razorpay_order_id=payment.gateway_order_id,
            razorpay_key_id=razorpay_service._get_key_id(),
        )

    except IntegrityError:
        db.rollback()

        existing_payment = get_active_booking_payment(
            db=db,
            booking_id=booking.id,
        )

        if (
            existing_payment
            and existing_payment.gateway_order_id
        ):
            return PublicBookingPaymentOrderResponse(
                payment_id=existing_payment.id,
                transaction_id=existing_payment.transaction_id,
                booking_id=booking.id,
                amount=existing_payment.amount,
                currency=existing_payment.currency,
                razorpay_order_id=(
                    existing_payment.gateway_order_id
                ),
                razorpay_key_id=(
                    razorpay_service._get_key_id()
                ),
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A payment is already being created "
                "for this booking."
            ),
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Unable to create Razorpay payment order."
            ),
        )


@router.post(
    "/verify",
    response_model=PublicBookingPaymentVerifyResponse,
)
def verify_booking_payment(
    payload: PublicBookingPaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    devotee = get_current_devotee(
        current_user=current_user,
        db=db,
    )

    payment = db.scalar(
        select(Payment)
        .where(
            Payment.gateway_order_id
            == payload.razorpay_order_id,
            Payment.gateway == "RAZORPAY",
        )
        .with_for_update()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment order not found.",
        )

    if not payment.booking_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This payment is not associated "
                "with a booking."
            ),
        )

    booking = db.scalar(
        select(SevaBooking)
        .where(
            SevaBooking.id == payment.booking_id,
        )
        .with_for_update()
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "Booking associated with payment "
                "was not found."
            ),
        )

    if booking.devotee_id != devotee.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You are not allowed to verify "
                "this payment."
            ),
        )

    if payment.temple_id != booking.temple_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment and booking temple mismatch.",
        )

    if payload.razorpay_order_id != payment.gateway_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay order mismatch.",
        )

    if payment.status == "SUCCESS":
        ensure_booking_payable(db, booking, payment)
        booking.status = "COMPLETED" if booking.status == "COMPLETED" else "CONFIRMED"
        booking.payment_status = "PAID"

        if not booking.confirmed_at:
            booking.confirmed_at = datetime.now(timezone.utc)

        create_booking_receipt(
            booking_id=booking.id,
            temple_id=booking.temple_id,
            amount=payment.amount,
            db=db,
        )

        db.commit()

        return PublicBookingPaymentVerifyResponse(
            payment_id=payment.id,
            transaction_id=payment.transaction_id,
            booking_id=booking.id,
            razorpay_order_id=payment.gateway_order_id,
            razorpay_payment_id=(
                payment.gateway_transaction_id
                or payload.razorpay_payment_id
            ),
            amount=payment.amount,
            currency=payment.currency,
            payment_status=payment.status,
            booking_status=booking.status,
        )

    if payment.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Payment cannot be verified in status "
                f"{payment.status}."
            ),
        )

    try:
        razorpay_service.verify_payment_signature(
            razorpay_order_id=(
                payload.razorpay_order_id
            ),
            razorpay_payment_id=(
                payload.razorpay_payment_id
            ),
            razorpay_signature=(
                payload.razorpay_signature
            ),
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Razorpay payment signature "
                "verification failed."
            ),
        )

    now = datetime.now(timezone.utc)

    payment.status = "SUCCESS"
    payment.gateway_transaction_id = (
        payload.razorpay_payment_id
    )
    payment.paid_at = now
    payment.failure_reason = None

    ensure_booking_payable(db, booking, payment)
    booking.status = "COMPLETED" if booking.status == "COMPLETED" else "CONFIRMED"
    booking.payment_status = "PAID"
    booking.confirmed_at = now

    create_booking_receipt(
        booking_id=booking.id,
        temple_id=booking.temple_id,
        amount=payment.amount,
        db=db,
    )

    db.commit()

    return PublicBookingPaymentVerifyResponse(
        payment_id=payment.id,
        transaction_id=payment.transaction_id,
        booking_id=booking.id,
        razorpay_order_id=payment.gateway_order_id,
        razorpay_payment_id=(
            payload.razorpay_payment_id
        ),
        amount=payment.amount,
        currency=payment.currency,
        payment_status=payment.status,
        booking_status=booking.status,
    )


@router.post(
    "/booking/{booking_id}/reconcile",
    response_model=PublicBookingPaymentReconcileResponse,
)
def reconcile_booking_payment(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Recover a payment where Razorpay successfully captured
    the payment but the browser-side verification callback
    did not complete.

    This is a server-to-server reconciliation against the
    authenticated Razorpay API.
    """

    devotee = get_current_devotee(
        current_user=current_user,
        db=db,
    )

    booking = db.scalar(
        select(SevaBooking)
        .where(
            SevaBooking.id == booking_id,
        )
        .with_for_update()
    )

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    if booking.devotee_id != devotee.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You are not allowed to reconcile "
                "this booking."
            ),
        )

    payment = db.scalar(
        select(Payment)
        .where(
            Payment.booking_id == booking.id,
            Payment.gateway == "RAZORPAY",
        )
        .order_by(Payment.created_at.desc())
        .with_for_update()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No Razorpay payment was found "
                "for this booking."
            ),
        )

    if not payment.gateway_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay order ID is missing.",
        )

    if payment.status == "SUCCESS":
        ensure_booking_payable(db, booking, payment)
        booking.status = "COMPLETED" if booking.status == "COMPLETED" else "CONFIRMED"
        booking.payment_status = "PAID"

        if not booking.confirmed_at:
            booking.confirmed_at = datetime.now(timezone.utc)

        create_booking_receipt(
            booking_id=booking.id,
            temple_id=booking.temple_id,
            amount=payment.amount,
            db=db,
        )

        db.commit()

        return PublicBookingPaymentReconcileResponse(
            payment_id=payment.id,
            transaction_id=payment.transaction_id,
            booking_id=booking.id,
            razorpay_order_id=payment.gateway_order_id,
            razorpay_payment_id=(
                payment.gateway_transaction_id or ""
            ),
            amount=payment.amount,
            currency=payment.currency,
            payment_status=payment.status,
            booking_status=booking.status,
            reconciled=False,
        )

    if payment.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Payment cannot be reconciled in "
                f"status {payment.status}."
            ),
        )

    try:
        order = razorpay_service.fetch_order(
            payment.gateway_order_id
        )

        payments_response = (
            razorpay_service.fetch_order_payments(
                payment.gateway_order_id
            )
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Unable to retrieve payment "
                "information from Razorpay."
            ),
        )

    if order.get("id") != payment.gateway_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay order mismatch.",
        )

    expected_amount_paise = (
        razorpay_service.amount_to_paise(
            payment.amount
        )
    )

    captured_payment = None

    for razorpay_payment in payments_response.get(
        "items",
        [],
    ):
        if (
            razorpay_payment.get("status")
            == "captured"
            and razorpay_payment.get("order_id")
            == payment.gateway_order_id
            and razorpay_payment.get("amount")
            == expected_amount_paise
            and razorpay_payment.get("currency")
            == payment.currency
        ):
            captured_payment = razorpay_payment
            break

    if not captured_payment:
        return PublicBookingPaymentReconcileResponse(
            payment_id=payment.id,
            transaction_id=payment.transaction_id,
            booking_id=booking.id,
            razorpay_order_id=payment.gateway_order_id,
            razorpay_payment_id="",
            amount=payment.amount,
            currency=payment.currency,
            payment_status=payment.status,
            booking_status=booking.status,
            reconciled=False,
        )

    now = datetime.now(timezone.utc)

    payment.status = "SUCCESS"
    payment.gateway_transaction_id = (
        captured_payment["id"]
    )
    payment.paid_at = now
    payment.failure_reason = None

    ensure_booking_payable(db, booking, payment)
    booking.status = "COMPLETED" if booking.status == "COMPLETED" else "CONFIRMED"
    booking.payment_status = "PAID"
    booking.confirmed_at = now

    create_booking_receipt(
        booking_id=booking.id,
        temple_id=booking.temple_id,
        amount=payment.amount,
        db=db,
    )

    db.commit()

    return PublicBookingPaymentReconcileResponse(
        payment_id=payment.id,
        transaction_id=payment.transaction_id,
        booking_id=booking.id,
        razorpay_order_id=payment.gateway_order_id,
        razorpay_payment_id=captured_payment["id"],
        amount=payment.amount,
        currency=payment.currency,
        payment_status=payment.status,
        booking_status=booking.status,
        reconciled=True,
    )
