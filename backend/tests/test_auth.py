"""Tests for authentication routes."""

import uuid

from fastapi.testclient import TestClient


def test_register_login_and_me(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:8]
    email = f"auth_{suffix}@example.com"
    username = f"authuser_{suffix}"
    password = "securepass123"

    register = client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert register.status_code == 201
    assert register.json()["email"] == email

    login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    body = login.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {body['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["username"] == username


def test_duplicate_email_rejected(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "email": f"dup_{suffix}@example.com",
        "username": f"dup_a_{suffix}",
        "password": "securepass123",
    }
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201

    duplicate = client.post(
        "/api/v1/auth/register",
        json={
            "email": payload["email"],
            "username": f"dup_b_{suffix}",
            "password": "securepass123",
        },
    )
    assert duplicate.status_code == 409


def test_tasks_require_auth(client: TestClient) -> None:
    response = client.get("/api/v1/tasks")
    assert response.status_code == 401
