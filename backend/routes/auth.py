"""Authentication API routes."""

from fastapi import APIRouter, Depends, status

from ..dependencies import get_auth_service, get_current_user
from ..models.user import User
from ..schemas.auth import TokenResponse
from ..schemas.user import UserCreate, UserLogin, UserResponse
from ..services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(
    payload: UserCreate,
    service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    """Create a new account."""
    user = service.register(payload)
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive JWT",
)
def login(
    payload: UserLogin,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Authenticate with email/password and return a bearer token."""
    user, token = service.login(payload)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)
