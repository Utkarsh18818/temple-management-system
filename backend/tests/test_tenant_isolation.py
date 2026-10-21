import os
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = os.environ.get("TEMPLEOS_TEST_ADMIN_PASSWORD", "TempleOS-Test@2026")

TEMPLE_A_CODE = "TEST-TENANT-A"
TEMPLE_B_CODE = "TEST-TENANT-B"

TEMPLE_A_ADMIN_EMAIL = "tenant-a-admin@test.com"
TEMPLE_B_ADMIN_EMAIL = "tenant-b-admin@test.com"

TENANT_PASSWORD = "Tenant-Test@2026"


def get_super_admin_token():
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


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


def create_temple(token, name, code):
    response = client.post(
        "/api/v1/temples",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "name": name,
            "code": code,
            "description": "Automated tenant isolation test temple",
            "address": "Test Address",
            "city": "Test City",
            "state": "Test State",
            "country": "India",
            "pincode": "000000",
            "timezone": "Asia/Kolkata",
        },
    )

    if response.status_code == 409:
        response = client.get(
            "/api/v1/temples",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert response.status_code == 200

        temples = response.json()

        matching_temple = next(
            temple
            for temple in temples
            if temple["code"] == code
        )

        return matching_temple

    assert response.status_code == 201

    return response.json()


def create_temple_admin(
    token,
    temple_id,
    email,
    first_name,
):
    response = client.post(
        "/api/v1/users",
        headers={
            "Authorization": f"Bearer {token}",
        },
        json={
            "temple_id": temple_id,
            "role": "TEMPLE_ADMIN",
            "email": email,
            "password": TENANT_PASSWORD,
            "first_name": first_name,
            "last_name": "Test",
        },
    )

    if response.status_code == 409:
        users_response = client.get(
            "/api/v1/users",
            headers={
                "Authorization": f"Bearer {token}",
            },
        )

        assert users_response.status_code == 200

        users = users_response.json()

        matching_user = next(
            user
            for user in users
            if user["email"] == email
        )

        return matching_user

    assert response.status_code == 201

    return response.json()


def test_temple_admin_can_only_see_own_temple_users():
    super_admin_token = get_super_admin_token()

    temple_a = create_temple(
        super_admin_token,
        "Tenant Isolation Temple A",
        TEMPLE_A_CODE,
    )

    temple_b = create_temple(
        super_admin_token,
        "Tenant Isolation Temple B",
        TEMPLE_B_CODE,
    )

    admin_a = create_temple_admin(
        super_admin_token,
        temple_a["id"],
        TEMPLE_A_ADMIN_EMAIL,
        "TenantA",
    )

    admin_b = create_temple_admin(
        super_admin_token,
        temple_b["id"],
        TEMPLE_B_ADMIN_EMAIL,
        "TenantB",
    )

    token_a = login(
        TEMPLE_A_ADMIN_EMAIL,
        TENANT_PASSWORD,
    )

    token_b = login(
        TEMPLE_B_ADMIN_EMAIL,
        TENANT_PASSWORD,
    )

    users_a_response = client.get(
        "/api/v1/users",
        headers={
            "Authorization": f"Bearer {token_a}",
        },
    )

    assert users_a_response.status_code == 200

    users_a = users_a_response.json()

    assert len(users_a) >= 1

    assert all(
        user["temple_id"] == temple_a["id"]
        for user in users_a
    )

    assert all(
        user["temple_id"] != temple_b["id"]
        for user in users_a
    )

    users_b_response = client.get(
        "/api/v1/users",
        headers={
            "Authorization": f"Bearer {token_b}",
        },
    )

    assert users_b_response.status_code == 200

    users_b = users_b_response.json()

    assert len(users_b) >= 1

    assert all(
        user["temple_id"] == temple_b["id"]
        for user in users_b
    )

    assert all(
        user["temple_id"] != temple_a["id"]
        for user in users_b
    )


def test_temple_admin_cannot_get_user_from_another_temple():
    super_admin_token = get_super_admin_token()

    temple_a = create_temple(
        super_admin_token,
        "Tenant Isolation Temple A",
        TEMPLE_A_CODE,
    )

    temple_b = create_temple(
        super_admin_token,
        "Tenant Isolation Temple B",
        TEMPLE_B_CODE,
    )

    create_temple_admin(
        super_admin_token,
        temple_a["id"],
        TEMPLE_A_ADMIN_EMAIL,
        "TenantA",
    )

    admin_b = create_temple_admin(
        super_admin_token,
        temple_b["id"],
        TEMPLE_B_ADMIN_EMAIL,
        "TenantB",
    )

    token_a = login(
        TEMPLE_A_ADMIN_EMAIL,
        TENANT_PASSWORD,
    )

    response = client.get(
        f"/api/v1/users/{admin_b['id']}",
        headers={
            "Authorization": f"Bearer {token_a}",
        },
    )

    assert response.status_code == 403

    data = response.json()

    assert data["detail"] == (
        "You cannot access users from another temple"
    )
