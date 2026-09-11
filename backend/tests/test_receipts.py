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


def create_completed_donation():
    payload = {
        "amount": "501.00",
        "donation_type": "GENERAL",
        "purpose": f"Receipt Test {uuid.uuid4().hex[:8]}",
        "donor_name": f"Receipt Donor {uuid.uuid4().hex[:8]}",
        "donor_phone": "9876543210",
        "donor_email": f"receipt-{uuid.uuid4().hex[:8]}@test.com",
        "donated_at": datetime.now(timezone.utc).isoformat(),
        "notes": "Receipt integration test",
    }

    donation_response = client.post(
        "/api/v1/donations",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        json=payload,
        headers=auth_headers(),
    )

    assert donation_response.status_code == 201, donation_response.text

    donation = donation_response.json()

    payment_payload = {
        "donation_id": donation["id"],
        "amount": "501.00",
        "currency": "INR",
        "payment_method": "UPI",
        "gateway": "TEST",
        "gateway_transaction_id": f"RECEIPT-GW-{uuid.uuid4().hex[:12]}",
    }

    payment_response = client.post(
        "/api/v1/payments",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        json=payment_payload,
        headers=auth_headers(),
    )

    assert payment_response.status_code == 201, payment_response.text

    payment = payment_response.json()

    success_response = client.put(
        f"/api/v1/payments/{payment['id']}",
        json={
            "status": "SUCCESS",
        },
        headers=auth_headers(),
    )

    assert success_response.status_code == 200, success_response.text

    completed_donation_response = client.get(
        f"/api/v1/donations/{donation['id']}",
        headers=auth_headers(),
    )

    assert completed_donation_response.status_code == 200, (
        completed_donation_response.text
    )

    completed_donation = completed_donation_response.json()

    assert completed_donation["status"] == "COMPLETED"

    return completed_donation


def create_receipt(**overrides):
    donation = create_completed_donation()

    payload = {
        "donation_id": donation["id"],
        "receipt_type": "DONATION",
        "notes": "Automated receipt test",
    }

    payload.update(overrides)

    response = client.post(
        "/api/v1/receipts",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        json=payload,
        headers=auth_headers(),
    )

    return response, donation


def test_create_donation_receipt():
    response, donation = create_receipt()

    assert response.status_code == 201, response.text

    data = response.json()

    assert data["temple_id"] == DEMO_TEMPLE_ID
    assert data["donation_id"] == donation["id"]
    assert data["booking_id"] is None
    assert data["amount"] == "501.00"
    assert data["receipt_type"] == "DONATION"
    assert data["receipt_number"].startswith("RC-")
    assert data["issued_at"] is not None


def test_get_receipt():
    create_response, _ = create_receipt()

    assert create_response.status_code == 201, create_response.text

    receipt_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/receipts/{receipt_id}",
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["id"] == receipt_id


def test_list_receipts():
    create_response, _ = create_receipt()

    assert create_response.status_code == 201, create_response.text

    response = client.get(
        "/api/v1/receipts",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1


def test_receipt_cannot_be_created_twice_for_same_donation():
    first_response, donation = create_receipt()

    assert first_response.status_code == 201, first_response.text

    second_response = client.post(
        "/api/v1/receipts",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        json={
            "donation_id": donation["id"],
            "receipt_type": "DONATION",
            "notes": "Duplicate receipt test",
        },
        headers=auth_headers(),
    )

    assert second_response.status_code == 409, second_response.text


def test_receipt_requires_authentication():
    response = client.get(
        "/api/v1/receipts",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
    )

    assert response.status_code == 401


def test_nonexistent_receipt_returns_404():
    response = client.get(
        f"/api/v1/receipts/{uuid.uuid4()}",
        headers=auth_headers(),
    )

    assert response.status_code == 404


def test_super_admin_requires_temple_id_for_receipt_list():
    response = client.get(
        "/api/v1/receipts",
        headers=auth_headers(),
    )

    assert response.status_code == 400


def test_receipt_requires_donation_or_booking():
    response = client.post(
        "/api/v1/receipts",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        json={
            "receipt_type": "DONATION",
            "notes": "Missing source test",
        },
        headers=auth_headers(),
    )

    assert response.status_code in (400, 422)


def test_receipt_type_validation():
    response = client.post(
        "/api/v1/receipts",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        json={
            "receipt_type": "X",
        },
        headers=auth_headers(),
    )

    assert response.status_code == 422


def test_receipt_amount_matches_donation():
    response, donation = create_receipt()

    assert response.status_code == 201, response.text

    data = response.json()

    assert data["amount"] == donation["amount"]
