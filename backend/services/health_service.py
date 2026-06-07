"""Business logic for operational health checks."""

from ..schemas.health import HealthResponse


def get_health_status() -> HealthResponse:
    """Build the current application health snapshot."""
    return HealthResponse(status="ok", service="todo-api")
