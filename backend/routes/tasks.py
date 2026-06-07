"""Task REST API routes (thin controllers over TaskService)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status

from ..dependencies import get_current_user, get_task_service
from ..models.user import User
from ..models.task import Task, TaskPriority, TaskStatus
from ..repositories.task_repository import SortOrder, TaskSortField
from ..schemas.task import TaskCreate, TaskListResponse, TaskResponse, TaskUpdate
from ..services.task_service import TaskService

router = APIRouter(tags=["Tasks"])


def _to_response(task: Task) -> TaskResponse:
    """Map ORM entity to API response schema."""
    return TaskResponse.model_validate(task)


@router.get(
    "/",
    response_model=TaskListResponse,
    summary="List tasks",
    description="Return tasks with optional status/priority filters, sorting, and pagination.",
)
def list_tasks(
    status: TaskStatus | None = Query(default=None, description="Filter by task status"),
    priority: TaskPriority | None = Query(default=None, description="Filter by priority"),
    sort_by: TaskSortField = Query(
        default=TaskSortField.CREATED_AT,
        description="Column used for sorting",
    ),
    order: SortOrder = Query(default=SortOrder.DESC, description="Sort direction"),
    offset: int = Query(default=0, ge=0, description="Number of rows to skip"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum rows to return"),
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
) -> TaskListResponse:
    """List tasks for the current user."""
    result = service.get_tasks(
        status=status,
        priority=priority,
        user_id=current_user.id,
        sort_by=sort_by,
        order=order,
        offset=offset,
        limit=limit,
    )
    return TaskListResponse(
        tasks=[_to_response(task) for task in result.items],
        total=result.total,
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get task by id",
)
def get_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Return a single task by primary key."""
    task = service.get_task(task_id, user_id=current_user.id)
    return _to_response(task)


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create task",
)
def create_task(
    payload: TaskCreate,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Create a new task for the current user."""
    task = service.create_task(payload, user_id=current_user.id)
    return _to_response(task)


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update task",
    description="Partially update one or more task fields.",
)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Apply a partial update to an existing task."""
    task = service.update_task(task_id, payload, user_id=current_user.id)
    return _to_response(task)


@router.patch(
    "/{task_id}/complete",
    response_model=TaskResponse,
    summary="Complete task",
    description="Mark the task status as completed.",
)
def complete_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Mark a task as completed."""
    task = service.complete_task(task_id, user_id=current_user.id)
    return _to_response(task)


@router.patch(
    "/{task_id}/remind",
    response_model=TaskResponse,
    summary="Mark reminder delivered",
    description="Flag a task reminder as delivered so it does not trigger again.",
)
def mark_task_reminded(
    task_id: int,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Mark a task reminder as sent."""
    task = service.mark_task_reminded(task_id, user_id=current_user.id)
    return _to_response(task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete task",
)
def delete_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Permanently delete a task."""
    service.delete_task(task_id, user_id=current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
