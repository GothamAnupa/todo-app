"""Integration tests for task API routes."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def reset_tasks(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.get("/api/v1/tasks?limit=100", headers=auth_headers)
    if response.status_code == 200:
        for task in response.json()["tasks"]:
            client.delete(f"/api/v1/tasks/{task['id']}", headers=auth_headers)


def test_task_crud_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    create = client.post(
        "/api/v1/tasks",
        json={"title": "API task", "priority": "high"},
        headers=auth_headers,
    )
    assert create.status_code == 201
    task_id = create.json()["id"]

    get_one = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert get_one.status_code == 200
    assert get_one.json()["title"] == "API task"

    patch = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"description": "Updated"},
        headers=auth_headers,
    )
    assert patch.status_code == 200
    assert patch.json()["description"] == "Updated"

    complete = client.patch(f"/api/v1/tasks/{task_id}/complete", headers=auth_headers)
    assert complete.status_code == 200
    assert complete.json()["status"] == "completed"

    delete = client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert delete.status_code == 204

    missing = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert missing.status_code == 404


def test_list_tasks_with_filters(client: TestClient, auth_headers: dict[str, str]) -> None:
    client.post(
        "/api/v1/tasks",
        json={"title": "Pending task", "priority": "low"},
        headers=auth_headers,
    )
    created = client.post(
        "/api/v1/tasks",
        json={"title": "High task", "priority": "high"},
        headers=auth_headers,
    )
    client.patch(
        f"/api/v1/tasks/{created.json()['id']}/complete",
        headers=auth_headers,
    )

    response = client.get(
        "/api/v1/tasks",
        params={"status": "completed", "limit": 10},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert all(task["status"] == "completed" for task in body["tasks"])


def test_validation_errors(client: TestClient, auth_headers: dict[str, str]) -> None:
    blank = client.post(
        "/api/v1/tasks",
        json={"title": "   "},
        headers=auth_headers,
    )
    assert blank.status_code == 422

    past = datetime.now(timezone.utc) - timedelta(days=2)
    past_deadline = client.post(
        "/api/v1/tasks",
        json={"title": "Bad deadline", "deadline": past.isoformat()},
        headers=auth_headers,
    )
    assert past_deadline.status_code == 422
