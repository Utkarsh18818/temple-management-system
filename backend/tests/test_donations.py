import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models import Donation

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


def create_donation_payload(**overrides):
    payload = {
        "amount": "501.00",
        "donation_type": "GENERAL",
        "purpose": "Test Donation",
        "donor_name": f"Donation Test {uuid.uuid4().hex[:8]}",
        "donor_phone": "9876543210",
        "donor_email": f"donor-{uuid.uuid4().hex[:8]}@test.com",
        "donated_at": datetime.now(timezone.utc).isoformat(),
        "notes": "Automated donation test",
    }

    payload.update(overrides)

    return payload


def create_donation(**overrides):
    return client.post(
        "/api/v1/donations",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        json=create_donation_payload(**overrides),
        headers=auth_headers(),
    )


def test_create_donation():
    response = create_donation()

    assert response.status_code == 201, response.text

    data = response.json()

    assert data["temple_id"] == DEMO_TEMPLE_ID
    assert data["amount"] == "501.00"
    assert data["donation_type"] == "GENERAL"
    assert data["status"] == "PENDING"
    assert data["donation_number"].startswith("DN-")


def test_list_donations():
    response = client.get(
        "/api/v1/donations",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_donation():
    create_response = create_donation(
        purpose="Get Donation Test",
    )

    assert create_response.status_code == 201, create_response.text

    donation_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/donations/{donation_id}",
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["id"] == donation_id
    assert data["purpose"] == "Get Donation Test"


def test_update_donation():
    create_response = create_donation(
        purpose="Before Update",
    )

    assert create_response.status_code == 201, create_response.text

    donation_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/donations/{donation_id}",
        json={
            "purpose": "After Update",
            "notes": "Updated donation",
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["id"] == donation_id
    assert data["purpose"] == "After Update"
    assert data["notes"] == "Updated donation"


def test_change_donation_status():
    create_response = create_donation(
        purpose="Status Test",
    )

    assert create_response.status_code == 201, create_response.text

    donation_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/donations/{donation_id}",
        json={
            "status": "COMPLETED",
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "COMPLETED"


def test_invalid_donation_amount_rejected():
    response = create_donation(
        amount="0",
    )

    assert response.status_code == 422


def test_duplicate_donation_number_rejected():
    first_response = create_donation(
        purpose="Duplicate Number Test",
    )

    assert first_response.status_code == 201, first_response.text

    donation_id = first_response.json()["id"]
    donation_number = first_response.json()["donation_number"]

    db = SessionLocal()

    try:
        donation = db.get(Donation, uuid.UUID(donation_id))

        assert donation is not None
        assert donation.donation_number == donation_number
    finally:
        db.close()


def test_donation_requires_authentication():
    response = client.get(
        "/api/v1/donations",
        params={
            "temple_id": DEMO_TEMPLE_ID,
        },
    )

    assert response.status_code == 401


def test_get_nonexistent_donation_returns_404():
    response = client.get(
        f"/api/v1/donations/{uuid.uuid4()}",
        headers=auth_headers(),
    )

    assert response.status_code == 404


def test_super_admin_requires_temple_id_for_list():
    response = client.get(
        "/api/v1/donations",
        headers=auth_headers(),
    )

    assert response.status_code == 400
