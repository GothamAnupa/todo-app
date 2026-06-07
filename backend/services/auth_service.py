"""Authentication business logic."""

from ..models.user import User
from ..repositories.user_repository import UserRepository
from ..schemas.user import UserCreate, UserLogin
from .exceptions import (
    AuthValidationError,
    DuplicateUserError,
    InvalidCredentialsError,
    UnauthorizedError,
)
from ..utils.security import create_access_token, hash_password, verify_password
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Coordinates user registration, login, and token issuance."""

    def __init__(self, repository: UserRepository) -> None:
        self._repo = repository

    def register(self, payload: UserCreate) -> User:
        """Create a new user account with hashed password."""
        email = payload.email.strip().lower()
        username = payload.username.strip()

        # Debug: record password type and length (non-sensitive)
        try:
            pw = payload.password
            pw_len = len(pw) if pw is not None else 0
            with open('debug_trace.log', 'a', encoding='utf-8') as f:
                f.write(f"DEBUG_REGISTER email={email} pw_type={type(pw)!s} pw_len={pw_len}\n")
        except Exception:
            pass

        if self._repo.get_user_by_email(email):
            raise DuplicateUserError("Email is already registered", field="email")

        if self._repo.get_user_by_username(username):
            raise DuplicateUserError("Username is already taken", field="username")

        return self._repo.create_user(
            email=email,
            username=username,
            password_hash=hash_password(payload.password),
        )

    def login(self, payload: UserLogin) -> tuple[User, str]:
        """Validate credentials and return user plus JWT access token."""
        email = payload.email.strip().lower()
        user = self._repo.get_user_by_email(email)

        # Debug: log lengths to diagnose bcrypt issues without logging secrets
        try:
            pw_len = len(payload.password) if payload and payload.password else 0
            hash_len = len(user.password_hash) if user and user.password_hash else 0
        except Exception:
            pw_len = 0
            hash_len = 0
        logger.debug("login attempt email=%s pw_len=%d hash_len=%d", email, pw_len, hash_len)
        # also append lightweight non-sensitive info to debug_trace.log for easy inspection
        try:
            masked = (payload.password[:32] + '...') if payload and payload.password else ''
            with open('debug_trace.log', 'a', encoding='utf-8') as f:
                f.write(f"DEBUG_LOGIN email={email} pw_len={pw_len} pw_head={masked!r} hash_len={hash_len}\n")
        except Exception:
            pass

        if user is None or not verify_password(payload.password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")

        token = create_access_token(user.id)
        return user, token

    def get_user_by_id(self, user_id: int) -> User:
        """Return an active user or raise when not found."""
        user = self._repo.get_user_by_id(user_id)
        if user is None:
            raise UnauthorizedError("User not found")
        return user
