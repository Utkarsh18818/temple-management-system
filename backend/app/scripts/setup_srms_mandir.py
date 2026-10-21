"""Idempotent initial SRMS configuration, authorized by the project owner.

These are editable starter offerings, not verified institutional prices/timings.
Existing temple records and staff assignments are preserved.
"""
from datetime import datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.audit import create_audit_log
from app.models import Event, Seva, SevaSlot, Temple, User, Role


def setup():
    with SessionLocal() as db:
        actor = db.scalar(select(User).join(Role, User.role_id == Role.id).where(Role.name == "SUPER_ADMIN", User.is_active.is_(True)))
        if actor is None:
            raise RuntimeError("An active super administrator is required")
        db.info["audit_actor"] = actor
        temple = db.scalar(select(Temple).where(Temple.code == "SRMS-RADHA-KRISHNA"))
        if temple is None:
            temple = Temple(name="Shri Radha Krishna Mandir · SRMS CET", code="SRMS-RADHA-KRISHNA",
                description="Radha Krishna Mandir at Shri Ram Murti Smarak College of Engineering & Technology, Bareilly. Initial worship schedule: morning 6:00 AM–12:00 PM; evening 4:00 PM–8:00 PM. Seva prices and slots are provisional and may be updated by temple administration.",
                address="Ram Murti Puram, 13 KM Bareilly–Nainital Road, Bhojipura", city="Bareilly", state="Uttar Pradesh",
                country="India", pincode="243202", website="https://www.srms.ac.in/cet/", timezone="Asia/Kolkata", is_active=True)
            db.add(temple); db.flush()
        today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
        offerings = [
            ("DAILY-ARCHANA", "Radha Krishna Archana", "101.00", time(8), time(8,30), 20),
            ("SANDHYA-AARTI", "Sandhya Aarti Offering", "51.00", time(18), time(18,30), 30),
            ("SPECIAL-PUJA", "Special Radha Krishna Puja", "501.00", time(9), time(9,30), 5),
        ]
        for code, name, amount, start, end, capacity in offerings:
            seva = db.scalar(select(Seva).where(Seva.temple_id == temple.id, Seva.code == code))
            if seva is None:
                seva = Seva(temple_id=temple.id, name=name, code=code, amount=Decimal(amount), seva_type="PUJA",
                    description="Initial offering and schedule. Please confirm arrangements with the mandir office; prices and timings may change.",
                    duration_minutes=30, max_bookings=capacity, requires_slot=True, is_online=True, is_active=True)
                db.add(seva); db.flush()
            for offset in range(1, 31):
                slot_date = today + timedelta(days=offset)
                exists = db.scalar(select(SevaSlot.id).where(SevaSlot.seva_id == seva.id, SevaSlot.slot_date == slot_date, SevaSlot.start_time == start))
                if exists is None:
                    db.add(SevaSlot(seva_id=seva.id, slot_date=slot_date, start_time=start, end_time=end, capacity=capacity, booked_count=0, status="AVAILABLE"))
        event = db.scalar(select(Event).where(Event.temple_id == temple.id, Event.code == "SRMS-COMMUNITY-AARTI"))
        if event is None:
            db.add(Event(temple_id=temple.id, name="Community Sandhya Aarti", code="SRMS-COMMUNITY-AARTI",
                description="Join the campus community for evening prayer. Initial schedule; please confirm campus access with the mandir office.",
                event_date=today+timedelta(days=1), start_time=time(18), end_time=time(18,30),
                location="Radha Krishna Mandir, SRMS CET campus", organizer="Mandir administration", max_capacity=100, is_online=False, is_active=True))
        create_audit_log(db, current_user=actor, temple_id=temple.id, action="MANDIR_SETUP", entity_type="Temple", entity_id=temple.id,
                         new_values={"provisional": True, "slot_days": 30, "staffing": "Existing super administrators retain management access; no staff accounts invented"})
        db.commit()
        print(f"SRMS mandir ready: {temple.id}; 3 provisional sevas, 30 days of slots, 1 community event")


if __name__ == "__main__":
    setup()
