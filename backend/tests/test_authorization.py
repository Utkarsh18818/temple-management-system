from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "TempleOS-Test@2026"


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


def test_protected_endpoint_without_token():
    response = client.get("/api/v1/temples")

    assert response.status_code == 401


def test_super_admin_can_list_temples():
    token = get_admin_token()

    response = client.get(
        "/api/v1/temples",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)


def test_super_admin_can_get_existing_temple():
    token = get_admin_token()

    temple_id = "d90d0a47-9876-4591-9aab-bb95e2ee644b"

    response = client.get(
        f"/api/v1/temples/{temple_id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == temple_id


def test_invalid_token_is_rejected():
    response = client.get(
        "/api/v1/temples",
        headers={
            "Authorization": "Bearer invalid-token",
        },
    )

    assert response.status_code == 401
