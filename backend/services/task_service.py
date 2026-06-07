"""Task business logic — orchestrates validation and repository access."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from ..models.task import Task, TaskPriority, TaskStatus
from ..repositories.task_repository import (
    SortOrder,
    TaskListResult,
    TaskRepository,
    TaskSortField,
)
from ..schemas.task import TaskCreate, TaskUpdate
from .exceptions import TaskNotFoundError, TaskValidationError
from .task_validators import (
    normalize_title,
    validate_deadline_not_in_past,
    validate_pagination,
)


class TaskService:
    """
    Application service for task workflows.

    Repositories handle persistence; this class enforces business rules and
    coordinates operations. Routes should delegate here and stay thin.
    """

    def __init__(self, repository: TaskRepository) -> None:
        self._repo = repository

    def create_task(self, payload: TaskCreate, *, user_id: int) -> Task:
        """Create a task after business validation."""
        title = normalize_title(payload.title)
        validate_deadline_not_in_past(payload.deadline)

        if payload.reminder_time is not None:
            self._validate_reminder(payload.reminder_time, payload.deadline)

        return self._repo.create_task(
            title=title,
            user_id=user_id,
            description=payload.description,
            priority=payload.priority,
            deadline=payload.deadline,
            reminder_time=payload.reminder_time,
        )

    def get_task(self, task_id: int, *, user_id: int | None = None) -> Task:
        """Return a single task or raise if missing."""
        task = self._repo.get_task_by_id(task_id, user_id=user_id)
        if task is None:
            raise TaskNotFoundError(task_id)
        return task

    def get_tasks(
        self,
        *,
        status: TaskStatus | None = None,
        priority: TaskPriority | None = None,
        user_id: int | None = None,
        sort_by: TaskSortField = TaskSortField.CREATED_AT,
        order: SortOrder = SortOrder.DESC,
        offset: int = 0,
        limit: int = 50,
    ) -> TaskListResult:
        """List tasks with filter/sort/pagination passthrough to the repository."""
        validate_pagination(offset, limit)

        return self._repo.get_all_tasks(
            status=status,
            priority=priority,
            user_id=user_id,
            sort_by=sort_by,
            order=order,
            offset=offset,
            limit=limit,
        )

    def update_task(
        self,
        task_id: int,
        payload: TaskUpdate,
        *,
        user_id: int | None = None,
    ) -> Task:
        """Apply a partial update with validation and existence checks."""
        current_task = self.get_task(task_id, user_id=user_id)

        updates = self._build_update_payload(payload, current_task=current_task)
        if not updates:
            raise TaskValidationError("at least one field must be provided for update")

        task = self._repo.update_task(task_id, updates)
        if task is None:
            raise TaskNotFoundError(task_id)
        return task

    def complete_task(self, task_id: int, *, user_id: int | None = None) -> Task:
        """Mark a task as completed (dedicated workflow)."""
        self.get_task(task_id, user_id=user_id)

        task = self._repo.update_task(task_id, {"status": TaskStatus.COMPLETED})
        if task is None:
            raise TaskNotFoundError(task_id)
        return task

    def mark_task_reminded(self, task_id: int, *, user_id: int | None = None) -> Task:
        """Flag a task as reminded so the same reminder doesn't fire again."""
        self.get_task(task_id, user_id=user_id)

        task = self._repo.mark_task_reminded(task_id)
        if task is None:
            raise TaskNotFoundError(task_id)
        return task

    def delete_task(self, task_id: int, *, user_id: int | None = None) -> None:
        """Delete a task after confirming it exists."""
        self.get_task(task_id, user_id=user_id)

        if not self._repo.delete_task(task_id, user_id=user_id):
            raise TaskNotFoundError(task_id)

    @staticmethod
    def _build_update_payload(payload: TaskUpdate, *, current_task: Task | None = None) -> dict[str, Any]:
        """Convert Pydantic patch model to a validated repository update dict."""
        raw = payload.model_dump(exclude_unset=True)
        updates: dict[str, Any] = {}

        if "title" in raw:
            updates["title"] = normalize_title(raw["title"])

        if "description" in raw:
            updates["description"] = raw["description"]

        if "status" in raw:
            updates["status"] = raw["status"]

        if "priority" in raw:
            updates["priority"] = raw["priority"]

        if "deadline" in raw:
            validate_deadline_not_in_past(raw["deadline"])
            if (
                current_task is not None
                and current_task.reminder_time is not None
                and raw["deadline"] is not None
                and current_task.reminder_time >= raw["deadline"]
            ):
                raise TaskValidationError("existing reminder_time must be before updated deadline")
            updates["deadline"] = raw["deadline"]

        if "reminder_time" in raw:
            reminder_time = raw["reminder_time"]
            if reminder_time is not None:
                target_deadline = raw.get("deadline") if raw.get("deadline") is not None else (
                    current_task.deadline if current_task is not None else None
                )
                self._validate_reminder(reminder_time, target_deadline)
            updates["reminder_time"] = reminder_time

        return updates

    @staticmethod
    def _validate_reminder(reminder_time: datetime, deadline: datetime | None) -> None:
        if reminder_time is None:
            return
        validate_deadline_not_in_past(reminder_time)
        if deadline is not None and reminder_time >= deadline:
            raise TaskValidationError("reminder_time must be before the deadline")
