import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit import create_audit_log
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.numbering import acquire_numbering_lock
from app.models import Donation, Devotee, Temple, User
from app.schemas.donation import (
    DonationCreate,
    DonationResponse,
    DonationUpdate,
)


router = APIRouter(
    prefix="/donations",
    tags=["Donations"],
)


def get_accessible_temple_id(
    current_user: User,
    requested_temple_id: uuid.UUID | None = None,
) -> uuid.UUID:
    """
    Resolve the temple accessible to the current user.

    SUPER_ADMIN:
        Can access any temple when temple_id is provided.

    Temple-level users:
        Can only access their own temple.
    """

    if current_user.temple_id is not None:
        if (
            requested_temple_id is not None
            and requested_temple_id != current_user.temple_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You can only access donations "
                    "from your own temple"
                ),
            )

        return current_user.temple_id

    if requested_temple_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "temple_id is required for SUPER_ADMIN"
            ),
        )

    return requested_temple_id


def verify_temple(
    temple_id: uuid.UUID,
    db: Session,
) -> Temple:
    temple = db.get(
        Temple,
        temple_id,
    )

    if not temple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temple not found",
        )

    if not temple.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Temple is inactive",
        )

    return temple


def verify_donation_access(
    donation: Donation,
    current_user: User,
) -> None:
    if (
        current_user.temple_id is not None
        and donation.temple_id != current_user.temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You cannot access donations "
                "from another temple"
            ),
        )


def get_donation_or_404(
    donation_id: uuid.UUID,
    db: Session,
) -> Donation:
    donation = db.get(
        Donation,
        donation_id,
    )

    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found",
        )

    return donation


def generate_donation_number(
    donated_at: datetime,
    db: Session,
) -> str:
    """
    Generate a human-readable donation number.

    A PostgreSQL transaction-level advisory lock is acquired
    for the date-specific numbering scope before calculating
    the next sequence number.

    Example:
        DN-20260910-00001
    """

    date_prefix = donated_at.strftime(
        "%Y%m%d"
    )

    prefix = f"DN-{date_prefix}-"

    # Serialize donation number generation for this date.
    #
    # The lock is transaction-scoped and is automatically
    # released when the current transaction commits or rolls
    # back.
    acquire_numbering_lock(
        db,
        f"donation:{date_prefix}",
    )

    count = db.scalar(
        select(
            func.count(Donation.id)
        ).where(
            Donation.donation_number.like(
                f"{prefix}%"
            )
        )
    )

    sequence = (count or 0) + 1

    return f"{prefix}{sequence:05d}"


def make_json_safe(
    values: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert values to types supported by PostgreSQL JSON.
    """

    safe_values: dict[str, Any] = {}

    for key, value in values.items():
        if isinstance(value, uuid.UUID):
            safe_values[key] = str(value)

        elif isinstance(value, Decimal):
            safe_values[key] = str(value)

        elif isinstance(value, datetime):
            safe_values[key] = value.isoformat()

        else:
            safe_values[key] = value

    return safe_values


def donation_snapshot(
    donation: Donation,
) -> dict[str, Any]:
    """
    Create an audit-friendly snapshot of a donation.
    """

    return make_json_safe(
        {
            "temple_id": donation.temple_id,
            "devotee_id": donation.devotee_id,
            "donation_number": donation.donation_number,
            "amount": donation.amount,
            "donation_type": donation.donation_type,
            "purpose": donation.purpose,
            "donor_name": donation.donor_name,
            "donor_phone": donation.donor_phone,
            "donor_email": donation.donor_email,
            "pan_number": donation.pan_number,
            "status": donation.status,
            "donated_at": donation.donated_at,
            "notes": donation.notes,
        }
    )


@router.post(
    "",
    response_model=DonationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_donation(
    request: DonationCreate,
    temple_id: uuid.UUID = Query(...),
    http_request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a donation.

    Validates:

    - Temple exists and is active
    - Devotee exists when devotee_id is provided
    - Devotee belongs to the selected temple
    - Donation amount is positive

    Donation status starts as PENDING.
    """

    target_temple_id = get_accessible_temple_id(
        current_user,
        temple_id,
    )

    verify_temple(
        target_temple_id,
        db,
    )

    devotee = None

    if request.devotee_id is not None:
        devotee = db.get(
            Devotee,
            request.devotee_id,
        )

        if not devotee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Devotee not found",
            )

        if not devotee.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Devotee is inactive",
            )

        if devotee.temple_id != target_temple_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Devotee does not belong "
                    "to this temple"
                ),
            )

    donated_at = (
        request.donated_at
        or datetime.now(timezone.utc)
    )

    donation_number = generate_donation_number(
        donated_at,
        db,
    )

    donation = Donation(
        temple_id=target_temple_id,
        devotee_id=(
            devotee.id
            if devotee
            else None
        ),
        donation_number=donation_number,
        amount=request.amount,
        donation_type=request.donation_type,
        purpose=request.purpose,
        donor_name=request.donor_name,
        donor_phone=request.donor_phone,
        donor_email=request.donor_email,
        pan_number=request.pan_number,
        status="PENDING",
        donated_at=donated_at,
        notes=request.notes,
    )

    try:
        db.add(donation)
        db.flush()

        create_audit_log(
            db,
            current_user=current_user,
            action="DONATION_CREATED",
            entity_type="Donation",
            entity_id=donation.id,
            old_values=None,
            new_values=donation_snapshot(donation),
            ip_address=(
                http_request.client.host
                if http_request is not None
                and http_request.client is not None
                else None
            ),
            user_agent=(
                http_request.headers.get("user-agent")
                if http_request is not None
                else None
            ),
            temple_id=target_temple_id,
        )

        db.commit()
        db.refresh(donation)

    except Exception:
        db.rollback()
        raise

    return donation


@router.get(
    "",
    response_model=list[DonationResponse],
)
def list_donations(
    temple_id: uuid.UUID | None = Query(
        default=None
    ),
    donation_type: str | None = Query(
        default=None,
        max_length=50,
    ),
    donation_status: str | None = Query(
        default=None,
        alias="status",
        max_length=30,
    ),
    devotee_id: uuid.UUID | None = Query(
        default=None
    ),
    donor_name: str | None = Query(
        default=None,
        min_length=1,
        max_length=150,
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
    current_user: User = Depends(get_current_user),
):
    target_temple_id = get_accessible_temple_id(
        current_user,
        temple_id,
    )

    verify_temple(
        target_temple_id,
        db,
    )

    query = select(Donation).where(
        Donation.temple_id == target_temple_id
    )

    if donation_type:
        query = query.where(
            Donation.donation_type == donation_type
        )

    if donation_status:
        query = query.where(
            Donation.status == donation_status
        )

    if devotee_id:
        query = query.where(
            Donation.devotee_id == devotee_id
        )

    if donor_name:
        query = query.where(
            Donation.donor_name.ilike(
                f"%{donor_name}%"
            )
        )

    query = (
        query
        .order_by(
            Donation.donated_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    return db.scalars(query).all()


@router.get(
    "/{donation_id}",
    response_model=DonationResponse,
)
def get_donation(
    donation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    donation = get_donation_or_404(
        donation_id,
        db,
    )

    verify_donation_access(
        donation,
        current_user,
    )

    return donation


@router.put(
    "/{donation_id}",
    response_model=DonationResponse,
)
def update_donation(
    donation_id: uuid.UUID,
    request: DonationUpdate,
    http_request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    donation = get_donation_or_404(
        donation_id,
        db,
    )

    verify_donation_access(
        donation,
        current_user,
    )

    old_values = donation_snapshot(
        donation
    )

    update_data = request.model_dump(
        exclude_unset=True
    )

    allowed_statuses = {
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
    }

    if "status" in update_data:
        if (
            update_data["status"]
            not in allowed_statuses
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid donation status. "
                    "Allowed values: "
                    "PENDING, CONFIRMED, "
                    "CANCELLED, COMPLETED"
                ),
            )

    for field, value in update_data.items():
        setattr(
            donation,
            field,
            value,
        )

    new_values = donation_snapshot(
        donation
    )

    audit_action = (
        "DONATION_STATUS_CHANGED"
        if "status" in update_data
        else "DONATION_UPDATED"
    )

    try:
        create_audit_log(
            db,
            current_user=current_user,
            action=audit_action,
            entity_type="Donation",
            entity_id=donation.id,
            old_values=old_values,
            new_values=new_values,
            ip_address=(
                http_request.client.host
                if http_request is not None
                and http_request.client is not None
                else None
            ),
            user_agent=(
                http_request.headers.get("user-agent")
                if http_request is not None
                else None
            ),
            temple_id=donation.temple_id,
        )

        db.commit()
        db.refresh(donation)

    except Exception:
        db.rollback()
        raise

    return donation


@router.patch(
    "/{donation_id}/status",
    response_model=DonationResponse,
)
def update_donation_status(
    donation_id: uuid.UUID,
    donation_status: str = Query(
        ...,
        alias="status",
        max_length=30,
    ),
    http_request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    donation = get_donation_or_404(
        donation_id,
        db,
    )

    verify_donation_access(
        donation,
        current_user,
    )

    allowed_statuses = {
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
    }

    if donation_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid donation status. "
                "Allowed values: "
                "PENDING, CONFIRMED, "
                "CANCELLED, COMPLETED"
            ),
        )

    old_values = donation_snapshot(
        donation
    )

    donation.status = donation_status

    new_values = donation_snapshot(
        donation
    )

    try:
        create_audit_log(
            db,
            current_user=current_user,
            action="DONATION_STATUS_CHANGED",
            entity_type="Donation",
            entity_id=donation.id,
            old_values=old_values,
            new_values=new_values,
            ip_address=(
                http_request.client.host
                if http_request is not None
                and http_request.client is not None
                else None
            ),
            user_agent=(
                http_request.headers.get("user-agent")
                if http_request is not None
                else None
            ),
            temple_id=donation.temple_id,
        )

        db.commit()
        db.refresh(donation)

    except Exception:
        db.rollback()
        raise

    return donation