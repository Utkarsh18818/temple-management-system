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


def event_payload(**overrides):
    today = date.today()

    payload = {
        "name": f"Test Event {uuid.uuid4().hex[:8]}",
        "code": f"TEST-{uuid.uuid4().hex[:8].upper()}",
        "description": "Automated event test",
        "event_date": (today + timedelta(days=10)).isoformat(),
        "start_time": "10:00:00",
        "end_time": "12:00:00",
        "location": "Main Temple Hall",
        "is_active": True,
    }

    payload.update(overrides)
    return payload


def create_event(**overrides):
    return client.post(
        "/api/v1/events",
        params={"temple_id": DEMO_TEMPLE_ID},
        json=event_payload(**overrides),
        headers=auth_headers(),
    )


def test_create_event():
    response = create_event()

    assert response.status_code == 201, response.text

    data = response.json()

    assert data["temple_id"] == DEMO_TEMPLE_ID
    assert data["name"].startswith("Test Event")
    assert data["code"].startswith("TEST-")
    assert data["event_date"] is not None
    assert data["is_active"] is True


def test_list_events():
    create_response = create_event()

    assert create_response.status_code == 201, create_response.text

    response = client.get(
        "/api/v1/events",
        params={"temple_id": DEMO_TEMPLE_ID},
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_event():
    create_response = create_event()

    assert create_response.status_code == 201, create_response.text

    event_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/events/{event_id}",
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["id"] == event_id


def test_update_event():
    create_response = create_event(
        name="Event Before Update",
    )

    assert create_response.status_code == 201, create_response.text

    event_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/events/{event_id}",
        json={
            "name": "Event After Update",
            "description": "Updated event",
            "location": "Updated Hall",
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["id"] == event_id
    assert data["name"] == "Event After Update"
    assert data["description"] == "Updated event"
    assert data["location"] == "Updated Hall"


def test_deactivate_event():
    create_response = create_event()

    assert create_response.status_code == 201, create_response.text

    event_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/events/{event_id}",
        json={
            "is_active": False,
        },
        headers=auth_headers(),
    )

    assert response.status_code == 200, response.text
    assert response.json()["is_active"] is False


def test_invalid_event_time_rejected():
    response = create_event(
        start_time="14:00:00",
        end_time="10:00:00",
    )

    assert response.status_code in (400, 422)


def test_event_requires_authentication():
    response = client.get(
        "/api/v1/events",
        params={"temple_id": DEMO_TEMPLE_ID},
    )

    assert response.status_code == 401


def test_nonexistent_event_returns_404():
    response = client.get(
        f"/api/v1/events/{uuid.uuid4()}",
        headers=auth_headers(),
    )

    assert response.status_code == 404


def test_super_admin_requires_temple_id_for_event_list():
    response = client.get(
        "/api/v1/events",
        headers=auth_headers(),
    )

    assert response.status_code == 400


def test_event_creation_generates_unique_records():
    first_response = create_event()
    second_response = create_event()

    assert first_response.status_code == 201, first_response.text
    assert second_response.status_code == 201, second_response.text

    first_data = first_response.json()
    second_data = second_response.json()

    assert first_data["id"] != second_data["id"]
    assert first_data["code"] != second_data["code"]
