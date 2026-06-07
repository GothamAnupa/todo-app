"""Tests for TaskRepository CRUD and filtering."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.database import Base
from backend.models.task import TaskPriority, TaskStatus
from backend.repositories.task_repository import SortOrder, TaskRepository, TaskSortField


@pytest.fixture
def db_session() -> Session:
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def test_task_repository_crud_flow(db_session: Session) -> None:
    repo = TaskRepository(db_session)

    created = repo.create_task(title="Write tests", user_id=1, priority=TaskPriority.HIGH)
    assert created.id is not None
    assert created.title == "Write tests"
    assert created.status == TaskStatus.PENDING

    fetched = repo.get_task_by_id(created.id)
    assert fetched is not None
    assert fetched.id == created.id

    updated = repo.update_task(created.id, {"status": TaskStatus.COMPLETED})
    assert updated is not None
    assert updated.status == TaskStatus.COMPLETED

    result = repo.get_all_tasks(status=TaskStatus.COMPLETED, user_id=1)
    assert result.total == 1
    assert len(result.items) == 1

    assert repo.delete_task(created.id) is True
    assert repo.get_task_by_id(created.id) is None


def test_get_all_tasks_sort_and_pagination(db_session: Session) -> None:
    repo = TaskRepository(db_session)
    repo.create_task(title="B", user_id=1)
    repo.create_task(title="A", user_id=1)

    page = repo.get_all_tasks(
        user_id=1,
        sort_by=TaskSortField.TITLE,
        order=SortOrder.ASC,
        offset=0,
        limit=1,
    )
    assert page.total == 2
    assert len(page.items) == 1
    assert page.items[0].title == "A"
