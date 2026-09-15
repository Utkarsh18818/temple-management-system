import hashlib
import hmac
import json
import uuid
import requests

from app.core.config import settings


payload = {
    "event": "payment.captured",
    "payload": {
        "payment": {
            "entity": {
                "id": "pay_LOCAL_TEST_001",
                "order_id": "order_Tbpx2KYADQwoCo",
                "amount": 50100,
                "currency": "INR",
                "status": "captured",
            }
        }
    }
}

raw_body = json.dumps(
    payload,
    separators=(",", ":"),
).encode("utf-8")

if not settings.RAZORPAY_WEBHOOK_SECRET:
    raise RuntimeError("RAZORPAY_WEBHOOK_SECRET is not configured")

signature = hmac.new(
    settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
    raw_body,
    hashlib.sha256,
).hexdigest()

event_id = f"local-test-{uuid.uuid4()}"

response = requests.post(
    "http://127.0.0.1:8000/api/v1/public/payments/webhook",
    data=raw_body,
    headers={
        "Content-Type": "application/json",
        "X-Razorpay-Signature": signature,
        "x-razorpay-event-id": event_id,
    },
    timeout=30,
)

print("HTTP STATUS:", response.status_code)
print("RESPONSE:", response.text)
print("EVENT ID:", event_id)
