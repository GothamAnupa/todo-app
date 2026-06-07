"""Pydantic schemas for Task API request and response bodies."""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from ..models.task import TaskPriority, TaskStatus

# Align validation with the SQLAlchemy Task.title column (String(255))
TITLE_MIN_LENGTH = 1
TITLE_MAX_LENGTH = 255


class TaskCreate(BaseModel):
    """Payload for creating a new task (client → API)."""

    title: str = Field(
        ...,
        min_length=TITLE_MIN_LENGTH,
        max_length=TITLE_MAX_LENGTH,
        description="Short summary of the task",
        examples=["Buy groceries"],
    )
    description: str | None = Field(
        default=None,
        description="Optional longer details",
        examples=["Milk, eggs, bread"],
    )
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM,
        description="Task urgency",
    )
    deadline: datetime | None = Field(
        default=None,
        description="Optional due date (ISO 8601)",
        examples=["2026-06-01T17:00:00Z"],
    )
    reminder_time: datetime | None = Field(
        default=None,
        description="Optional reminder date and time before the deadline",
        examples=["2026-06-01T16:00:00Z"],
    )

    @field_validator("reminder_time")
    def reminder_time_must_be_future(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return value
        now = datetime.now(timezone.utc)
        if value < now:
            raise ValueError("reminder_time cannot be in the past")
        return value

    @model_validator(mode="after")
    def validate_reminder_before_deadline(self):
        if self.reminder_time is not None and self.deadline is not None:
            if self.reminder_time >= self.deadline:
                raise ValueError("reminder_time must be before deadline")
        return self


class TaskUpdate(BaseModel):
    """Payload for partial task updates; only sent fields are applied."""

    title: str | None = Field(
        default=None,
        min_length=TITLE_MIN_LENGTH,
        max_length=TITLE_MAX_LENGTH,
    )
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    deadline: datetime | None = None
    reminder_time: datetime | None = None

    @field_validator("reminder_time")
    def reminder_time_must_be_future(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return value
        now = datetime.now(timezone.utc)
        if value < now:
            raise ValueError("reminder_time cannot be in the past")
        return value

    @model_validator(mode="after")
    def validate_reminder_update_against_deadline(self):
        if self.reminder_time is not None and self.deadline is not None:
            if self.reminder_time >= self.deadline:
                raise ValueError("reminder_time must be before deadline")
        return self


class TaskResponse(BaseModel):
    """Full task representation returned by the API (API → client)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    deadline: datetime | None
    reminder_time: datetime | None
    is_reminded: bool
    created_at: datetime
    updated_at: datetime
    user_id: int


class TaskListResponse(BaseModel):
    """Paginated or filtered list of tasks."""

    tasks: list[TaskResponse]
    total: int = Field(..., ge=0, description="Total tasks matching the query")
