import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog, User
from sqlalchemy import event, inspect


def create_audit_log(
    db: Session,
    *,
    current_user: User | None,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID | None = None,
    old_values: dict[str, Any] | None = None,
    new_values: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    temple_id: uuid.UUID | None = None,
) -> AuditLog:
    """
    Create an audit log entry.

    The audit record is added to the current database
    transaction. The caller is responsible for commit/rollback.
    """

    resolved_temple_id = temple_id

    if (
        resolved_temple_id is None
        and current_user is not None
    ):
        resolved_temple_id = current_user.temple_id

    user_id = (
        current_user.id
        if current_user is not None
        else None
    )

    audit_log = AuditLog(
        temple_id=resolved_temple_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.add(audit_log)

    return audit_log


# Keep operational history in the same transaction as ORM mutations. Deliberately
# exclude contact details, credentials, free-form notes and financial snapshots
# (finance endpoints already provide their own detailed audit records).
AUDITED_FIELDS = {"name", "code", "title", "is_active", "is_online", "role_id", "temple_id",
                  "status", "payment_status", "amount", "quantity", "booking_date", "slot_date",
                  "start_time", "end_time", "capacity", "booked_count", "seva_id", "slot_id"}
AUDITED_TYPES = {"Temple", "User", "Devotee", "Seva", "SevaSlot", "SevaBooking", "Event", "Festival"}


def json_value(value):
    if isinstance(value, (uuid.UUID, Decimal)):
        return str(value)
    if isinstance(value, (date, datetime)) or hasattr(value, "isoformat"):
        return value.isoformat()
    return value


@event.listens_for(Session, "before_flush")
def audit_operational_changes(db, flush_context, instances):
    actor = db.info.get("audit_actor")
    if actor is None:
        return
    for record in list(db.new) + list(db.dirty) + list(db.deleted):
        entity_type = type(record).__name__
        if entity_type not in AUDITED_TYPES:
            continue
        state = inspect(record)
        new = record in db.new
        deleted = record in db.deleted
        if not new and not deleted and not db.is_modified(record, include_collections=False):
            continue
        fields = set(state.mapper.columns.keys()) & AUDITED_FIELDS
        changed = fields if new or deleted else {key for key in fields if state.attrs[key].history.has_changes()}
        if not changed and not deleted:
            continue
        if new and record.id is None:
            record.id = uuid.uuid4()
        before, after = {}, {}
        for key in changed:
            history = state.attrs[key].history
            before[key] = json_value(history.deleted[0] if history.deleted else getattr(record, key))
            after[key] = json_value(getattr(record, key))
        db.info.setdefault("pending_operational_audit", []).append(dict(
            current_user=actor, action=f"{entity_type.upper()}_{'DELETED' if deleted else 'CREATED' if new else 'UPDATED'}",
            entity_type=entity_type, entity_id=record.id,
            temple_id=record.id if entity_type == "Temple" else getattr(record, "temple_id", None),
            old_values=None if new else before, new_values=None if deleted else after))


@event.listens_for(Session, "after_flush_postexec")
def persist_operational_audit(db, flush_context):
    # Referenced users and temples must be inserted before their audit rows.
    # Adding here triggers a second flush within the same commit/transaction.
    for values in db.info.pop("pending_operational_audit", []):
        create_audit_log(db, **values)


@event.listens_for(Session, "after_rollback")
def clear_pending_audit(db):
    db.info.pop("pending_operational_audit", None)
