"""Pydantic schemas for health-check responses."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Standard health endpoint payload."""

    status: str = Field(..., examples=["ok"])
    service: str = Field(..., examples=["todo-api"])
