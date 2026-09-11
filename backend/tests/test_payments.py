import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "TempleOS-Test@2026"

DEMO_TEMPLE_ID = "d90d0a47-9876-4591-9aab-bb95e2ee644b"


def get_admin_token():
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
        },
    )

    assert response.status_code == 200, response.text

    return response.json()["access_token"]


def auth_headers():
    return {
        "Authorization": f"Bearer {get_admin_token()}",
    }


def create_donation():
    payload = {
        "amount": "501.00",
        "donation_type": "GENERAL",
        "purpose": f"Payment Test {uuid.uuid4().hex[:8]}",
        "donor_name": f"Payment Donor {uuid.uuid4().hex[:8]}",
        "donor_phone": "9876543210",
        "donor_email": f"payment-{uuid.uuid4().hex[:8]}@test.com",
        "donated_at": datetime.now(timezone.utc).isoformat(),
        "notes": "Payment integration test",
    }

    response = client.post(
        "/api/v1/donations",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        json=payload,
        headers=auth_headers(),
    )

    assert response.status_code == 201, response.text

    return response.json()


def create_payment_payload(**overrides):
    payload = {
        "amount": "501.00",
        "currency": "INR",
        "payment_method": "UPI",
        "gateway": "TEST",
        "gateway_transaction_id": f"TEST-GW-{uuid.uuid4().hex[:12]}",
    }

    payload.update(overrides)

    return payload


def create_payment(**overrides):
    donation = create_donation()

    payload = create_payment_payload(
        donation_id=donation["id"],
        **overrides,
    )

    response = client.post(
        "/api/v1/payments",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        json=payload,
        headers=auth_headers(),
    )

    return response, donation


def update_payment_status(payment_id, new_status, **overrides):
    payload = {
        "status": new_status,
    }

    payload.update(overrides)

    return client.put(
        f"/api/v1/payments/{payment_id}",
        json=payload,
        headers=auth_headers(),
    )


def test_create_payment_for_donation():
    response, donation = create_payment()

    assert response.status_code == 201, response.text

    data = response.json()

    assert data["temple_id"] == DEMO_TEMPLE_ID
    assert data["donation_id"] == donation["id"]
    assert data["amount"] == "501.00"
    assert data["currency"] == "INR"
    assert data["payment_method"] == "UPI"
    assert data["status"] == "PENDING"
    assert data["transaction_id"].startswith("TXN-")


def test_list_payments():
    create_response, _ = create_payment()

    assert create_response.status_code == 201, create_response.text

    response = client.get(
        "/api/v1/payments",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_payment():
    create_response, _ = create_payment()

    assert create_response.status_code == 201, create_response.text

    payment_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/payments/{payment_id}",
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["id"] == payment_id


def test_payment_success_completes_donation():
    create_response, donation = create_payment()

    assert create_response.status_code == 201, create_response.text

    payment_id = create_response.json()["id"]

    response = update_payment_status(
        payment_id,
        "SUCCESS",
    )

    assert response.status_code == 200, response.text

    payment = response.json()

    assert payment["status"] == "SUCCESS"
    assert payment["paid_at"] is not None

    donation_response = client.get(
        f"/api/v1/donations/{donation['id']}",
        headers=auth_headers(),
    )

    assert donation_response.status_code == 200, donation_response.text

    updated_donation = donation_response.json()

    assert updated_donation["status"] == "COMPLETED"


def test_payment_failed():
    create_response, donation = create_payment()

    assert create_response.status_code == 201, create_response.text

    payment_id = create_response.json()["id"]

    response = update_payment_status(
        payment_id,
        "FAILED",
        failure_reason="Test payment failure",
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["status"] == "FAILED"
    assert data["failure_reason"] == "Test payment failure"

    donation_response = client.get(
        f"/api/v1/donations/{donation['id']}",
        headers=auth_headers(),
    )

    assert donation_response.status_code == 200, donation_response.text

    # Failed payment must not complete the donation.
    assert donation_response.json()["status"] == "PENDING"


def test_payment_refunded():
    create_response, _ = create_payment()

    assert create_response.status_code == 201, create_response.text

    payment_id = create_response.json()["id"]

    success_response = update_payment_status(
        payment_id,
        "SUCCESS",
    )

    assert success_response.status_code == 200, success_response.text

    refund_response = update_payment_status(
        payment_id,
        "REFUNDED",
    )

    assert refund_response.status_code == 200, refund_response.text

    assert refund_response.json()["status"] == "REFUNDED"


def test_pending_to_success_transition_allowed():
    response, _ = create_payment()

    assert response.status_code == 201, response.text

    payment_id = response.json()["id"]

    transition_response = update_payment_status(
        payment_id,
        "SUCCESS",
    )

    assert transition_response.status_code == 200, transition_response.text
    assert transition_response.json()["status"] == "SUCCESS"


def test_pending_to_failed_transition_allowed():
    response, _ = create_payment()

    assert response.status_code == 201, response.text

    payment_id = response.json()["id"]

    transition_response = update_payment_status(
        payment_id,
        "FAILED",
        failure_reason="Temporary gateway failure",
    )

    assert transition_response.status_code == 200, transition_response.text
    assert transition_response.json()["status"] == "FAILED"


def test_failed_to_pending_retry_allowed():
    response, _ = create_payment()

    assert response.status_code == 201, response.text

    payment_id = response.json()["id"]

    failed_response = update_payment_status(
        payment_id,
        "FAILED",
        failure_reason="Temporary gateway failure",
    )

    assert failed_response.status_code == 200, failed_response.text
    assert failed_response.json()["status"] == "FAILED"

    retry_response = update_payment_status(
        payment_id,
        "PENDING",
    )

    assert retry_response.status_code == 200, retry_response.text
    assert retry_response.json()["status"] == "PENDING"


def test_success_to_failed_transition_rejected():
    response, _ = create_payment()

    assert response.status_code == 201, response.text

    payment_id = response.json()["id"]

    success_response = update_payment_status(
        payment_id,
        "SUCCESS",
    )

    assert success_response.status_code == 200, success_response.text

    invalid_response = update_payment_status(
        payment_id,
        "FAILED",
        failure_reason="Invalid transition",
    )

    assert invalid_response.status_code == 400, invalid_response.text
    assert "transition" in invalid_response.json()["detail"].lower()


def test_success_to_pending_transition_rejected():
    response, _ = create_payment()

    assert response.status_code == 201, response.text

    payment_id = response.json()["id"]

    success_response = update_payment_status(
        payment_id,
        "SUCCESS",
    )

    assert success_response.status_code == 200, success_response.text

    invalid_response = update_payment_status(
        payment_id,
        "PENDING",
    )

    assert invalid_response.status_code == 400, invalid_response.text
    assert "transition" in invalid_response.json()["detail"].lower()


def test_refunded_to_success_transition_rejected():
    response, _ = create_payment()

    assert response.status_code == 201, response.text

    payment_id = response.json()["id"]

    success_response = update_payment_status(
        payment_id,
        "SUCCESS",
    )

    assert success_response.status_code == 200, success_response.text

    refund_response = update_payment_status(
        payment_id,
        "REFUNDED",
    )

    assert refund_response.status_code == 200, refund_response.text

    invalid_response = update_payment_status(
        payment_id,
        "SUCCESS",
    )

    assert invalid_response.status_code == 400, invalid_response.text
    assert "transition" in invalid_response.json()["detail"].lower()


def test_refunded_to_failed_transition_rejected():
    response, _ = create_payment()

    assert response.status_code == 201, response.text

    payment_id = response.json()["id"]

    success_response = update_payment_status(
        payment_id,
        "SUCCESS",
    )

    assert success_response.status_code == 200, success_response.text

    refund_response = update_payment_status(
        payment_id,
        "REFUNDED",
    )

    assert refund_response.status_code == 200, refund_response.text

    invalid_response = update_payment_status(
        payment_id,
        "FAILED",
        failure_reason="Invalid transition",
    )

    assert invalid_response.status_code == 400, invalid_response.text
    assert "transition" in invalid_response.json()["detail"].lower()


def test_refunded_to_pending_transition_rejected():
    response, _ = create_payment()

    assert response.status_code == 201, response.text

    payment_id = response.json()["id"]

    success_response = update_payment_status(
        payment_id,
        "SUCCESS",
    )

    assert success_response.status_code == 200, success_response.text

    refund_response = update_payment_status(
        payment_id,
        "REFUNDED",
    )

    assert refund_response.status_code == 200, refund_response.text

    invalid_response = update_payment_status(
        payment_id,
        "PENDING",
    )

    assert invalid_response.status_code == 400, invalid_response.text
    assert "transition" in invalid_response.json()["detail"].lower()


def test_invalid_payment_amount_rejected():
    response, _ = create_payment(
        amount="0",
    )

    assert response.status_code == 422


def test_payment_requires_authentication():
    response = client.get(
        "/api/v1/payments",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
    )

    assert response.status_code == 401


def test_super_admin_requires_temple_id_for_payment_list():
    response = client.get(
        "/api/v1/payments",
        headers=auth_headers(),
    )

    assert response.status_code == 400


def test_nonexistent_payment_returns_404():
    response = client.get(
        f"/api/v1/payments/{uuid.uuid4()}",
        headers=auth_headers(),
    )

    assert response.status_code == 404