"""Password hashing and JWT token utilities."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from ..config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password for storage."""
    try:
        import bcrypt

        pw_bytes = password.encode("utf-8") if isinstance(password, str) else password
        truncated = pw_bytes[:72]
        hashed = bcrypt.hashpw(truncated, bcrypt.gensalt())
        return hashed.decode("utf-8")
    except Exception:
        return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored hash."""
    # Prefer using bcrypt directly for hashes generated with bcrypt
    try:
        import bcrypt

        pw_bytes = plain_password.encode("utf-8") if isinstance(plain_password, str) else plain_password
        truncated = pw_bytes[:72]
        try:
            return bcrypt.checkpw(truncated, hashed_password.encode("utf-8"))
        except Exception:
            pass
    except Exception:
        pass

    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        import logging

        logging.getLogger(__name__).exception("password verify failed")
        return False


def create_access_token(user_id: int, extra_claims: dict[str, Any] | None = None) -> str:
    """Generate a signed JWT access token for the given user id."""
    expire_dt = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    # Use integer UNIX timestamp for `exp` claim to ensure compatibility
    expire_ts = int(expire_dt.timestamp())
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "exp": expire_ts,
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int:
    """
    Decode and validate a JWT access token.

    Returns the user id from the `sub` claim.
    Raises JWTError when invalid or expired.
    """
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    subject = payload.get("sub")
    if subject is None:
        raise JWTError("Token subject missing")

    return int(subject)
