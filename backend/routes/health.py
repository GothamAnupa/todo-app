"""Health-check routes."""

from fastapi import APIRouter

from ..schemas.health import HealthResponse
from ..services.health_service import get_health_status

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Return API availability for load balancers and monitoring."""
    return get_health_status()
