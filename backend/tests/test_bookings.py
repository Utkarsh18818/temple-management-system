from datetime import date
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "TempleOS-Test@2026"

DEMO_TEMPLE_ID = "d90d0a47-9876-4591-9aab-bb95e2ee644b"

TEMPLE_A_ADMIN_EMAIL = "tenant-a-admin@test.com"
TEMPLE_B_ADMIN_EMAIL = "tenant-b-admin@test.com"
TENANT_PASSWORD = "Tenant-Test@2026"


def login(email, password):
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def get_admin_token():
    return login(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
    )


def create_devotee(token):
    unique_id = uuid4().hex[:8]

    response = client.post(
        f"/api/v1/devotees?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "first_name": "Booking",
            "last_name": f"Test{unique_id}",
            "email": f"booking-{unique_id}@test.com",
            "phone": f"90000{unique_id[:5]}",
        },
    )

    assert response.status_code == 201

    return response.json()


def create_seva(token, amount="501.00", max_bookings=10):
    unique_id = uuid4().hex[:8]

    response = client.post(
        f"/api/v1/sevas?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "name": f"Booking Seva {unique_id}",
            "code": f"BOOK-{unique_id}",
            "description": "Automated booking test seva",
            "seva_type": "PUJA",
            "amount": amount,
            "duration_minutes": 30,
            "max_bookings": max_bookings,
            "requires_slot": True,
            "is_online": True,
        },
    )

    assert response.status_code == 201

    return response.json()


def create_slot(token, seva_id, capacity=10):
    unique_id = uuid4().hex[:8]

    # Use a deterministic future date that won't collide with
    # existing manually-created test slots.
    day = min(date.today().day + 7, 28)

    response = client.post(
        f"/api/v1/sevas/{seva_id}/slots",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "slot_date": date(
                date.today().year,
                date.today().month,
                day,
            ).isoformat(),
            "start_time": f"{(7 + int(unique_id[:2], 16) % 10):02d}:00:00",
            "end_time": f"{(7 + int(unique_id[:2], 16) % 10):02d}:30:00",
            "capacity": capacity,
        },
    )

    assert response.status_code == 201

    return response.json()


def create_booking(token, devotee, seva, slot, quantity=1):
    response = client.post(
        "/api/v1/bookings",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "devotee_id": devotee["id"],
            "seva_id": seva["id"],
            "slot_id": slot["id"],
            "booking_date": slot["slot_date"],
            "quantity": quantity,
            "special_request": "Automated booking test",
        },
    )

    return response


def test_create_booking_calculates_amount():
    token = get_admin_token()

    devotee = create_devotee(token)
    seva = create_seva(
        token,
        amount="501.00",
        max_bookings=10,
    )
    slot = create_slot(
        token,
        seva["id"],
        capacity=10,
    )

    response = create_booking(
        token,
        devotee,
        seva,
        slot,
        quantity=2,
    )

    assert response.status_code == 201

    booking = response.json()

    assert booking["id"]
    assert booking["temple_id"] == DEMO_TEMPLE_ID
    assert booking["devotee_id"] == devotee["id"]
    assert booking["seva_id"] == seva["id"]
    assert booking["slot_id"] == slot["id"]
    assert booking["quantity"] == 2
    assert booking["amount"] == "1002.00"
    assert booking["status"] == "PENDING"
    assert booking["payment_status"] == "PENDING"
    assert booking["special_request"] == "Automated booking test"


def test_booking_increments_slot_booked_count():
    token = get_admin_token()

    devotee = create_devotee(token)
    seva = create_seva(token)
    slot = create_slot(
        token,
        seva["id"],
        capacity=10,
    )

    response = create_booking(
        token,
        devotee,
        seva,
        slot,
        quantity=3,
    )

    assert response.status_code == 201

    slot_response = client.get(
        f"/api/v1/sevas/slots/{slot['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert slot_response.status_code == 200

    updated_slot = slot_response.json()

    assert updated_slot["booked_count"] == 3
    assert updated_slot["status"] == "AVAILABLE"


def test_slot_becomes_full_when_capacity_is_reached():
    token = get_admin_token()

    devotee = create_devotee(token)
    seva = create_seva(
        token,
        max_bookings=3,
    )
    slot = create_slot(
        token,
        seva["id"],
        capacity=3,
    )

    response = create_booking(
        token,
        devotee,
        seva,
        slot,
        quantity=3,
    )

    assert response.status_code == 201

    slot_response = client.get(
        f"/api/v1/sevas/slots/{slot['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert slot_response.status_code == 200

    updated_slot = slot_response.json()

    assert updated_slot["booked_count"] == 3
    assert updated_slot["status"] == "FULL"


def test_booking_rejects_quantity_above_remaining_capacity():
    token = get_admin_token()

    devotee = create_devotee(token)
    seva = create_seva(
        token,
        max_bookings=5,
    )
    slot = create_slot(
        token,
        seva["id"],
        capacity=5,
    )

    first_response = create_booking(
        token,
        devotee,
        seva,
        slot,
        quantity=3,
    )

    assert first_response.status_code == 201

    second_devotee = create_devotee(token)

    second_response = create_booking(
        token,
        second_devotee,
        seva,
        slot,
        quantity=3,
    )

    assert second_response.status_code == 400

    assert second_response.json()["detail"] == (
        "Only 2 booking(s) remaining for this slot"
    )


def test_booking_requires_slot_when_seva_requires_slot():
    token = get_admin_token()

    devotee = create_devotee(token)
    seva = create_seva(token)

    response = client.post(
        "/api/v1/bookings",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "devotee_id": devotee["id"],
            "seva_id": seva["id"],
            "booking_date": date.today().isoformat(),
            "quantity": 1,
        },
    )

    assert response.status_code == 400

    assert response.json()["detail"] == (
        "This seva requires a slot"
    )


def test_booking_rejects_mismatched_slot_date():
    token = get_admin_token()

    devotee = create_devotee(token)
    seva = create_seva(token)
    slot = create_slot(token, seva["id"])

    response = client.post(
        "/api/v1/bookings",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "devotee_id": devotee["id"],
            "seva_id": seva["id"],
            "slot_id": slot["id"],
            "booking_date": date(
                date.today().year,
                date.today().month,
                min(date.today().day + 8, 28),
            ).isoformat(),
            "quantity": 1,
        },
    )

    assert response.status_code == 400

    assert response.json()["detail"] == (
        "Slot date must match booking date"
    )


def test_get_list_and_update_booking():
    token = get_admin_token()

    devotee = create_devotee(token)
    seva = create_seva(token)
    slot = create_slot(token, seva["id"])

    create_response = create_booking(
        token,
        devotee,
        seva,
        slot,
    )

    assert create_response.status_code == 201

    booking = create_response.json()

    get_response = client.get(
        f"/api/v1/bookings/{booking['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert get_response.status_code == 200

    fetched = get_response.json()

    assert fetched["id"] == booking["id"]

    list_response = client.get(
        f"/api/v1/bookings?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert list_response.status_code == 200

    bookings = list_response.json()

    assert any(
        item["id"] == booking["id"]
        for item in bookings
    )

    update_response = client.put(
        f"/api/v1/bookings/{booking['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "status": "CONFIRMED",
            "payment_status": "PAID",
            "special_request": "Updated booking request",
        },
    )

    assert update_response.status_code == 200

    updated = update_response.json()

    assert updated["status"] == "CONFIRMED"
    assert updated["payment_status"] == "PAID"
    assert updated["special_request"] == "Updated booking request"
    assert updated["confirmed_at"] is not None


def test_cancelling_booking_releases_slot_capacity():
    token = get_admin_token()

    devotee = create_devotee(token)
    seva = create_seva(token)
    slot = create_slot(
        token,
        seva["id"],
        capacity=5,
    )

    create_response = create_booking(
        token,
        devotee,
        seva,
        slot,
        quantity=2,
    )

    assert create_response.status_code == 201

    booking = create_response.json()

    before_cancel = client.get(
        f"/api/v1/sevas/slots/{slot['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert before_cancel.status_code == 200
    assert before_cancel.json()["booked_count"] == 2

    cancel_response = client.put(
        f"/api/v1/bookings/{booking['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "status": "CANCELLED",
        },
    )

    assert cancel_response.status_code == 200

    cancelled = cancel_response.json()

    assert cancelled["status"] == "CANCELLED"

    after_cancel = client.get(
        f"/api/v1/sevas/slots/{slot['id']}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert after_cancel.status_code == 200

    updated_slot = after_cancel.json()

    assert updated_slot["booked_count"] == 0
    assert updated_slot["status"] == "AVAILABLE"


def test_booking_endpoint_requires_authentication():
    response = client.get(
        "/api/v1/bookings",
    )

    assert response.status_code == 401


def test_temple_admin_cannot_access_another_temple_booking():
    token_a = login(
        TEMPLE_A_ADMIN_EMAIL,
        TENANT_PASSWORD,
    )

    token_b = login(
        TEMPLE_B_ADMIN_EMAIL,
        TENANT_PASSWORD,
    )

    users_response = client.get(
        "/api/v1/users",
        headers={
            "Authorization": f"Bearer {token_b}",
        },
    )

    assert users_response.status_code == 200

    users = users_response.json()

    assert users

    temple_b_id = users[0]["temple_id"]

    devotee_id = None

    # Find an existing Temple B devotee, if available.
    devotee_response = client.get(
        f"/api/v1/devotees?temple_id={temple_b_id}",
        headers={
            "Authorization": f"Bearer {token_b}",
        },
    )

    assert devotee_response.status_code == 200

    devotees = devotee_response.json()

    if devotees:
        devotee_id = devotees[0]["id"]

    # If no devotee exists yet, create one.
    if devotee_id is None:
        unique_id = uuid4().hex[:8]

        create_devotee_response = client.post(
            f"/api/v1/devotees?temple_id={temple_b_id}",
            headers={
                "Authorization": f"Bearer {token_b}",
            },
            json={
                "first_name": "Booking",
                "last_name": f"TenantB{unique_id}",
                "email": f"booking-b-{unique_id}@test.com",
            },
        )

        assert create_devotee_response.status_code == 201

        devotee_id = create_devotee_response.json()["id"]

    sevas_response = client.get(
        f"/api/v1/sevas?temple_id={temple_b_id}",
        headers={
            "Authorization": f"Bearer {token_b}",
        },
    )

    assert sevas_response.status_code == 200

    sevas = sevas_response.json()

    if not sevas:
        unique_id = uuid4().hex[:8]

        create_seva_response = client.post(
            f"/api/v1/sevas?temple_id={temple_b_id}",
            headers={
                "Authorization": f"Bearer {token_b}",
            },
            json={
                "name": f"Tenant B Booking Seva {unique_id}",
                "code": f"TB-{unique_id}",
                "amount": "501.00",
                "requires_slot": False,
                "is_online": True,
            },
        )

        assert create_seva_response.status_code == 201

        seva = create_seva_response.json()
    else:
        seva = sevas[0]

    create_booking_response = client.post(
        "/api/v1/bookings",
        headers={
            "Authorization": f"Bearer {token_b}",
        },
        json={
            "devotee_id": devotee_id,
            "seva_id": seva["id"],
            "booking_date": date.today().isoformat(),
            "quantity": 1,
        },
    )

    assert create_booking_response.status_code == 201

    booking_b = create_booking_response.json()

    response = client.get(
        f"/api/v1/bookings/{booking_b['id']}",
        headers={
            "Authorization": f"Bearer {token_a}",
        },
    )

    assert response.status_code == 403

    assert response.json()["detail"] == (
        "You cannot access bookings from another temple"
    )
