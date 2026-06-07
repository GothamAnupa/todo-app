"""Map service-layer exceptions to HTTP responses."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from ..services.exceptions import (
    AuthValidationError,
    DuplicateUserError,
    InvalidCredentialsError,
    TaskNotFoundError,
    TaskValidationError,
    UnauthorizedError,
)


def register_exception_handlers(app: FastAPI) -> None:
    """Attach task-related exception handlers to the FastAPI application."""

    @app.exception_handler(TaskNotFoundError)
    async def handle_task_not_found(_request: Request, exc: TaskNotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={"detail": str(exc), "task_id": exc.task_id},
        )

    @app.exception_handler(TaskValidationError)
    async def handle_task_validation(_request: Request, exc: TaskValidationError) -> JSONResponse:
        content: dict[str, str | None] = {"detail": str(exc)}
        if exc.field is not None:
            content["field"] = exc.field
        return JSONResponse(status_code=422, content=content)

    @app.exception_handler(UnauthorizedError)
    async def handle_unauthorized(_request: Request, exc: UnauthorizedError) -> JSONResponse:
        return JSONResponse(status_code=401, content={"detail": str(exc)})

    @app.exception_handler(InvalidCredentialsError)
    async def handle_invalid_credentials(
        _request: Request,
        exc: InvalidCredentialsError,
    ) -> JSONResponse:
        return JSONResponse(status_code=401, content={"detail": str(exc)})

    @app.exception_handler(DuplicateUserError)
    async def handle_duplicate_user(_request: Request, exc: DuplicateUserError) -> JSONResponse:
        content: dict[str, str | None] = {"detail": str(exc)}
        if exc.field is not None:
            content["field"] = exc.field
        return JSONResponse(status_code=409, content=content)

    @app.exception_handler(AuthValidationError)
    async def handle_auth_validation(_request: Request, exc: AuthValidationError) -> JSONResponse:
        content: dict[str, str | None] = {"detail": str(exc)}
        if exc.field is not None:
            content["field"] = exc.field
        return JSONResponse(status_code=422, content=content)

    @app.exception_handler(Exception)
    async def handle_unexpected(_request: Request, exc: Exception) -> JSONResponse:
        # Log full traceback to a local file for debugging during development.
        import traceback
        trace = traceback.format_exc()
        try:
            with open('debug_trace.log', 'a', encoding='utf-8') as fh:
                fh.write(trace)
                fh.write('\n---\n')
        except Exception:
            # Best-effort logging — avoid raising from the handler itself.
            pass
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error", "debug_file": "debug_trace.log"})
