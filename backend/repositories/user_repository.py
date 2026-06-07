"""User data-access repository."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.user import User


class UserRepository:
    """Encapsulates User persistence queries."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def create_user(
        self,
        *,
        email: str,
        username: str,
        password_hash: str,
    ) -> User:
        """Insert a new user and return the persisted ORM instance."""
        user = User(email=email, username=username, password_hash=password_hash)
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def get_user_by_id(self, user_id: int) -> User | None:
        return self._db.scalar(select(User).where(User.id == user_id))

    def get_user_by_email(self, email: str) -> User | None:
        return self._db.scalar(select(User).where(User.email == email))

    def get_user_by_username(self, username: str) -> User | None:
        return self._db.scalar(select(User).where(User.username == username))
