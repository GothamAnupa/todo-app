"""Reminder orchestration for scheduled task notifications."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Protocol

from ..repositories.task_repository import TaskRepository
from ..models.task import Task

logger = logging.getLogger(__name__)


class ReminderChannel(Protocol):
    """Abstract channel for reminder delivery (email/SMS adapters may implement later)."""

    def notify(self, task: Task) -> None:
        ...


class LoggingReminderChannel:
    """Simple reminder channel that writes reminders to structured logs."""

    def notify(self, task: Task) -> None:
        logger.info(
            "Reminder channel triggered for task=%s user_id=%s deadline=%s reminder_time=%s",
            task.id,
            task.user_id,
            task.deadline,
            task.reminder_time,
        )


class ReminderService:
    """Service layer that processes due reminder tasks."""

    def __init__(self, repository: TaskRepository, channel: ReminderChannel | None = None) -> None:
        self._repo = repository
        self._channel = channel or LoggingReminderChannel()

    def process_due_reminders(self) -> list[Task]:
        """Scan for reminders that are due now and flag them as processed."""
        now = datetime.now(timezone.utc)
        tasks = self._repo.get_tasks_requiring_reminders(current_time=now)

        if not tasks:
            logger.debug("No reminders due at %s", now.isoformat())
            return []

        processed: list[Task] = []
        for task in tasks:
            try:
                logger.info(
                    "Processing reminder for task=%s user_id=%s reminder_time=%s",
                    task.id,
                    task.user_id,
                    task.reminder_time,
                )
                self._channel.notify(task)
                processed_task = self._repo.mark_task_reminded(task.id)
                if processed_task is not None:
                    processed.append(processed_task)
            except Exception as exc:
                logger.exception("Failed to process reminder for task=%s: %s", task.id, exc)

        return processed
