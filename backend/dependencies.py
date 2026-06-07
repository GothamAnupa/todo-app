"""FastAPI dependency providers for routes and services."""



from collections.abc import Generator



from fastapi import Depends

from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from jose import JWTError

from sqlalchemy.orm import Session



from .database import SessionLocal

from .models.user import User

from .repositories.task_repository import TaskRepository

from .repositories.user_repository import UserRepository

from .services.auth_service import AuthService

from .services.exceptions import UnauthorizedError

from .services.task_service import TaskService

from .utils.security import decode_access_token



bearer_scheme = HTTPBearer(auto_error=False)





def get_db() -> Generator[Session, None, None]:

    """Yield a database session per request and ensure it is closed afterward."""

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()





def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:

    return UserRepository(db)





def get_auth_service(

    repository: UserRepository = Depends(get_user_repository),

) -> AuthService:

    return AuthService(repository)





def get_current_user(

    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),

    db: Session = Depends(get_db),

) -> User:

    """Resolve the authenticated user from a Bearer JWT."""

    if credentials is None or credentials.scheme.lower() != "bearer":

        raise UnauthorizedError("Not authenticated")



    try:

        user_id = decode_access_token(credentials.credentials)

    except (JWTError, ValueError) as exc:

        raise UnauthorizedError("Invalid or expired token") from exc



    user = UserRepository(db).get_user_by_id(user_id)

    if user is None:

        raise UnauthorizedError("User not found")



    return user





def get_task_repository(db: Session = Depends(get_db)) -> TaskRepository:

    return TaskRepository(db)





def get_task_service(

    repository: TaskRepository = Depends(get_task_repository),

) -> TaskService:

    return TaskService(repository)


