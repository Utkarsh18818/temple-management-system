import uuid
from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field, model_validator


class EventCreate(BaseModel):
    festival_id: uuid.UUID | None = None

    name: str = Field(
        min_length=2,
        max_length=150,
    )

    code: str = Field(
        min_length=2,
        max_length=50,
    )

    description: str | None = None

    event_date: date

    start_time: time

    end_time: time | None = None

    location: str | None = Field(
        default=None,
        max_length=200,
    )

    organizer: str | None = Field(
        default=None,
        max_length=150,
    )

    max_capacity: int | None = Field(
        default=None,
        gt=0,
    )

    is_online: bool = False

    is_active: bool = True

    @model_validator(mode="after")
    def validate_time(self):
        if (
            self.end_time is not None
            and self.end_time <= self.start_time
        ):
            raise ValueError(
                "end_time must be later than start_time"
            )

        return self


class EventUpdate(BaseModel):
    festival_id: uuid.UUID | None = None

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    code: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    description: str | None = None

    event_date: date | None = None

    start_time: time | None = None

    end_time: time | None = None

    location: str | None = Field(
        default=None,
        max_length=200,
    )

    organizer: str | None = Field(
        default=None,
        max_length=150,
    )

    max_capacity: int | None = Field(
        default=None,
        gt=0,
    )

    is_online: bool | None = None

    is_active: bool | None = None


class EventStatusUpdate(BaseModel):
    is_active: bool


class EventResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID

    temple_id: uuid.UUID

    festival_id: uuid.UUID | None

    name: str

    code: str

    description: str | None

    event_date: date

    start_time: time

    end_time: time | None

    location: str | None

    organizer: str | None

    max_capacity: int | None

    is_online: bool

    is_active: bool

    created_at: object
    updated_at: object