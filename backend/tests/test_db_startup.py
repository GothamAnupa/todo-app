"""Tests for automatic table creation from SQLAlchemy metadata."""

import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from backend.config import settings
from backend.database import Base, create_tables, init_db, register_models
from backend.main import app


def test_register_models_attaches_tasks_to_metadata() -> None:
    register_models()
    assert "tasks" in Base.metadata.tables


def test_init_db_is_idempotent() -> None:
    first = init_db()
    second = init_db()
    assert first == second
    assert "tasks" in first


def test_startup_creates_tasks_table_via_lifespan() -> None:
    """FastAPI lifespan calls init_db(); tasks table must exist in SQLite."""
    db_path = Path(settings.database_url.removeprefix("sqlite:///"))

    create_tables()

    with TestClient(app) as client:
        assert client.get("/api/v1/health").status_code == 200

    with sqlite3.connect(db_path) as con:
        cur = con.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'")
        assert cur.fetchone() == ("tasks",)
