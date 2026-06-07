"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
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

# Get static directory path - relative to this file's parent's parent (the app root)
STATIC_DIR = Path(__file__).parent.parent / "static"
logger.info(f"Static directory configured at: {STATIC_DIR}")


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

# Mount static files for assets
if STATIC_DIR.exists():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
        logger.info("Mounted /assets from %s", assets_dir)
else:
    logger.warning("Static directory not found at %s", STATIC_DIR)


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve SPA - return index.html for all non-API routes."""
    logger.debug(f"Serving SPA request for path: {full_path}")
    
    # Skip API routes
    if full_path.startswith("api/"):
        logger.debug(f"Skipping API route: {full_path}")
        raise HTTPException(status_code=404, detail="Not found")
    
    # Try to serve static file
    if STATIC_DIR.exists():
        static_file = STATIC_DIR / full_path
        logger.debug(f"Checking for static file at: {static_file}")
        
        if static_file.exists() and static_file.is_file():
            logger.debug(f"Serving static file: {static_file}")
            return FileResponse(static_file)
        
        # Fallback to index.html for SPA routing
        index_file = STATIC_DIR / "index.html"
        logger.debug(f"Serving index.html from: {index_file}")
        if index_file.exists():
            return FileResponse(index_file)
    
    logger.warning(f"Could not serve {full_path}, static dir exists: {STATIC_DIR.exists()}")
    raise HTTPException(status_code=404, detail="Not found")


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

