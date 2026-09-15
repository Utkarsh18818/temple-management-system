import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    Donation,
    Payment,
    PaymentWebhookEvent,
    SevaBooking,
    Temple,
)
from app.services.razorpay import razorpay_service
from app.services.receipt_service import (
    create_booking_receipt,
    create_donation_receipt,
)


router = APIRouter(
    prefix="/public/payments",
    tags=["Public Payments"],
)


def complete_booking_payment(
    payment: Payment,
    db: Session,
    now: datetime,
) -> None:
    if not payment.booking_id:
        return

    booking = db.scalar(
        select(SevaBooking)
        .where(
            SevaBooking.id == payment.booking_id,
        )
        .with_for_update()
    )

    if not booking:
        return

    booking.status = "CONFIRMED"
    booking.payment_status = "PAID"

    if booking.confirmed_at is None:
        booking.confirmed_at = now

    temple = db.scalar(
        select(Temple).where(
            Temple.id == booking.temple_id,
        )
    )

    temple_name = (
        temple.name
        if temple
        else "Temple"
    )

    create_booking_receipt(
        booking_id=booking.id,
        temple_id=booking.temple_id,
        amount=payment.amount,
        db=db,
        temple_name=temple_name,
    )


def complete_donation_payment(
    payment: Payment,
    db: Session,
    now: datetime,
) -> None:
    if not payment.donation_id:
        return

    donation = db.scalar(
        select(Donation)
        .where(
            Donation.id == payment.donation_id,
        )
        .with_for_update()
    )

    if not donation:
        return

    donation.status = "COMPLETED"
    donation.donated_at = now

    temple = db.scalar(
        select(Temple).where(
            Temple.id == donation.temple_id,
        )
    )

    temple_name = (
        temple.name
        if temple
        else "Temple"
    )

    create_donation_receipt(
        donation_id=donation.id,
        temple_id=donation.temple_id,
        amount=payment.amount,
        db=db,
        temple_name=temple_name,
        devotee_name=donation.donor_name,
    )


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
)
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_razorpay_signature: str | None = Header(
        default=None,
        alias="X-Razorpay-Signature",
    ),
    x_razorpay_event_id: str | None = Header(
        default=None,
        alias="x-razorpay-event-id",
    ),
):
    """
    Process Razorpay webhook events.

    Supported events:
    - payment.captured
    - order.paid
    - payment.failed

    Supports both:
    - Seva bookings
    - Donations

    Webhook processing is idempotent using
    Razorpay's event ID.
    """

    if not x_razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Razorpay webhook signature.",
        )

    if not x_razorpay_event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Razorpay event ID.",
        )

    raw_body = await request.body()

    try:
        is_valid = razorpay_service.verify_webhook_signature(
            payload=raw_body,
            signature=x_razorpay_signature,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to verify Razorpay webhook signature.",
        ) from exc

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay webhook signature.",
        )

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook payload.",
        ) from exc

    event_type = payload.get("event")

    if not event_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook event type is missing.",
        )

    existing_event = db.scalar(
        select(PaymentWebhookEvent).where(
            PaymentWebhookEvent.event_id == x_razorpay_event_id,
        )
    )

    if existing_event:
        return {
            "status": "already_processed",
            "event_id": x_razorpay_event_id,
        }

    webhook_event = PaymentWebhookEvent(
        event_id=x_razorpay_event_id,
        event_type=event_type,
        status="RECEIVED",
        payload=raw_body.decode("utf-8"),
    )

    db.add(webhook_event)

    try:
        db.flush()
    except Exception:
        db.rollback()

        existing_event = db.scalar(
            select(PaymentWebhookEvent).where(
                PaymentWebhookEvent.event_id == x_razorpay_event_id,
            )
        )

        if existing_event:
            return {
                "status": "already_processed",
                "event_id": x_razorpay_event_id,
            }

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to record webhook event.",
        )

    webhook_payload = payload.get("payload") or {}

    payment_entity = (
        webhook_payload
        .get("payment", {})
        .get("entity", {})
    )

    order_entity = (
        webhook_payload
        .get("order", {})
        .get("entity", {})
    )

    payment_id = payment_entity.get("id")
    order_id = payment_entity.get("order_id")

    if not order_id:
        order_id = order_entity.get("id")

    payment = None

    if order_id:
        payment = db.scalar(
            select(Payment)
            .where(
                Payment.gateway_order_id == order_id,
                Payment.gateway == "RAZORPAY",
            )
            .with_for_update()
        )

    if not payment:
        webhook_event.status = "IGNORED"
        db.commit()

        return {
            "status": "ignored",
            "event_id": x_razorpay_event_id,
            "reason": "No matching TempleOS payment found.",
        }

    webhook_event.payment_id = payment.id

    if event_type in (
        "payment.captured",
        "order.paid",
    ):
        if event_type == "payment.captured" and not payment_id:
            webhook_event.status = "IGNORED"
            db.commit()

            return {
                "status": "ignored",
                "event_id": x_razorpay_event_id,
                "reason": "Captured payment ID is missing.",
            }

        if payment_entity:
            gateway_amount = payment_entity.get("amount")
            gateway_currency = payment_entity.get("currency")

            expected_amount = razorpay_service.amount_to_paise(
                payment.amount
            )

            if (
                gateway_amount is not None
                and int(gateway_amount) != expected_amount
            ):
                webhook_event.status = "IGNORED"
                db.commit()

                return {
                    "status": "ignored",
                    "event_id": x_razorpay_event_id,
                    "reason": (
                        "Payment amount does not match "
                        "TempleOS payment."
                    ),
                }

            if (
                gateway_currency
                and gateway_currency.upper()
                != payment.currency.upper()
            ):
                webhook_event.status = "IGNORED"
                db.commit()

                return {
                    "status": "ignored",
                    "event_id": x_razorpay_event_id,
                    "reason": (
                        "Payment currency does not match "
                        "TempleOS payment."
                    ),
                }

        now = datetime.now(timezone.utc)

        if payment.status == "SUCCESS":
            if payment.booking_id:
                complete_booking_payment(
                    payment=payment,
                    db=db,
                    now=now,
                )

            if payment.donation_id:
                complete_donation_payment(
                    payment=payment,
                    db=db,
                    now=now,
                )

            webhook_event.status = "PROCESSED"
            db.commit()

            return {
                "status": "already_successful",
                "event_id": x_razorpay_event_id,
                "payment_id": str(payment.id),
            }

        payment.status = "SUCCESS"

        if payment_id:
            payment.gateway_transaction_id = payment_id

        payment.paid_at = now
        payment.failure_reason = None

        if payment.booking_id:
            complete_booking_payment(
                payment=payment,
                db=db,
                now=now,
            )

        if payment.donation_id:
            complete_donation_payment(
                payment=payment,
                db=db,
                now=now,
            )

        webhook_event.status = "PROCESSED"

    elif event_type == "payment.failed":
        if payment.status == "SUCCESS":
            webhook_event.status = "PROCESSED"
            db.commit()

            return {
                "status": "already_successful",
                "event_id": x_razorpay_event_id,
                "payment_id": str(payment.id),
            }

        payment.status = "FAILED"

        if payment_id:
            payment.gateway_transaction_id = payment_id

        error_description = payment_entity.get(
            "error_description"
        )

        error_reason = payment_entity.get(
            "error_reason"
        )

        error_source = payment_entity.get(
            "error_source"
        )

        failure_reason = (
            error_description
            or error_reason
            or error_source
        )

        if failure_reason:
            payment.failure_reason = failure_reason

        webhook_event.status = "PROCESSED"

    else:
        webhook_event.status = "IGNORED"

    try:
        db.commit()
    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to persist Razorpay webhook processing.",
        ) from exc

    return {
        "status": "processed",
        "event_id": x_razorpay_event_id,
        "event_type": event_type,
        "payment_id": str(payment.id),
    }
