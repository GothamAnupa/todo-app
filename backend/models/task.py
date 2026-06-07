"""Task ORM model and supporting enums."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .user import User


class TaskStatus(str, Enum):
    """Workflow status for a task."""

    PENDING = "pending"
    COMPLETED = "completed"


class TaskPriority(str, Enum):
    """Priority level for planning and sorting."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Task(Base):
    """Primary task entity."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(
            TaskStatus,
            name="task_status",
            native_enum=False,  # Keeps SQLite compatible and PostgreSQL-ready.
            validate_strings=True,
        ),
        nullable=False,
        default=TaskStatus.PENDING,
        server_default=TaskStatus.PENDING.value,
    )

    priority: Mapped[TaskPriority] = mapped_column(
        SQLEnum(
            TaskPriority,
            name="task_priority",
            native_enum=False,
            validate_strings=True,
        ),
        nullable=False,
        default=TaskPriority.MEDIUM,
        server_default=TaskPriority.MEDIUM.value,
    )

    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reminder_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    is_reminded: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=func.false(),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user: Mapped[User] = relationship("User", back_populates="tasks")

    __table_args__ = (
        Index("ix_tasks_status_priority", "status", "priority"),
        Index("ix_tasks_deadline", "deadline"),
    )

    def __repr__(self) -> str:
        return (
            f"Task(id={self.id!r}, title={self.title!r}, status={self.status.value!r}, "
            f"priority={self.priority.value!r}, user_id={self.user_id!r})"
        )
