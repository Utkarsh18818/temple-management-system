"""Isolated regression tests: SQLite only, no live database or gateway calls."""
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from uuid import uuid4
from contextlib import asynccontextmanager

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.base import Base
from app.models import AuditLog, Devotee, Donation, Payment, Receipt, Role, Seva, SevaBooking, SevaSlot, Temple, User
from app.services.booking_lifecycle import expire_reservations


@pytest.fixture
def world(monkeypatch):
    @asynccontextmanager
    async def isolated_lifespan(app):
        yield
    monkeypatch.setattr(app.router, "lifespan_context", isolated_lifespan)
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    with engine.connect() as connection:
        connection.exec_driver_sql("PRAGMA foreign_keys=ON")
    Base.metadata.create_all(engine)
    db = Session(engine, expire_on_commit=False)
    temple = Temple(id=uuid4(), name="Mandir", code="MANDIR", timezone="Asia/Kolkata")
    other = Temple(id=uuid4(), name="Other", code="OTHER")
    roles = {name: Role(id=uuid4(), name=name) for name in ["SUPER_ADMIN", "TEMPLE_ADMIN", "STAFF", "VOLUNTEER"]}
    db.add_all([temple, other, *roles.values()]); db.flush()
    users = {name: User(id=uuid4(), temple_id=None if name == "SUPER_ADMIN" else temple.id, role_id=role.id,
                       first_name=name, email=f"{name.lower()}@example.com", password_hash="unused", is_active=True)
             for name, role in roles.items()}
    devotee = Devotee(id=uuid4(), temple_id=temple.id, first_name="Personal", email=users["VOLUNTEER"].email)
    stranger = Devotee(id=uuid4(), temple_id=temple.id, first_name="Other", email="other@example.com")
    seva = Seva(id=uuid4(), temple_id=temple.id, name="Archana", code="ARCHANA", amount=Decimal("101"), requires_slot=True)
    db.add_all([*users.values(), devotee, stranger, seva]); db.flush()
    slot = SevaSlot(id=uuid4(), seva_id=seva.id, slot_date=date.today(), start_time=time(9), capacity=2, booked_count=1)
    db.add(slot); db.flush()
    booking = SevaBooking(id=uuid4(), temple_id=temple.id, devotee_id=devotee.id, seva_id=seva.id, slot_id=slot.id,
                          booking_number="BK-OWN", booking_date=date.today(), quantity=1, amount=Decimal("101"), status="PENDING", payment_status="PENDING")
    donation = Donation(id=uuid4(), temple_id=temple.id, devotee_id=stranger.id, donation_number="DN-OTHER", amount=Decimal("501"), donor_name="Other donor", donated_at=datetime.now(timezone.utc), status="COMPLETED")
    db.add_all([slot, booking, donation]); db.flush()
    receipt = Receipt(id=uuid4(), temple_id=temple.id, donation_id=donation.id, receipt_number="RC-OTHER", amount=donation.amount, receipt_type="DONATION", issued_at=datetime.now(timezone.utc), pdf_path="receipts/foreign.pdf")
    db.add(receipt); db.commit()
    actor = {"user": users["SUPER_ADMIN"]}
    def current():
        db.info["audit_actor"] = actor["user"]
        return actor["user"]
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_user] = current
    monkeypatch.setattr("app.api.v1.payments.create_donation_receipt", lambda **kw: None)
    monkeypatch.setattr("app.api.v1.payments.create_booking_receipt", lambda **kw: None)
    with TestClient(app) as client:
        yield locals()
    app.dependency_overrides.clear(); db.close(); engine.dispose()


@pytest.mark.parametrize("path", ["/payments", "/donations", "/receipts", "/bookings", "/sevas", "/devotees", "/events", "/festivals", "/dashboard", "/audit", "/temples"])
def test_devotee_cannot_access_management(world, path):
    world["actor"]["user"] = world["users"]["VOLUNTEER"]
    response = world["client"].get("/api/v1" + path)
    assert response.status_code == 403, response.text


def test_unassigned_staff_is_rejected(world):
    user = world["users"]["STAFF"]; user.temple_id = None
    world["actor"]["user"] = user
    assert world["client"].get("/api/v1/payments").status_code == 403


def test_personal_history_and_foreign_pdf_are_isolated(world):
    world["actor"]["user"] = world["users"]["VOLUNTEER"]
    client = world["client"]
    assert client.get("/api/v1/public/account/donations").json() == []
    assert client.get("/api/v1/public/account/receipts").json() == []
    rid = world["receipt"].id
    assert client.get(f"/api/v1/public/account/receipts/{rid}").status_code == 404
    assert client.get(f"/api/v1/public/account/receipts/{rid}/pdf").status_code == 404
    world["donation"].devotee_id = world["devotee"].id; world["db"].commit()
    assert len(client.get("/api/v1/public/account/donations").json()) == 1
    assert len(client.get("/api/v1/public/account/receipts").json()) == 1


def test_temple_staff_sees_only_assigned_temple(world):
    world["actor"]["user"] = world["users"]["TEMPLE_ADMIN"]
    data = world["client"].get("/api/v1/temples").json()
    assert [item["id"] for item in data] == [str(world["temple"].id)]
    assert world["client"].get(f'/api/v1/temples/{world["other"].id}').status_code == 403


def payment(world, amount, status, *, booking=False, temple=None, new_source=False):
    donation = world["donation"]
    if new_source:
        donation = Donation(id=uuid4(), temple_id=(temple or world["temple"]).id, donation_number=str(uuid4()),
                            amount=Decimal(amount), donor_name="Isolated donor", donated_at=datetime.now(timezone.utc))
        world["db"].add(donation); world["db"].flush()
    record = Payment(id=uuid4(), temple_id=(temple or world["temple"]).id,
                     booking_id=world["booking"].id if booking else None,
                     donation_id=None if booking else donation.id,
                     transaction_id=str(uuid4()), amount=Decimal(amount), currency="INR", payment_method="CASH", status=status,
                     paid_at=datetime(2026, 10, 20, 20, tzinfo=timezone.utc))
    world["db"].add(record); world["db"].commit(); return record


def test_refund_updates_donation_and_voids_pdf(world):
    p = payment(world, "501", "SUCCESS")
    response = world["client"].put(f"/api/v1/payments/{p.id}", json={"status":"REFUNDED"})
    assert response.status_code == 200, response.text
    assert world["donation"].status == "REFUNDED"
    assert world["client"].get(f'/api/v1/receipts/{world["receipt"].id}/pdf').status_code == 409


def test_refund_releases_slot_once_and_cannot_reconfirm(world):
    b = world["booking"]; b.status="CONFIRMED"; b.payment_status="PAID"
    p = payment(world, "101", "SUCCESS", booking=True)
    client = world["client"]
    assert client.put(f"/api/v1/payments/{p.id}", json={"status":"REFUNDED"}).status_code == 200
    assert b.status == "CANCELLED" and b.payment_status == "REFUNDED"
    assert world["slot"].booked_count == 0
    assert client.put(f"/api/v1/payments/{p.id}", json={"status":"REFUNDED"}).status_code == 200
    assert world["slot"].booked_count == 0
    assert client.put(f"/api/v1/bookings/{b.id}", json={"status":"CONFIRMED"}).status_code == 409


def test_reservation_expiry_is_idempotent(world):
    db = world["db"]; b=world["booking"]
    b.created_at=datetime.now(timezone.utc)-timedelta(minutes=21); db.commit()
    expire_reservations(db); db.commit()
    assert b.status == "CANCELLED" and world["slot"].booked_count == 0
    expire_reservations(db); db.commit()
    assert world["slot"].booked_count == 0


def test_income_excludes_pending_failed_refunded_and_other_tenants(world):
    # Give each payment its own source to respect active-payment uniqueness.
    p=payment(world,"101","SUCCESS",booking=True)
    payment(world,"501","REFUNDED")
    payment(world,"200","PENDING", new_source=True)
    payment(world,"300","FAILED", new_source=True)
    payment(world,"9000","SUCCESS", temple=world["other"], new_source=True)
    response=world["client"].get(f'/api/v1/payments/summary?temple_id={world["temple"].id}&date_from=2026-10-21&date_to=2026-10-21')
    assert response.status_code == 200, response.text
    data=response.json()
    assert Decimal(data["seva"]["received"]) == 101
    assert Decimal(data["donations"]["received"]) == 0
    assert Decimal(data["donations"]["refunded"]) == 501
    assert Decimal(data["total_received"]) == 101
    assert Decimal(data["donations"]["pending"]) == 200
    assert world["client"].get(f'/api/v1/payments/summary?temple_id={world["temple"].id}&date_from=2026-10-22&date_to=2026-10-21').status_code == 422


def test_operational_audit_omits_private_fields(world):
    db=world["db"]; db.info["audit_actor"]=world["users"]["SUPER_ADMIN"]
    world["seva"].amount=Decimal("151"); world["devotee"].phone="1234567890"; db.commit()
    logs=db.scalars(select(AuditLog).where(AuditLog.entity_type == "Seva")).all()
    assert logs and logs[-1].new_values["amount"] == "151"
    assert "phone" not in str([log.new_values for log in logs])


def test_new_temple_audit_is_inserted_after_parent(world):
    response=world["client"].post("/api/v1/temples", json={"name":"New mandir", "code":"NEW-MANDIR"})
    assert response.status_code == 201, response.text
    assert world["db"].scalar(select(AuditLog).where(AuditLog.action == "TEMPLE_CREATED")) is not None


def test_staff_can_list_assigned_seva_slots(world):
    world["actor"]["user"] = world["users"]["TEMPLE_ADMIN"]
    response=world["client"].get(f'/api/v1/sevas/{world["seva"].id}/slots')
    assert response.status_code == 200, response.text
    assert len(response.json()) == 1
    world["actor"]["user"] = world["users"]["VOLUNTEER"]
    assert world["client"].get(f'/api/v1/sevas/{world["seva"].id}/slots').status_code == 403


def test_public_booking_revalidates_capacity_and_server_amount(world, monkeypatch):
    world["actor"]["user"] = world["users"]["VOLUNTEER"]
    monkeypatch.setattr("app.api.v1.public_bookings.acquire_numbering_lock", lambda *args:None)
    payload={"seva_id":str(world["seva"].id),"slot_id":str(world["slot"].id),"booking_date":date.today().isoformat(),"quantity":1}
    response=world["client"].post("/api/v1/public/bookings",json=payload)
    assert response.status_code == 201, response.text
    assert Decimal(response.json()["amount"]) == 101
    assert world["slot"].booked_count == 2
    assert world["client"].post("/api/v1/public/bookings",json=payload).status_code == 400


def test_devotee_cannot_mutate_payment(world):
    p=payment(world,"501","PENDING")
    world["actor"]["user"]=world["users"]["VOLUNTEER"]
    assert world["client"].put(f"/api/v1/payments/{p.id}",json={"status":"SUCCESS"}).status_code == 403
    assert p.status == "PENDING"


def test_late_capture_does_not_reopen_released_capacity(world):
    from fastapi import HTTPException
    from app.services.booking_lifecycle import ensure_booking_payable
    b=world["booking"];b.status="CANCELLED";world["slot"].booked_count=0
    p=payment(world,"101","SUCCESS",booking=True)
    with pytest.raises(HTTPException) as error:
        ensure_booking_payable(world["db"],b,p)
    assert error.value.status_code == 409
    assert b.status == "CANCELLED" and b.payment_status == "PAID"
    assert world["slot"].booked_count == 0
    assert "manual" in p.failure_reason


def test_event_delete_and_audit_are_connected(world):
    from app.models import Event
    event=Event(id=uuid4(), temple_id=world["temple"].id, name="Disposable test event", code="TEST-EVENT", event_date=date.today(), start_time=time(18))
    world["db"].add(event); world["db"].commit()
    response=world["client"].delete(f"/api/v1/events/{event.id}")
    assert response.status_code == 204, response.text
    assert world["db"].scalar(select(AuditLog).where(AuditLog.action == "EVENT_DELETED", AuditLog.entity_id == event.id)) is not None


def test_create_and_download_receipt_pdf(world, monkeypatch):
    from pathlib import Path
    from app.api.v1.receipts import resolve_receipt_pdf_path
    db=world["db"]
    donation=Donation(id=uuid4(), temple_id=world["temple"].id, donation_number="DN-PDF", amount=Decimal("151"), donor_name="Isolated donor", donated_at=datetime.now(timezone.utc), status="COMPLETED")
    db.add(donation);db.commit()
    monkeypatch.setattr("app.api.v1.receipts.generate_receipt_number",lambda *args,**kw: f"RC-TEST-{uuid4().hex}")
    response=world["client"].post(f'/api/v1/receipts?temple_id={world["temple"].id}',json={"donation_id":str(donation.id),"receipt_type":"DONATION"})
    assert response.status_code == 201, response.text
    data=response.json(); path=resolve_receipt_pdf_path(data["pdf_path"])
    assert resolve_receipt_pdf_path(data["pdf_path"].replace("/", "\\")) == path
    try:
        pdf=world["client"].get(f'/api/v1/receipts/{data["id"]}/pdf')
        assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")
        assert pdf.headers["content-type"] == "application/pdf"
        assert world["client"].get(f'/api/v1/receipts/{data["id"]}').json()["status"] == "ISSUED"
        Path(path).unlink()
        rebuilt=world["client"].get(f'/api/v1/receipts/{data["id"]}/pdf')
        assert rebuilt.status_code == 200 and rebuilt.content.startswith(b"%PDF")
    finally:
        Path(path).unlink(missing_ok=True)


def test_same_email_has_separate_accounts_and_passwords_per_temple(world, monkeypatch):
    monkeypatch.setattr("app.api.v1.public_auth.hash_password",lambda value:"test:"+value)
    monkeypatch.setattr("app.api.v1.public_auth.verify_password",lambda value,hashed:hashed=="test:"+value)
    client=world["client"]
    payload={"email":"same-person@example.com","first_name":"Portal devotee","password":"temple-one-pass","temple_id":str(world["temple"].id)}
    first=client.post("/api/v1/public/auth/register",json=payload)
    assert first.status_code == 201, first.text
    assert client.post("/api/v1/public/auth/register",json=payload).status_code == 409
    payload.update(temple_id=str(world["other"].id),password="temple-two-pass")
    second=client.post("/api/v1/public/auth/register",json=payload)
    assert second.status_code == 201, second.text
    assert first.json()["devotee"]["id"] != second.json()["devotee"]["id"]
    login={"identifier":payload["email"],"password":"temple-one-pass","temple_id":str(world["other"].id)}
    assert client.post("/api/v1/public/auth/login",json=login).status_code == 401
    login["temple_id"]=str(world["temple"].id)
    assert client.post("/api/v1/public/auth/login",json=login).json()["devotee"]["temple_id"] == str(world["temple"].id)
    login["temple_id"]=str(world["other"].id);login["password"]="temple-two-pass"
    assert client.post("/api/v1/public/auth/login",json=login).json()["devotee"]["temple_id"] == str(world["other"].id)
    del login["temple_id"]
    assert client.post("/api/v1/public/auth/login",json=login).status_code == 422


def test_public_account_cannot_sign_into_staff_environment(world):
    response=world["client"].post("/api/v1/auth/login",data={"username":world["users"]["VOLUNTEER"].email,"password":"unused","temple_id":str(world["temple"].id)})
    assert response.status_code == 401


def test_public_registration_and_login_with_real_password_hashing(world):
    client = world["client"]
    payload = {"temple_id": str(world["temple"].id), "email": "real-hash@example.com",
               "first_name": "Hash regression", "password": "Isolated-Regression@2026"}
    registered = client.post("/api/v1/public/auth/register", json=payload)
    assert registered.status_code == 201, registered.text
    login = {"temple_id": payload["temple_id"], "identifier": payload["email"], "password": payload["password"]}
    signed_in = client.post("/api/v1/public/auth/login", json=login)
    assert signed_in.status_code == 200, signed_in.text
    assert signed_in.json()["devotee"]["id"] == registered.json()["devotee"]["id"]
    login["password"] = "incorrect-password"
    assert client.post("/api/v1/public/auth/login", json=login).status_code == 401
