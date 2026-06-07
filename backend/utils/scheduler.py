"""Background scheduler integration for reminder scanning."""

from __future__ import annotations

import logging
from datetime import timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from ..database import SessionLocal
from ..repositories.task_repository import TaskRepository
from ..services.reminder_service import ReminderService

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone=timezone.utc)


def _scan_reminders() -> None:
    """Create a short-lived DB session and execute reminder scans."""
    db = SessionLocal()
    try:
        repo = TaskRepository(db)
        service = ReminderService(repo)
        service.process_due_reminders()
    except Exception as exc:
        logger.exception("Reminder scheduler execution failed: %s", exc)
    finally:
        db.close()


def start_scheduler() -> None:
    """Start the APScheduler background job if it is not already running."""
    if scheduler.running:
        logger.debug("Reminder scheduler already running")
        return

    scheduler.add_job(
        _scan_reminders,
        trigger=IntervalTrigger(seconds=60),
        id="task_reminder_scan",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start(paused=False)
    logger.info("Reminder scheduler started")


def shutdown_scheduler() -> None:
    """Shut down the background scheduler cleanly on app stop."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Reminder scheduler stopped")
