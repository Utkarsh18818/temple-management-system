import json
import uuid
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.main import app
from app.models import Payment, PaymentWebhookEvent, Receipt, SevaBooking
from app.services.razorpay import razorpay_service


client = TestClient(app)


def main():
    db = SessionLocal()

    booking = None
    payment = None
    created_event_ids = []

    try:
        # -------------------------------------------------
        # 1. Find an existing booking as a safe template
        # -------------------------------------------------

        template_booking = db.scalar(
            select(SevaBooking)
            .order_by(SevaBooking.created_at.desc())
        )

        if not template_booking:
            raise RuntimeError(
                "No existing booking available for E2E test."
            )

        # -------------------------------------------------
        # 2. Create temporary booking
        # -------------------------------------------------

        booking = SevaBooking(
            temple_id=template_booking.temple_id,
            devotee_id=template_booking.devotee_id,
            seva_id=template_booking.seva_id,
            slot_id=template_booking.slot_id,
            booking_number=f"RECEIPT-TEST-{uuid.uuid4().hex[:12]}",
            booking_date=template_booking.booking_date,
            quantity=1,
            amount=Decimal("101.00"),
            status="PENDING",
            payment_status="PENDING",
            special_request="Temporary receipt E2E test",
        )

        db.add(booking)
        db.flush()

        # -------------------------------------------------
        # 3. Create temporary payment
        # -------------------------------------------------

        payment = Payment(
            temple_id=booking.temple_id,
            booking_id=booking.id,
            transaction_id=f"TXN-RECEIPT-TEST-{uuid.uuid4().hex[:12]}",
            gateway_order_id=f"order_RECEIPT_TEST_{uuid.uuid4().hex[:12]}",
            amount=Decimal("101.00"),
            currency="INR",
            payment_method="ONLINE",
            gateway="RAZORPAY",
            status="PENDING",
        )

        db.add(payment)
        db.commit()
        db.refresh(booking)
        db.refresh(payment)

        print("TEMPORARY TEST DATA CREATED")
        print("Booking ID :", booking.id)
        print("Booking No :", booking.booking_number)
        print("Payment ID :", payment.id)
        print("Order ID   :", payment.gateway_order_id)

        # -------------------------------------------------
        # 4. Create payment.captured webhook
        # -------------------------------------------------

        event_id = f"receipt-test-captured-{uuid.uuid4().hex}"

        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": f"pay_RECEIPT_TEST_{uuid.uuid4().hex[:12]}",
                        "order_id": payment.gateway_order_id,
                        "amount": 10100,
                        "currency": "INR",
                        "status": "captured",
                    }
                }
            },
        }

        raw_body = json.dumps(payload).encode("utf-8")

        signature = razorpay_service.verify_webhook_signature

        import hashlib
        import hmac

        webhook_signature = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        response = client.post(
            "/api/v1/public/payments/webhook",
            content=raw_body,
            headers={
                "X-Razorpay-Signature": webhook_signature,
                "x-razorpay-event-id": event_id,
            },
        )

        print("\nTEST 1: PAYMENT CAPTURED")
        print("HTTP STATUS:", response.status_code)
        print("RESPONSE:", response.json())

        assert response.status_code == 200
        assert response.json()["status"] == "processed"

        created_event_ids.append(event_id)

        # -------------------------------------------------
        # 5. Verify database state
        # -------------------------------------------------

        db.expire_all()

        payment_db = db.scalar(
            select(Payment).where(
                Payment.id == payment.id
            )
        )

        booking_db = db.scalar(
            select(SevaBooking).where(
                SevaBooking.id == booking.id
            )
        )

        receipt_db = db.scalar(
            select(Receipt).where(
                Receipt.booking_id == booking.id
            )
        )

        print("\nDATABASE AFTER CAPTURE:")
        print(
            {
                "payment_status": payment_db.status,
                "booking_status": booking_db.status,
                "booking_payment_status": booking_db.payment_status,
                "receipt_number": (
                    receipt_db.receipt_number
                    if receipt_db
                    else None
                ),
                "receipt_amount": (
                    str(receipt_db.amount)
                    if receipt_db
                    else None
                ),
                "receipt_type": (
                    receipt_db.receipt_type
                    if receipt_db
                    else None
                ),
            }
        )

        assert payment_db.status == "SUCCESS"
        assert booking_db.status == "CONFIRMED"
        assert booking_db.payment_status == "PAID"
        assert receipt_db is not None
        assert receipt_db.amount == Decimal("101.00")
        assert receipt_db.receipt_type == "SEVA"

        print("PASS: Automatic receipt created")

        # -------------------------------------------------
        # 6. Duplicate webhook
        # -------------------------------------------------

        response = client.post(
            "/api/v1/public/payments/webhook",
            content=raw_body,
            headers={
                "X-Razorpay-Signature": webhook_signature,
                "x-razorpay-event-id": event_id,
            },
        )

        print("\nTEST 2: DUPLICATE WEBHOOK")
        print("HTTP STATUS:", response.status_code)
        print("RESPONSE:", response.json())

        assert response.status_code == 200
        assert response.json()["status"] == "already_processed"

        # -------------------------------------------------
        # 7. Verify only one receipt exists
        # -------------------------------------------------

        receipt_count = db.scalar(
            select(
                __import__("sqlalchemy").func.count(Receipt.id)
            ).where(
                Receipt.booking_id == booking.id
            )
        )

        event_count = db.scalar(
            select(
                __import__("sqlalchemy").func.count(
                    PaymentWebhookEvent.id
                )
            ).where(
                PaymentWebhookEvent.event_id == event_id
            )
        )

        print("\nDUPLICATE VERIFICATION")
        print("Receipt count :", receipt_count)
        print("Event count   :", event_count)

        assert receipt_count == 1
        assert event_count == 1

        print("PASS: Duplicate webhook did not create duplicate receipt")

        # -------------------------------------------------
        # 8. Cleanup
        # -------------------------------------------------

        db.delete(receipt_db)

        for event in db.scalars(
            select(PaymentWebhookEvent).where(
                PaymentWebhookEvent.event_id.in_(
                    created_event_ids
                )
            )
        ).all():
            db.delete(event)

        db.delete(payment_db)`r`n        db.delete(booking_db)

        db.commit()

        print("\nCLEANUP COMPLETE")
        print("PASS: Receipt/payment E2E test completed successfully")

    except Exception:
        db.rollback()

        # Best-effort cleanup
        if booking:
            try:
                receipt = db.scalar(
                    select(Receipt).where(
                        Receipt.booking_id == booking.id
                    )
                )

                if receipt:
                    db.delete(receipt)

                if payment:
                    for event in db.scalars(
                        select(PaymentWebhookEvent).where(
                            PaymentWebhookEvent.payment_id == payment.id
                        )
                    ).all():
                        db.delete(event)

                    db.delete(payment)

                db.delete(booking)
                db.commit()
            except Exception:
                db.rollback()

        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
