import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID
    temple_id: uuid.UUID | None
    user_id: uuid.UUID | None
    action: str
    entity_type: str
    entity_id: uuid.UUID | None
    old_values: dict[str, Any] | None
    new_values: dict[str, Any] | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime


class AuditLogFilter(BaseModel):
    action: str | None = Field(
        default=None,
        max_length=50,
    )

    entity_type: str | None = Field(
        default=None,
        max_length=100,
    )

    entity_id: uuid.UUID | None = None

    user_id: uuid.UUID | None = None