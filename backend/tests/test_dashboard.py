import os
import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = os.environ.get("TEMPLEOS_TEST_ADMIN_PASSWORD", "TempleOS-Test@2026")

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


def test_dashboard_requires_authentication():
    response = client.get("/api/v1/dashboard")

    assert response.status_code == 401


def test_super_admin_requires_temple_id():
    response = client.get(
        "/api/v1/dashboard",
        headers=admin_headers(),
    )

    assert response.status_code == 400
    assert "temple_id" in response.json()["detail"].lower()


def test_dashboard_returns_summary():
    response = client.get(
        f"/api/v1/dashboard?temple_id={TEMPLE_ID}",
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert "summary" in data
    assert "recent_donations" in data
    assert "recent_bookings" in data


def test_dashboard_summary_contains_all_metrics():
    response = client.get(
        f"/api/v1/dashboard?temple_id={TEMPLE_ID}",
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    summary = response.json()["summary"]

    expected_fields = {
        "total_donations",
        "completed_donations",
        "pending_donations",
        "today_donations",
        "month_donations",
        "total_donation_amount",
        "today_donation_amount",
        "month_donation_amount",
        "total_bookings",
        "pending_bookings",
        "confirmed_bookings",
        "completed_bookings",
        "cancelled_bookings",
        "today_bookings",
        "total_devotees",
        "active_devotees",
        "new_devotees_this_month",
        "active_festivals",
        "upcoming_events",
        "today_events",
    }

    assert expected_fields.issubset(summary.keys())


def test_dashboard_summary_values_are_valid():
    response = client.get(
        f"/api/v1/dashboard?temple_id={TEMPLE_ID}",
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    summary = response.json()["summary"]

    numeric_fields = [
        "total_donations",
        "completed_donations",
        "pending_donations",
        "today_donations",
        "month_donations",
        "total_bookings",
        "pending_bookings",
        "confirmed_bookings",
        "completed_bookings",
        "cancelled_bookings",
        "today_bookings",
        "total_devotees",
        "active_devotees",
        "new_devotees_this_month",
        "active_festivals",
        "upcoming_events",
        "today_events",
    ]

    for field in numeric_fields:
        assert isinstance(summary[field], int)
        assert summary[field] >= 0

    amount_fields = [
        "total_donation_amount",
        "today_donation_amount",
        "month_donation_amount",
    ]

    for field in amount_fields:
        assert float(summary[field]) >= 0


def test_dashboard_recent_donations_is_list():
    response = client.get(
        f"/api/v1/dashboard?temple_id={TEMPLE_ID}",
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    donations = response.json()["recent_donations"]

    assert isinstance(donations, list)


def test_dashboard_recent_bookings_is_list():
    response = client.get(
        f"/api/v1/dashboard?temple_id={TEMPLE_ID}",
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    bookings = response.json()["recent_bookings"]

    assert isinstance(bookings, list)


def test_dashboard_recent_donation_structure():
    response = client.get(
        f"/api/v1/dashboard?temple_id={TEMPLE_ID}",
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    donations = response.json()["recent_donations"]

    if donations:
        donation = donations[0]

        expected_fields = {
            "id",
            "donation_number",
            "donor_name",
            "amount",
            "donation_type",
            "status",
            "donated_at",
        }

        assert expected_fields.issubset(donation.keys())


def test_dashboard_recent_booking_structure():
    response = client.get(
        f"/api/v1/dashboard?temple_id={TEMPLE_ID}",
        headers=admin_headers(),
    )

    assert response.status_code == 200, response.text

    bookings = response.json()["recent_bookings"]

    if bookings:
        booking = bookings[0]

        expected_fields = {
            "id",
            "booking_number",
            "amount",
            "status",
            "payment_status",
            "booking_date",
        }

        assert expected_fields.issubset(booking.keys())


def test_dashboard_unknown_temple_returns_empty_or_not_found():
    unknown_temple_id = str(uuid.uuid4())

    response = client.get(
        f"/api/v1/dashboard?temple_id={unknown_temple_id}",
        headers=admin_headers(),
    )

    assert response.status_code in (200, 404)
