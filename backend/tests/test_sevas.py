from datetime import date, time
from uuid import uuid4

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

    assert response.status_code == 200

    return response.json()["access_token"]


def create_test_seva(token):
    unique_id = uuid4().hex[:8]

    response = client.post(
        f"/api/v1/sevas?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "name": f"Test Seva {unique_id}",
            "code": f"TEST-{unique_id}",
            "description": "Automated Seva API test",
            "seva_type": "PUJA",
            "amount": "501.00",
            "duration_minutes": 30,
            "max_bookings": 10,
            "requires_slot": True,
            "is_online": True,
        },
    )

    assert response.status_code == 201

    return response.json()


def test_create_seva():
    token = get_admin_token()

    seva = create_test_seva(token)

    assert seva["id"]
    assert seva["temple_id"] == DEMO_TEMPLE_ID
    assert seva["name"].startswith("Test Seva")
    assert seva["amount"] == "501.00"
    assert seva["requires_slot"] is True
    assert seva["is_active"] is True


def test_list_sevas():
    token = get_admin_token()

    response = client.get(
        f"/api/v1/sevas?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    assert all(
        seva["temple_id"] == DEMO_TEMPLE_ID
        for seva in data
    )


def test_get_and_update_seva():
    token = get_admin_token()

    seva = create_test_seva(token)

    response = client.get(
        f"/api/v1/sevas/{seva['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == seva["id"]

    update_response = client.put(
        f"/api/v1/sevas/{seva['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "name": "Updated Test Seva",
            "amount": "751.00",
            "description": "Updated automatically",
        },
    )

    assert update_response.status_code == 200

    updated = update_response.json()

    assert updated["name"] == "Updated Test Seva"
    assert updated["amount"] == "751.00"
    assert updated["description"] == "Updated automatically"


def test_update_seva_status():
    token = get_admin_token()

    seva = create_test_seva(token)

    response = client.patch(
        f"/api/v1/sevas/{seva['id']}/status",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "is_active": False,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["is_active"] is False


def test_duplicate_seva_code_is_rejected():
    token = get_admin_token()

    unique_id = uuid4().hex[:8]
    code = f"DUP-{unique_id}"

    payload = {
        "name": f"Duplicate Seva {unique_id}",
        "code": code,
        "amount": "101.00",
    }

    first_response = client.post(
        f"/api/v1/sevas?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json=payload,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        f"/api/v1/sevas?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json=payload,
    )

    assert second_response.status_code == 409

    assert second_response.json()["detail"] == (
        "Seva code already exists in this temple"
    )


def test_create_and_list_seva_slot():
    token = get_admin_token()

    seva = create_test_seva(token)

    unique_day = date.today().replace(
        day=min(date.today().day + 1, 28)
    )

    response = client.post(
        f"/api/v1/sevas/{seva['id']}/slots",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "slot_date": unique_day.isoformat(),
            "start_time": "08:00:00",
            "end_time": "08:30:00",
            "capacity": 10,
        },
    )

    assert response.status_code == 201

    slot = response.json()

    assert slot["id"]
    assert slot["seva_id"] == seva["id"]
    assert slot["slot_date"] == unique_day.isoformat()
    assert slot["capacity"] == 10
    assert slot["booked_count"] == 0
    assert slot["status"] == "AVAILABLE"

    list_response = client.get(
        f"/api/v1/sevas/{seva['id']}/slots",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert list_response.status_code == 200

    slots = list_response.json()

    assert any(
        item["id"] == slot["id"]
        for item in slots
    )


def test_get_and_update_seva_slot():
    token = get_admin_token()

    seva = create_test_seva(token)

    unique_day = date.today().replace(
        day=min(date.today().day + 2, 28)
    )

    create_response = client.post(
        f"/api/v1/sevas/{seva['id']}/slots",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "slot_date": unique_day.isoformat(),
            "start_time": "09:00:00",
            "end_time": "09:30:00",
            "capacity": 10,
        },
    )

    assert create_response.status_code == 201

    slot = create_response.json()

    get_response = client.get(
        f"/api/v1/sevas/slots/{slot['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert get_response.status_code == 200

    update_response = client.put(
        f"/api/v1/sevas/slots/{slot['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "capacity": 8,
            "start_time": "09:15:00",
            "end_time": "09:45:00",
        },
    )

    assert update_response.status_code == 200

    updated = update_response.json()

    assert updated["capacity"] == 8
    assert updated["start_time"] == "09:15:00"
    assert updated["end_time"] == "09:45:00"


def test_invalid_slot_time_is_rejected():
    token = get_admin_token()

    seva = create_test_seva(token)

    unique_day = date.today().replace(
        day=min(date.today().day + 3, 28)
    )

    response = client.post(
        f"/api/v1/sevas/{seva['id']}/slots",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "slot_date": unique_day.isoformat(),
            "start_time": "10:00:00",
            "end_time": "09:30:00",
            "capacity": 10,
        },
    )

    assert response.status_code == 400

    assert response.json()["detail"] == (
        "end_time must be later than start_time"
    )


def test_slot_capacity_cannot_exceed_seva_max_bookings():
    token = get_admin_token()

    seva = create_test_seva(token)

    unique_day = date.today().replace(
        day=min(date.today().day + 4, 28)
    )

    response = client.post(
        f"/api/v1/sevas/{seva['id']}/slots",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "slot_date": unique_day.isoformat(),
            "start_time": "11:00:00",
            "end_time": "11:30:00",
            "capacity": 11,
        },
    )

    assert response.status_code == 400

    assert response.json()["detail"] == (
        "Slot capacity cannot exceed the seva max_bookings"
    )


def test_duplicate_slot_is_rejected():
    token = get_admin_token()

    seva = create_test_seva(token)

    unique_day = date.today().replace(
        day=min(date.today().day + 5, 28)
    )

    payload = {
        "slot_date": unique_day.isoformat(),
        "start_time": "12:00:00",
        "end_time": "12:30:00",
        "capacity": 10,
    }

    first_response = client.post(
        f"/api/v1/sevas/{seva['id']}/slots",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json=payload,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        f"/api/v1/sevas/{seva['id']}/slots",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json=payload,
    )

    assert second_response.status_code == 409

    assert second_response.json()["detail"] == (
        "A slot already exists for this date and start time"
    )


def test_update_seva_slot_status():
    token = get_admin_token()

    seva = create_test_seva(token)

    unique_day = date.today().replace(
        day=min(date.today().day + 6, 28)
    )

    create_response = client.post(
        f"/api/v1/sevas/{seva['id']}/slots",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "slot_date": unique_day.isoformat(),
            "start_time": "13:00:00",
            "end_time": "13:30:00",
            "capacity": 10,
        },
    )

    assert create_response.status_code == 201

    slot_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/sevas/slots/{slot_id}/status",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "status": "COMPLETED",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "COMPLETED"


def test_seva_requires_authentication():
    response = client.get(
        f"/api/v1/sevas?temple_id={DEMO_TEMPLE_ID}"
    )

    assert response.status_code == 401
