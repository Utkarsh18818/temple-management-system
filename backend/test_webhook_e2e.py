import hashlib
import hmac
import json
import uuid
from decimal import Decimal

import requests
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.models import Payment, PaymentWebhookEvent, SevaBooking


BASE_URL = "http://127.0.0.1:8000"
ORDER_ID = f"order_LOCAL_WEBHOOK_{uuid.uuid4().hex[:16]}"
PAYMENT_ID = f"pay_LOCAL_WEBHOOK_{uuid.uuid4().hex[:16]}"
CAPTURE_EVENT_ID = f"local-capture-{uuid.uuid4()}"
FAILED_EVENT_ID = f"local-failed-{uuid.uuid4()}"


if not settings.RAZORPAY_WEBHOOK_SECRET:
    raise RuntimeError("RAZORPAY_WEBHOOK_SECRET is not configured")


db = SessionLocal()

booking = None
payment = None
capture_event = None
failed_event = None


def sign(payload: dict) -> tuple[bytes, str]:
    raw = json.dumps(
        payload,
        separators=(",", ":"),
    ).encode("utf-8")

    signature = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        raw,
        hashlib.sha256,
    ).hexdigest()

    return raw, signature


def send_webhook(payload: dict, event_id: str):
    raw, signature = sign(payload)

    response = requests.post(
        f"{BASE_URL}/api/v1/public/payments/webhook",
        data=raw,
        headers={
            "Content-Type": "application/json",
            "X-Razorpay-Signature": signature,
            "x-razorpay-event-id": event_id,
        },
        timeout=30,
    )

    print("\nHTTP STATUS:", response.status_code)
    print("RESPONSE:", response.text)

    return response


try:
    # ---------------------------------------------------------
    # Find an existing valid temple/devotee/seva combination.
    # ---------------------------------------------------------

    source_booking = db.scalar(
        select(SevaBooking)
        .order_by(SevaBooking.created_at.desc())
    )

    if not source_booking:
        raise RuntimeError(
            "No existing booking found to use as a template."
        )

    # ---------------------------------------------------------
    # Create temporary booking.
    # ---------------------------------------------------------

    booking = SevaBooking(
        id=uuid.uuid4(),
        temple_id=source_booking.temple_id,
        devotee_id=source_booking.devotee_id,
        seva_id=source_booking.seva_id,
        slot_id=None,
        booking_number=f"WEBHOOK-TEST-{uuid.uuid4().hex[:12]}",
        booking_date=source_booking.booking_date,
        quantity=1,
        amount=Decimal("501.00"),
        status="PENDING",
        payment_status="PENDING",
        special_request="Temporary webhook integration test",
    )

    db.add(booking)
    db.flush()

    # ---------------------------------------------------------
    # Create temporary pending payment.
    # ---------------------------------------------------------

    payment = Payment(
        id=uuid.uuid4(),
        temple_id=booking.temple_id,
        booking_id=booking.id,
        donation_id=None,
        transaction_id=f"TXN-WEBHOOK-{uuid.uuid4().hex[:12]}",
        gateway_order_id=ORDER_ID,
        amount=Decimal("501.00"),
        currency="INR",
        payment_method="ONLINE",
        gateway="RAZORPAY",
        gateway_transaction_id=None,
        status="PENDING",
    )

    db.add(payment)
    db.commit()

    print("\n========================================")
    print("TEMPORARY TEST DATA CREATED")
    print("========================================")
    print("Booking ID :", booking.id)
    print("Booking No :", booking.booking_number)
    print("Payment ID :", payment.id)
    print("Order ID   :", ORDER_ID)

    # ---------------------------------------------------------
    # 1. payment.captured
    # ---------------------------------------------------------

    captured_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": PAYMENT_ID,
                    "order_id": ORDER_ID,
                    "amount": 50100,
                    "currency": "INR",
                    "status": "captured",
                }
            }
        },
    }

    print("\n========================================")
    print("TEST 1: PAYMENT CAPTURED")
    print("========================================")

    response = send_webhook(
        captured_payload,
        CAPTURE_EVENT_ID,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"payment.captured webhook failed: {response.text}"
        )

    db.expire_all()

    payment = db.scalar(
        select(Payment).where(
            Payment.id == payment.id
        )
    )

    booking = db.scalar(
        select(SevaBooking).where(
            SevaBooking.id == booking.id
        )
    )

    print("\nDATABASE AFTER CAPTURE:")
    print({
        "payment_status": payment.status,
        "gateway_payment_id": payment.gateway_transaction_id,
        "booking_status": booking.status,
        "booking_payment_status": booking.payment_status,
    })

    assert payment.status == "SUCCESS"
    assert payment.gateway_transaction_id == PAYMENT_ID
    assert booking.status == "CONFIRMED"
    assert booking.payment_status == "PAID"

    print("\nPASS: Payment captured transition")

    # ---------------------------------------------------------
    # 2. Duplicate event / idempotency
    # ---------------------------------------------------------

    print("\n========================================")
    print("TEST 2: DUPLICATE WEBHOOK")
    print("========================================")

    duplicate_response = send_webhook(
        captured_payload,
        CAPTURE_EVENT_ID,
    )

    if duplicate_response.status_code != 200:
        raise RuntimeError(
            f"Duplicate webhook failed: {duplicate_response.text}"
        )

    duplicate_body = duplicate_response.json()

    assert duplicate_body["status"] == "already_processed"

    print("\nPASS: Duplicate webhook ignored")

    # ---------------------------------------------------------
    # 3. Late payment.failed must NOT downgrade SUCCESS.
    # ---------------------------------------------------------

    failed_payload = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": PAYMENT_ID,
                    "order_id": ORDER_ID,
                    "amount": 50100,
                    "currency": "INR",
                    "status": "failed",
                    "error_description": "Synthetic test failure",
                }
            }
        },
    }

    print("\n========================================")
    print("TEST 3: LATE PAYMENT FAILED")
    print("========================================")

    failed_response = send_webhook(
        failed_payload,
        FAILED_EVENT_ID,
    )

    if failed_response.status_code != 200:
        raise RuntimeError(
            f"payment.failed webhook failed: {failed_response.text}"
        )

    failed_body = failed_response.json()

    assert failed_body["status"] == "already_successful"

    db.expire_all()

    payment = db.scalar(
        select(Payment).where(
            Payment.id == payment.id
        )
    )

    booking = db.scalar(
        select(SevaBooking).where(
            SevaBooking.id == booking.id
        )
    )

    print("\nDATABASE AFTER LATE FAILURE:")
    print({
        "payment_status": payment.status,
        "gateway_payment_id": payment.gateway_transaction_id,
        "booking_status": booking.status,
        "booking_payment_status": booking.payment_status,
    })

    assert payment.status == "SUCCESS"
    assert booking.status == "CONFIRMED"
    assert booking.payment_status == "PAID"

    print("\nPASS: Successful payment protected from late failure")

    # ---------------------------------------------------------
    # 4. Verify webhook event records.
    # ---------------------------------------------------------

    capture_event = db.scalar(
        select(PaymentWebhookEvent).where(
            PaymentWebhookEvent.event_id == CAPTURE_EVENT_ID
        )
    )

    failed_event = db.scalar(
        select(PaymentWebhookEvent).where(
            PaymentWebhookEvent.event_id == FAILED_EVENT_ID
        )
    )

    assert capture_event is not None
    assert capture_event.status == "PROCESSED"

    assert failed_event is not None
    assert failed_event.status == "PROCESSED"

    print("\nPASS: Webhook events persisted")

finally:
    # ---------------------------------------------------------
    # Cleanup ALL temporary test data.
    # ---------------------------------------------------------

    try:
        if failed_event:
            db.delete(failed_event)

        if capture_event:
            db.delete(capture_event)

        if payment:
            db.delete(payment)

        if booking:
            db.delete(booking)

        db.commit()

        print("\n========================================")
        print("TEST DATA CLEANED UP")
        print("========================================")

    except Exception as cleanup_error:
        db.rollback()
        print("\nWARNING: Cleanup failed:")
        print(cleanup_error)

    finally:
        db.close()
