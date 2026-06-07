"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db
from .repositories.user_repository import UserRepository
from .routes.exception_handlers import register_exception_handlers
from .routes.auth import router as auth_router
from .routes.health import router as health_router
from .routes.tasks import router as tasks_router
from .utils.scheduler import shutdown_scheduler, start_scheduler
from .utils.security import hash_password

logger = logging.getLogger(__name__)


def seed_default_user() -> None:
    """Create a known test user if it does not already exist."""
    from .database import SessionLocal

    email = "karthikwrk19@gmail.com"
    username = "karthikwrk19"
    password = "test@123"

    with SessionLocal() as db:
        repo = UserRepository(db)
        if repo.get_user_by_email(email) is None:
            repo.create_user(
                email=email,
                username=username,
                password_hash=hash_password(password),
            )
            logger.info("Created default credentials for %s", email)
        else:
            logger.info("Default user already exists: %s", email)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: create missing tables from SQLAlchemy Base.metadata.
    Shutdown: add cleanup hooks here when needed.
    """
    table_names = init_db()
    logger.info("FastAPI startup complete — schema synced for: %s", ", ".join(table_names))
    seed_default_user()
    start_scheduler()
    try:
        yield
    finally:
        shutdown_scheduler()


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

register_exception_handlers(app)

# Allow the frontend (e.g. ui.html on a dev server) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Versioned API routes
app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1/tasks")


@app.get("/")
def root() -> FileResponse:
    """Serve the frontend index.html."""
    index_file = Path(__file__).parent.parent / "static" / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Todo API", "docs": "/docs"}


# Mount static files (built frontend) - serve everything from /static
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
else:
    logger.warning("Static directory not found at %s", static_dir)


if __name__ == "__main__":
    # Allow running the app directly for simple local development:
    #   python main.py
    # This uses the configured host/port from backend/config.py, so you can override
    # these values with environment variables if needed.
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
    )

