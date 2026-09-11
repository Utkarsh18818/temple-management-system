import uuid

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "TempleOS-Test@2026"

TEMPLE_ID = "d90d0a47-9876-4591-9aab-bb95e2ee644b"


def get_admin_token() -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
        },
    )

    assert response.status_code == 200, response.text

    return response.json()["access_token"]


def admin_headers() -> dict:
    return {
        "Authorization": f"Bearer {get_admin_token()}",
    }


def test_audit_requires_authentication():
    response = client.get(
        "/api/v1/audit",
        params={"temple_id": TEMPLE_ID},
    )

    assert response.status_code == 401


def test_super_admin_requires_temple_id():
    response = client.get(
        "/api/v1/audit",
        headers=admin_headers(),
    )

    assert response.status_code == 400
    assert "temple_id" in response.json()["detail"].lower()


def test_list_audit_logs():
    response = client.get(
        "/api/v1/audit",
        params={"temple_id": TEMPLE_ID},
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)


def test_audit_log_structure():
    response = client.get(
        "/api/v1/audit",
        params={
            "temple_id": TEMPLE_ID,
            "limit": 10,
        },
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    if data:
        audit = data[0]

        expected_fields = {
            "id",
            "temple_id",
            "user_id",
            "action",
            "entity_type",
            "entity_id",
            "old_values",
            "new_values",
            "ip_address",
            "user_agent",
            "created_at",
        }

        assert expected_fields.issubset(audit.keys())


def test_filter_audit_logs_by_action():
    response = client.get(
        "/api/v1/audit",
        params={
            "temple_id": TEMPLE_ID,
            "action": "DONATION_CREATED",
        },
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)

    for audit in data:
        assert audit["action"] == "DONATION_CREATED"


def test_filter_audit_logs_by_entity_type():
    response = client.get(
        "/api/v1/audit",
        params={
            "temple_id": TEMPLE_ID,
            "entity_type": "Donation",
        },
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)

    for audit in data:
        assert audit["entity_type"] == "Donation"


def test_filter_audit_logs_by_user():
    response = client.get(
        "/api/v1/audit",
        params={
            "temple_id": TEMPLE_ID,
            "user_id": "5da34cc7-2157-433e-bd36-0c35395e2bc3",
        },
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)

    for audit in data:
        assert audit["user_id"] == "5da34cc7-2157-433e-bd36-0c35395e2bc3"


def test_filter_audit_logs_by_entity_id():
    entity_id = str(uuid.uuid4())

    response = client.get(
        "/api/v1/audit",
        params={
            "temple_id": TEMPLE_ID,
            "entity_id": entity_id,
        },
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)

    for audit in data:
        assert audit["entity_id"] == entity_id


def test_audit_pagination_limit():
    response = client.get(
        "/api/v1/audit",
        params={
            "temple_id": TEMPLE_ID,
            "limit": 2,
        },
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert isinstance(data, list)
    assert len(data) <= 2


def test_audit_pagination_offset():
    first_response = client.get(
        "/api/v1/audit",
        params={
            "temple_id": TEMPLE_ID,
            "limit": 1,
            "offset": 0,
        },
        headers=admin_headers(),
    )

    second_response = client.get(
        "/api/v1/audit",
        params={
            "temple_id": TEMPLE_ID,
            "limit": 1,
            "offset": 1,
        },
        headers=admin_headers(),
    )

    assert first_response.status_code == 200, first_response.text
    assert second_response.status_code == 200, second_response.text

    first_data = first_response.json()
    second_data = second_response.json()

    assert isinstance(first_data, list)
    assert isinstance(second_data, list)

    if first_data and second_data:
        assert first_data[0]["id"] != second_data[0]["id"]