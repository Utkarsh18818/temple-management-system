import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    require_super_admin,
    require_temple_admin,
)
from app.core.security import hash_password
from app.models import Role, Temple, User
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserStatusUpdate,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    request: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_temple_admin),
):
    """
    Create a temple-level operational user.

    SUPER_ADMIN:
        Can create users for any active temple.

    TEMPLE_ADMIN:
        Can only create users for their own temple.
    """

    # ---------------------------------------------------------
    # Determine target temple
    # ---------------------------------------------------------
    target_temple_id = request.temple_id

    if current_user.temple_id is not None:
        if current_user.temple_id != target_temple_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage users in your own temple",
            )

    # ---------------------------------------------------------
    # Verify temple
    # ---------------------------------------------------------
    temple = db.get(
        Temple,
        target_temple_id,
    )

    if not temple:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Temple not found",
        )

    if not temple.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create a user for an inactive temple",
        )

    # ---------------------------------------------------------
    # Find requested role
    # ---------------------------------------------------------
    role = db.scalar(
        select(Role).where(
            Role.name == request.role
        )
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role",
        )

    # ---------------------------------------------------------
    # Prevent privilege escalation
    #
    # TEMPLE_ADMIN can create:
    #   STAFF
    #   PANDIT
    #   VOLUNTEER
    #
    # SUPER_ADMIN can additionally create:
    #   TEMPLE_ADMIN
    # ---------------------------------------------------------
    if (
        role.name == "TEMPLE_ADMIN"
        and current_user.temple_id is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPER_ADMIN can create TEMPLE_ADMIN users",
        )

    # ---------------------------------------------------------
    # Check duplicate email / phone
    # ---------------------------------------------------------
    duplicate_conditions = []

    if request.email:
        duplicate_conditions.append(
            User.email == request.email
        )

    if request.phone:
        duplicate_conditions.append(
            User.phone == request.phone
        )

    if duplicate_conditions:
        existing_user = db.scalar(
            select(User).where(
                User.temple_id == request.temple_id,
                or_(*duplicate_conditions)
            )
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email or phone already exists",
            )

    # ---------------------------------------------------------
    # Create user
    # ---------------------------------------------------------
    user = User(
        temple_id=target_temple_id,
        role_id=role.id,
        email=request.email,
        phone=request.phone,
        password_hash=hash_password(
            request.password
        ),
        first_name=request.first_name,
        last_name=request.last_name,
        is_active=True,
        is_verified=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.get(
    "",
    response_model=list[UserResponse],
)
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_temple_admin),
):
    """
    List users.

    SUPER_ADMIN:
        Returns users across all temples.

    TEMPLE_ADMIN:
        Returns users belonging only to their temple.
    """

    query = select(User)

    if current_user.temple_id is not None:
        query = query.where(
            User.temple_id == current_user.temple_id
        )

    query = query.order_by(
        User.created_at.desc()
    )

    return db.scalars(query).all()


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_temple_admin),
):
    """
    Get a single user.

    TEMPLE_ADMIN can only access users from their temple.
    SUPER_ADMIN can access any user.
    """

    user = db.get(
        User,
        user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if (
        current_user.temple_id is not None
        and user.temple_id != current_user.temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access users from another temple",
        )

    return user


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
)
def update_user_status(
    user_id: uuid.UUID,
    request: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_temple_admin),
):
    """
    Activate or deactivate a user.

    Users can only be managed within the current admin's
    authorized temple scope.
    """

    user = db.get(
        User,
        user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # ---------------------------------------------------------
    # Tenant isolation
    # ---------------------------------------------------------
    if (
        current_user.temple_id is not None
        and user.temple_id != current_user.temple_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot manage users from another temple",
        )

    # ---------------------------------------------------------
    # Prevent self-deactivation
    # ---------------------------------------------------------
    if (
        user.id == current_user.id
        and not request.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    user.is_active = request.is_active

    db.commit()
    db.refresh(user)

    return user
