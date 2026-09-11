from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.rate_limit import (
    clear_failed_logins,
    is_login_blocked,
    record_failed_login,
)
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models import Role, Temple, User
from app.schemas.auth import (
    RegisterRequest,
    TokenResponse,
    UserResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def _login_rate_limit_key(
    request: Request,
    username: str,
) -> str:
    client_ip = (
        request.client.host
        if request.client
        else "unknown"
    )

    normalized_username = username.strip().lower()

    return f"{client_ip}|{normalized_username}"


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    # ---------------------------------------------------------
    # Validate email / phone
    # ---------------------------------------------------------
    if not request.email and not request.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone is required",
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

    existing_user = db.scalar(
        select(User).where(
            or_(*duplicate_conditions)
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email or phone already exists",
        )

    # ---------------------------------------------------------
    # Validate temple if supplied
    # ---------------------------------------------------------
    if request.temple_id:
        temple = db.get(
            Temple,
            request.temple_id,
        )

        if not temple:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Temple not found",
            )

        if not temple.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Temple is currently inactive",
            )

    # ---------------------------------------------------------
    # Public registrations cannot select privileged roles.
    #
    # Until the dedicated Devotee account model is introduced,
    # VOLUNTEER is used as the lowest operational role.
    # ---------------------------------------------------------
    default_role = db.scalar(
        select(Role).where(
            Role.name == "VOLUNTEER"
        )
    )

    if not default_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Default registration role is not configured",
        )

    # ---------------------------------------------------------
    # Create user
    # ---------------------------------------------------------
    user = User(
        temple_id=request.temple_id,
        role_id=default_role.id,
        email=request.email,
        phone=request.phone,
        password_hash=hash_password(
            request.password
        ),
        first_name=request.first_name,
        last_name=request.last_name,
        is_active=True,
        is_verified=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # ---------------------------------------------------------
    # Login rate limiting
    #
    # Five failed attempts within the configured window for
    # the same IP + username combination temporarily block
    # further attempts.
    # ---------------------------------------------------------
    rate_limit_key = _login_rate_limit_key(
        request,
        form_data.username,
    )

    if is_login_blocked(rate_limit_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Too many failed login attempts. "
                "Please try again later."
            ),
            headers={
                "Retry-After": "900",
            },
        )

    # ---------------------------------------------------------
    # Find user by email or phone
    # ---------------------------------------------------------
    user = db.scalar(
        select(User).where(
            or_(
                User.email == form_data.username,
                User.phone == form_data.username,
            )
        )
    )

    # ---------------------------------------------------------
    # Validate credentials
    #
    # Do not reveal whether the username exists.
    # ---------------------------------------------------------
    if not user or not verify_password(
        form_data.password,
        user.password_hash,
    ):
        record_failed_login(rate_limit_key)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # ---------------------------------------------------------
    # Successful authentication clears previous failures.
    # ---------------------------------------------------------
    clear_failed_logins(rate_limit_key)

    # ---------------------------------------------------------
    # Validate account status
    # ---------------------------------------------------------
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # ---------------------------------------------------------
    # Get user role
    # ---------------------------------------------------------
    role = db.get(
        Role,
        user.role_id,
    )

    if not role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User role configuration is invalid",
        )

    # ---------------------------------------------------------
    # Create JWT
    # ---------------------------------------------------------
    token = create_access_token(
        subject=str(user.id),
        role=role.name,
        temple_id=(
            str(user.temple_id)
            if user.temple_id
            else None
        ),
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user
