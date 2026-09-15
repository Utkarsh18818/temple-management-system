from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_temple_admin
from app.models import Role, User
from app.schemas.role import RoleResponse


router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
)


@router.get(
    "",
    response_model=list[RoleResponse],
)
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_temple_admin
    ),
):
    """
    Return roles available to the admin workspace.

    SUPER_ADMIN can view all configured roles.
    TEMPLE_ADMIN can view the configured roles used
    for temple-level operational users.
    """

    return db.scalars(
        select(Role).order_by(Role.name)
    ).all()
