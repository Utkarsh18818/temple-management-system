import os
import uuid
from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = os.environ.get("TEMPLEOS_TEST_ADMIN_PASSWORD", "TempleOS-Test@2026")

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


def festival_payload(**overrides):
    today = date.today()
    unique_code = f"TEST-{uuid.uuid4().hex[:8].upper()}"

    payload = {
        "name": f"Test Festival {uuid.uuid4().hex[:8]}",
        "code": unique_code,
        "description": "Automated festival test",
        "start_date": (today + timedelta(days=10)).isoformat(),
        "end_date": (today + timedelta(days=12)).isoformat(),
        "is_active": True,
    }

    payload.update(overrides)
    return payload


def create_festival(**overrides):
    return client.post(
        "/api/v1/festivals",
        params={"temple_id": DEMO_TEMPLE_ID},
        json=festival_payload(**overrides),
        headers=auth_headers(),
    )


def test_create_festival():
    response = create_festival()

    assert response.status_code == 201, response.text

    data = response.json()

    assert data["temple_id"] == DEMO_TEMPLE_ID
    assert data["name"].startswith("Test Festival")
    assert data["code"].startswith("TEST-")
    assert data["is_active"] is True


def test_list_festivals():
    create_response = create_festival()

    assert create_response.status_code == 201, create_response.text

    response = client.get(
        "/api/v1/festivals",
        params={"temple_id": DEMO_TEMPLE_ID},
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_festival():
    create_response = create_festival()

    assert create_response.status_code == 201, create_response.text

    festival_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/festivals/{festival_id}",
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["id"] == festival_id


def test_update_festival():
    create_response = create_festival(
        name="Festival Before Update",
    )

    assert create_response.status_code == 201, create_response.text

    festival_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/festivals/{festival_id}",
        json={
            "name": "Festival After Update",
            "description": "Updated festival",
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["id"] == festival_id
    assert data["name"] == "Festival After Update"
    assert data["description"] == "Updated festival"


def test_deactivate_festival():
    create_response = create_festival()

    assert create_response.status_code == 201, create_response.text

    festival_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/festivals/{festival_id}",
        json={
            "is_active": False,
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text
    assert response.json()["is_active"] is False


def test_invalid_festival_dates_rejected():
    today = date.today()

    response = create_festival(
        start_date=(today + timedelta(days=20)).isoformat(),
        end_date=(today + timedelta(days=10)).isoformat(),
    )

    assert response.status_code in (400, 422)


def test_festival_requires_authentication():
    response = client.get(
        "/api/v1/festivals",
        params={"temple_id": DEMO_TEMPLE_ID},
    )

    assert response.status_code == 401


def test_nonexistent_festival_returns_404():
    response = client.get(
        f"/api/v1/festivals/{uuid.uuid4()}",
        headers=auth_headers(),
    )

    assert response.status_code == 404


def test_super_admin_requires_temple_id_for_festival_list():
    response = client.get(
        "/api/v1/festivals",
        headers=auth_headers(),
    )

    assert response.status_code == 400


def test_festival_creation_generates_unique_codes():
    first_response = create_festival()
    second_response = create_festival()

    assert first_response.status_code == 201, first_response.text
    assert second_response.status_code == 201, second_response.text

    first_code = first_response.json()["code"]
    second_code = second_response.json()["code"]

    assert first_code
    assert second_code
    assert first_code != second_code
