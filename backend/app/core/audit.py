import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog, User


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