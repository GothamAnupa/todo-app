"""SQLAlchemy engine, session factory, and declarative Base."""

import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

logger = logging.getLogger(__name__)

# SQLite requires check_same_thread=False for FastAPI's threaded request handling
_connect_args = (
    {"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {}
)

engine = create_engine(settings.database_url, connect_args=_connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""


def register_models() -> None:
    """Import ORM modules so their tables are attached to Base.metadata."""
    from . import models  # noqa: F401


def create_tables() -> list[str]:
    """
    Create every table defined on Base.metadata if it does not already exist.

    Relies on SQLAlchemy's metadata registry (populated by register_models).
    checkfirst=True avoids errors when tables already exist (e.g. app reload).
    """
    register_models()
    Base.metadata.create_all(bind=engine, checkfirst=True)
    return sorted(Base.metadata.tables.keys())


def _ensure_sqlite_reminder_columns() -> None:
    """Add reminder columns to existing SQLite task table if they are missing."""
    if not settings.database_url.startswith("sqlite"):
        return

    with engine.connect() as connection:
        result = connection.execute(text("PRAGMA table_info(tasks)"))
        existing_columns = {row[1] for row in result}

        if "reminder_time" not in existing_columns:
            connection.execute(text("ALTER TABLE tasks ADD COLUMN reminder_time DATETIME"))
            logger.info("Added reminder_time column to tasks table")

        if "is_reminded" not in existing_columns:
            connection.execute(text("ALTER TABLE tasks ADD COLUMN is_reminded BOOLEAN NOT NULL DEFAULT 0"))
            logger.info("Added is_reminded column to tasks table")


def init_db() -> list[str]:
    """Application startup hook: sync database schema from ORM metadata."""
    table_names = create_tables()
    _ensure_sqlite_reminder_columns()
    logger.info(
        "Database tables ready (%d): %s",
        len(table_names),
        ", ".join(table_names) if table_names else "none",
    )
    return table_names
