"""Task data-access repository (SQLAlchemy 2.0, sync session, async-ready layout)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import Select, and_, func, select
from sqlalchemy.orm import Session

from ..models.task import Task, TaskPriority, TaskStatus

# Columns allowed in update_task to avoid accidental mass-assignment
_UPDATABLE_FIELDS = frozenset(
    {"title", "description", "status", "priority", "deadline", "reminder_time", "user_id"}
)


class TaskSortField(str, Enum):
    """Columns supported for list sorting."""

    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    DEADLINE = "deadline"
    TITLE = "title"
    PRIORITY = "priority"
    STATUS = "status"


class SortOrder(str, Enum):
    """Sort direction."""

    ASC = "asc"
    DESC = "desc"


@dataclass(frozen=True)
class TaskListResult:
    """Pagination-ready list payload (ORM rows + total count)."""

    items: list[Task]
    total: int


_SORT_COLUMN_MAP: dict[TaskSortField, Any] = {
    TaskSortField.CREATED_AT: Task.created_at,
    TaskSortField.UPDATED_AT: Task.updated_at,
    TaskSortField.DEADLINE: Task.deadline,
    TaskSortField.TITLE: Task.title,
    TaskSortField.PRIORITY: Task.priority,
    TaskSortField.STATUS: Task.status,
}


class TaskRepository:
    """
    Encapsulates Task persistence queries.

    Accepts a SQLAlchemy Session via constructor (injected by the service/route
  layer). Methods are synchronous today; the same query composition can be
    reused with AsyncSession when the app moves to async drivers.
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    # -------------------------------------------------------------------------
    # CRUD
    # -------------------------------------------------------------------------

    def create_task(
        self,
        *,
        title: str,
        user_id: int,
        description: str | None = None,
        status: TaskStatus = TaskStatus.PENDING,
        priority: TaskPriority = TaskPriority.MEDIUM,
        deadline: datetime | None = None,
        reminder_time: datetime | None = None,
    ) -> Task:
        """Insert a new task and return the persisted ORM instance."""
        task = Task(
            title=title,
            user_id=user_id,
            description=description,
            status=status,
            priority=priority,
            deadline=deadline,
            reminder_time=reminder_time,
        )
        self._db.add(task)
        return self._commit_and_refresh(task)

    def get_task_by_id(self, task_id: int, *, user_id: int | None = None) -> Task | None:
        """Fetch one task by primary key; optional user_id scopes future multi-tenant queries."""
        conditions = self._filter_conditions(user_id=user_id)
        conditions.append(Task.id == task_id)
        return self._db.scalar(select(Task).where(*conditions))

    def get_all_tasks(
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
        """
        List tasks with optional filters, sorting, and offset/limit pagination.

        Returns ORM models plus total matching row count (for API pagination).
        """
        conditions = self._filter_conditions(
            status=status,
            priority=priority,
            user_id=user_id,
        )

        count_stmt = select(func.count()).select_from(Task)
        if conditions:
            count_stmt = count_stmt.where(*conditions)
        total = self._db.scalar(count_stmt) or 0

        stmt = self._apply_filters(self._base_select(), status=status, priority=priority, user_id=user_id)
        stmt = self._apply_sort(stmt, sort_by=sort_by, order=order)
        stmt = stmt.offset(offset).limit(limit)

        items = list(self._db.scalars(stmt).all())
        return TaskListResult(items=items, total=total)

    def update_task(self, task_id: int, updates: dict[str, Any]) -> Task | None:
        """Apply partial field updates to an existing task."""
        task = self.get_task_by_id(task_id)
        if task is None:
            return None

        for field, value in updates.items():
            if field not in _UPDATABLE_FIELDS:
                continue
            setattr(task, field, value)

        return self._commit_and_refresh(task)

    def mark_task_reminded(self, task_id: int) -> Task | None:
        """Flag a task reminder as processed so it only fires once."""
        task = self.get_task_by_id(task_id)
        if task is None:
            return None

        task.is_reminded = True
        return self._commit_and_refresh(task)

    def get_tasks_requiring_reminders(
        self,
        current_time: datetime,
        *,
        user_id: int | None = None,
    ) -> list[Task]:
        """Return pending tasks whose reminder time has arrived and have not been sent."""
        conditions = [
            Task.status == TaskStatus.PENDING,
            Task.is_reminded == False,  # noqa: E712
            Task.reminder_time.is_not(None),
            Task.reminder_time <= current_time,
        ]
        if user_id is not None:
            conditions.append(Task.user_id == user_id)

        stmt = select(Task).where(and_(*conditions))
        return list(self._db.scalars(stmt).all())

    def delete_task(self, task_id: int, *, user_id: int | None = None) -> bool:
        """Delete a task by id. Returns False when no row matched."""
        task = self.get_task_by_id(task_id, user_id=user_id)
        if task is None:
            return False

        self._db.delete(task)
        self._db.commit()
        return True

    # -------------------------------------------------------------------------
    # Query composition (reusable, async-ready builders)
    # -------------------------------------------------------------------------

    @staticmethod
    def _base_select() -> Select[tuple[Task]]:
        return select(Task)

    @staticmethod
    def _filter_conditions(
        *,
        status: TaskStatus | None = None,
        priority: TaskPriority | None = None,
        user_id: int | None = None,
    ) -> list[Any]:
        """Build reusable WHERE clauses for list and count queries."""
        conditions: list[Any] = []
        if status is not None:
            conditions.append(Task.status == status)
        if priority is not None:
            conditions.append(Task.priority == priority)
        if user_id is not None:
            conditions.append(Task.user_id == user_id)
        return conditions

    @staticmethod
    def _apply_filters(
        stmt: Select[tuple[Task]],
        *,
        status: TaskStatus | None = None,
        priority: TaskPriority | None = None,
        user_id: int | None = None,
    ) -> Select[tuple[Task]]:
        conditions = TaskRepository._filter_conditions(
            status=status,
            priority=priority,
            user_id=user_id,
        )
        if conditions:
            stmt = stmt.where(*conditions)
        return stmt

    @staticmethod
    def _apply_sort(
        stmt: Select[tuple[Task]],
        *,
        sort_by: TaskSortField,
        order: SortOrder,
    ) -> Select[tuple[Task]]:
        column = _SORT_COLUMN_MAP[sort_by]
        return stmt.order_by(column.desc() if order == SortOrder.DESC else column.asc())

    def _commit_and_refresh(self, entity: Task) -> Task:
        """Persist pending changes and reload DB-generated columns (id, timestamps)."""
        self._db.commit()
        self._db.refresh(entity)
        return entity
