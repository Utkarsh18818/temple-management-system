import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_staff
from app.models import AuditLog, User
from app.schemas.audit import AuditLogResponse


router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"],
)


@router.get(
    "",
    response_model=list[AuditLogResponse],
)
def list_audit_logs(
    temple_id: uuid.UUID | None = Query(
        default=None
    ),
    action: str | None = Query(
        default=None,
        max_length=50,
    ),
    entity_type: str | None = Query(
        default=None,
        max_length=100,
    ),
    entity_id: uuid.UUID | None = Query(
        default=None
    ),
    user_id: uuid.UUID | None = Query(
        default=None
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """
    List audit logs.

    Temple users can only see audit logs for their
    own temple.

    SUPER_ADMIN must provide temple_id.
    """

    query = select(AuditLog)

    if current_user.temple_id is not None:
        if (
            temple_id is not None
            and temple_id
            != current_user.temple_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can only access audit logs "
                    "from your own temple"
                ),
            )

        query = query.where(
            AuditLog.temple_id
            == current_user.temple_id
        )

    elif temple_id is not None:
        query = query.where(
            AuditLog.temple_id
            == temple_id
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "temple_id is required for SUPER_ADMIN"
            ),
        )

    if action:
        query = query.where(
            AuditLog.action == action
        )

    if entity_type:
        query = query.where(
            AuditLog.entity_type
            == entity_type
        )

    if entity_id:
        query = query.where(
            AuditLog.entity_id
            == entity_id
        )

    if user_id:
        query = query.where(
            AuditLog.user_id
            == user_id
        )

    query = (
        query
        .order_by(
            AuditLog.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


@router.get(
    "/{audit_id}",
    response_model=AuditLogResponse,
)
def get_audit_log(
    audit_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """
    Get a single audit log.
    """

    audit_log = db.get(
        AuditLog,
        audit_id,
    )

    if not audit_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found",
        )

    if current_user.temple_id is not None:
        if (
            audit_log.temple_id
            != current_user.temple_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You cannot access audit logs "
                    "from another temple"
                ),
            )

    return audit_log
