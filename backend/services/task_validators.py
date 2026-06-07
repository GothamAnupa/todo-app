"""Centralized business validation helpers for task operations."""

from __future__ import annotations

from datetime import datetime, timezone

from .exceptions import TaskValidationError

MAX_PAGE_LIMIT = 100


def normalize_title(title: str) -> str:
    """Strip whitespace and reject blank titles."""
    normalized = title.strip()
    if not normalized:
        raise TaskValidationError("title cannot be blank", field="title")
    return normalized


def validate_deadline_not_in_past(deadline: datetime | None) -> None:
    """Ensure optional deadlines are not set in the past."""
    if deadline is None:
        return

    now = datetime.now(timezone.utc)
    candidate = deadline if deadline.tzinfo is not None else deadline.replace(tzinfo=timezone.utc)

    if candidate < now:
        raise TaskValidationError("deadline cannot be in the past", field="deadline")


def validate_pagination(offset: int, limit: int) -> None:
    """Guard pagination parameters before hitting the repository."""
    if offset < 0:
        raise TaskValidationError("offset must be >= 0", field="offset")
    if limit < 1 or limit > MAX_PAGE_LIMIT:
        raise TaskValidationError(
            f"limit must be between 1 and {MAX_PAGE_LIMIT}",
            field="limit",
        )
