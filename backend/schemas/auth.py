"""Authentication response schemas."""

from pydantic import BaseModel, Field

from .user import UserResponse


class TokenResponse(BaseModel):
    """JWT access token payload."""

    access_token: str
    token_type: str = Field(default="bearer")
    user: UserResponse
