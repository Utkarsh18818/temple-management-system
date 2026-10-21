from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import Role, User


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
)


optional_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise credentials_exception

    role = db.get(Role, user.role_id)
    user.role_name = role.name if role else None
    db.info["audit_actor"] = user
    return user


def get_optional_current_user(
    token: str | None = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Return the authenticated user when a valid bearer token
    is supplied.

    Return None for guests.

    Invalid tokens are rejected rather than silently treated
    as guest requests.
    """

    if not token:
        return None

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise credentials_exception

    return user


def require_roles(*allowed_roles: str) -> Callable:
    def role_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        role = db.get(
            Role,
            current_user.role_id,
        )

        if not role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User role is not configured",
            )

        if role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        if role.name != "SUPER_ADMIN" and current_user.temple_id is None:
            raise HTTPException(status_code=403, detail="A temple assignment is required")

        return current_user

    return role_checker


def require_super_admin(
    current_user: User = Depends(
        require_roles("SUPER_ADMIN")
    ),
) -> User:
    return current_user


def require_temple_admin(
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "TEMPLE_ADMIN",
        )
    ),
) -> User:
    return current_user


def require_staff(
    current_user: User = Depends(
        require_roles(
            "SUPER_ADMIN",
            "TEMPLE_ADMIN",
            "STAFF",
        )
    ),
) -> User:
    return current_user
