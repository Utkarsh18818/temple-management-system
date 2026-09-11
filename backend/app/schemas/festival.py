import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator


class FestivalCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    code: str = Field(
        min_length=2,
        max_length=50,
    )

    description: str | None = None

    start_date: date

    end_date: date

    location: str | None = Field(
        default=None,
        max_length=200,
    )

    deity: str | None = Field(
        default=None,
        max_length=150,
    )

    is_active: bool = True

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError(
                "end_date cannot be earlier than start_date"
            )

        return self


class FestivalUpdate(BaseModel):
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

    start_date: date | None = None

    end_date: date | None = None

    location: str | None = Field(
        default=None,
        max_length=200,
    )

    deity: str | None = Field(
        default=None,
        max_length=150,
    )

    is_active: bool | None = None


class FestivalStatusUpdate(BaseModel):
    is_active: bool


class FestivalResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: uuid.UUID

    temple_id: uuid.UUID

    name: str

    code: str

    description: str | None

    start_date: date

    end_date: date

    location: str | None

    deity: str | None

    is_active: bool

    created_at: object
    updated_at: object