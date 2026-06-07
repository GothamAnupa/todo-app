"""Service-layer exceptions (mapped to HTTP status codes in routes)."""


class TaskServiceError(Exception):
    """Base class for task business-logic errors."""


class TaskNotFoundError(TaskServiceError):
    """Raised when a task id does not exist (or is not visible to the user)."""

    def __init__(self, task_id: int) -> None:
        self.task_id = task_id
        super().__init__(f"Task {task_id} not found")


class TaskValidationError(TaskServiceError):
    """Raised when business validation fails."""

    def __init__(self, message: str, *, field: str | None = None) -> None:
        self.field = field
        super().__init__(message)


class AuthServiceError(Exception):
    """Base class for authentication errors."""


class AuthValidationError(AuthServiceError):
    """Raised when auth input fails business validation."""

    def __init__(self, message: str, *, field: str | None = None) -> None:
        self.field = field
        super().__init__(message)


class DuplicateUserError(AuthServiceError):
    """Raised when email or username already exists."""

    def __init__(self, message: str, *, field: str | None = None) -> None:
        self.field = field
        super().__init__(message)


class InvalidCredentialsError(AuthServiceError):
    """Raised when login credentials are invalid."""


class UnauthorizedError(AuthServiceError):
    """Raised when a token is missing, invalid, or expired."""
