"""Tests for TaskService business rules."""

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.models.task import TaskPriority, TaskStatus
from backend.repositories.task_repository import TaskRepository
from backend.schemas.task import TaskCreate, TaskUpdate
from backend.services.exceptions import TaskNotFoundError, TaskValidationError
from backend.services.task_service import TaskService


@pytest.fixture
def service() -> TaskService:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = session_factory()
    repo = TaskRepository(session)
    return TaskService(repo)


def test_create_task_success(service: TaskService) -> None:
    payload = TaskCreate(title="  Valid title  ", priority=TaskPriority.HIGH)
    task = service.create_task(payload, user_id=1)

    assert task.title == "Valid title"
    assert task.status == TaskStatus.PENDING


def test_create_task_blank_title_raises(service: TaskService) -> None:
    with pytest.raises(TaskValidationError, match="title cannot be blank"):
        service.create_task(TaskCreate(title="   "), user_id=1)


def test_create_task_past_deadline_raises(service: TaskService) -> None:
    past = datetime.now(timezone.utc) - timedelta(days=1)
    with pytest.raises(TaskValidationError, match="deadline cannot be in the past"):
        service.create_task(TaskCreate(title="Task", deadline=past), user_id=1)


def test_get_task_not_found(service: TaskService) -> None:
    with pytest.raises(TaskNotFoundError):
        service.get_task(999)


def test_complete_task_sets_status(service: TaskService) -> None:
    created = service.create_task(TaskCreate(title="Finish"), user_id=1)
    completed = service.complete_task(created.id)

    assert completed.status == TaskStatus.COMPLETED


def test_update_task_empty_payload_raises(service: TaskService) -> None:
    created = service.create_task(TaskCreate(title="Task"), user_id=1)
    with pytest.raises(TaskValidationError, match="at least one field"):
        service.update_task(created.id, TaskUpdate())


def test_delete_task_not_found(service: TaskService) -> None:
    with pytest.raises(TaskNotFoundError):
        service.delete_task(42)
