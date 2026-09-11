from fastapi.testclient import TestClient

from app.core.rate_limit import clear_failed_logins
from app.main import app


client = TestClient(app)

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "TempleOS-Test@2026"


def test_login_success():
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["access_token"]
    assert data["token_type"] == "bearer"


def test_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": ADMIN_EMAIL,
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401

    data = response.json()

    assert data["detail"] == "Invalid username or password"


def test_login_rate_limit_returns_429():
    username = "rate-limit-test@example.com"
    password = "wrong-password"

    rate_limit_key = "testclient|rate-limit-test@example.com"

    clear_failed_logins(rate_limit_key)

    for _ in range(5):
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": username,
                "password": password,
            },
        )

        assert response.status_code == 401

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": username,
            "password": password,
        },
    )

    assert response.status_code == 429

    data = response.json()

    assert data["detail"] == (
        "Too many failed login attempts. "
        "Please try again later."
    )

    assert response.headers["Retry-After"] == "900"

    clear_failed_logins(rate_limit_key)


def test_get_current_user():
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == ADMIN_EMAIL
    assert data["is_active"] is True
    assert data["is_verified"] is True
    assert data["id"] == "5da34cc7-2157-433e-bd36-0c35395e2bc3"


def test_get_current_user_without_token():
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
