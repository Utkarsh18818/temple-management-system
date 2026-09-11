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


def get_super_admin_token():
    return login(
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
    )


def test_create_devotee():
    token = get_super_admin_token()

    unique_id = uuid4().hex[:8]

    response = client.post(
        f"/api/v1/devotees?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "first_name": "Test",
            "last_name": f"Devotee{unique_id}",
            "email": f"devotee-{unique_id}@test.com",
            "phone": f"90000{unique_id[:5]}",
            "address": "Test Address",
            "city": "Bareilly",
            "state": "Uttar Pradesh",
            "country": "India",
            "pincode": "243001",
            "gotra": "Kashyap",
            "notes": "Automated API test",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"]
    assert data["temple_id"] == DEMO_TEMPLE_ID
    assert data["first_name"] == "Test"
    assert data["last_name"] == f"Devotee{unique_id}"
    assert data["is_active"] is True
    assert data["is_verified"] is False


def test_list_devotees():
    token = get_super_admin_token()

    response = client.get(
        f"/api/v1/devotees?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    assert all(
        devotee["temple_id"] == DEMO_TEMPLE_ID
        for devotee in data
    )


def test_get_and_update_devotee():
    token = get_super_admin_token()

    unique_id = uuid4().hex[:8]

    create_response = client.post(
        f"/api/v1/devotees?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "first_name": "Original",
            "last_name": f"Devotee{unique_id}",
            "email": f"original-{unique_id}@test.com",
            "phone": f"91111{unique_id[:5]}",
        },
    )

    assert create_response.status_code == 201

    devotee = create_response.json()
    devotee_id = devotee["id"]

    get_response = client.get(
        f"/api/v1/devotees/{devotee_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert get_response.status_code == 200

    get_data = get_response.json()

    assert get_data["id"] == devotee_id
    assert get_data["first_name"] == "Original"

    update_response = client.put(
        f"/api/v1/devotees/{devotee_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "first_name": "Updated",
            "notes": "Updated by automated test",
        },
    )

    assert update_response.status_code == 200

    updated_data = update_response.json()

    assert updated_data["id"] == devotee_id
    assert updated_data["first_name"] == "Updated"
    assert updated_data["notes"] == "Updated by automated test"


def test_update_devotee_status():
    token = get_super_admin_token()

    unique_id = uuid4().hex[:8]

    create_response = client.post(
        f"/api/v1/devotees?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "first_name": "Status",
            "last_name": f"Test{unique_id}",
            "email": f"status-{unique_id}@test.com",
        },
    )

    assert create_response.status_code == 201

    devotee_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/devotees/{devotee_id}/status",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "is_active": False,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == devotee_id
    assert data["is_active"] is False


def test_duplicate_devotee_email_is_rejected():
    token = get_super_admin_token()

    unique_id = uuid4().hex[:8]
    email = f"duplicate-{unique_id}@test.com"

    payload = {
        "first_name": "Duplicate",
        "last_name": "Test",
        "email": email,
    }

    first_response = client.post(
        f"/api/v1/devotees?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json=payload,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        f"/api/v1/devotees?temple_id={DEMO_TEMPLE_ID}",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json=payload,
    )

    assert second_response.status_code == 409

    data = second_response.json()

    assert data["detail"] == (
        "Devotee with this email or phone "
        "already exists in this temple"
    )


def test_devotee_endpoint_requires_authentication():
    response = client.get(
        f"/api/v1/devotees?temple_id={DEMO_TEMPLE_ID}"
    )

    assert response.status_code == 401


def test_temple_admin_cannot_access_another_temple_devotee():
    token_a = login(
        TEMPLE_A_ADMIN_EMAIL,
        TENANT_PASSWORD,
    )

    token_b = login(
        TEMPLE_B_ADMIN_EMAIL,
        TENANT_PASSWORD,
    )

    # Create a devotee in Temple B.
    # We first discover Temple B from the admin's accessible users.
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

    unique_id = uuid4().hex[:8]

    create_response = client.post(
        f"/api/v1/devotees?temple_id={temple_b_id}",
        headers={
            "Authorization": f"Bearer {token_b}",
        },
        json={
            "first_name": "TempleB",
            "last_name": f"Private{unique_id}",
            "email": f"temple-b-{unique_id}@test.com",
        },
    )

    assert create_response.status_code == 201

    devotee_b = create_response.json()

    # Temple A admin attempts to access Temple B devotee.
    response = client.get(
        f"/api/v1/devotees/{devotee_b['id']}",
        headers={
            "Authorization": f"Bearer {token_a}",
        },
    )

    assert response.status_code == 403

    data = response.json()

    assert data["detail"] == (
        "You cannot access devotees from another temple"
    )


def test_temple_admin_cannot_create_devotee_for_another_temple():
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

    unique_id = uuid4().hex[:8]

    response = client.post(
        f"/api/v1/devotees?temple_id={temple_b_id}",
        headers={
            "Authorization": f"Bearer {token_a}",
        },
        json={
            "first_name": "Unauthorized",
            "last_name": f"Creation{unique_id}",
            "email": f"unauthorized-{unique_id}@test.com",
        },
    )

    assert response.status_code == 403

    data = response.json()

    assert data["detail"] == (
        "You can only access devotees from your own temple"
    )
