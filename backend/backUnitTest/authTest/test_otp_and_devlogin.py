import os
import sys
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from main import app

client = TestClient(app)


class _MockResponse:
    def __init__(self, status_code, payload=None):
        self.status_code = status_code
        self._payload = payload or {}

    def json(self):
        return self._payload


class _MockAsyncClient:
    def __init__(self, response):
        self._response = response

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return False

    async def post(self, *args, **kwargs):
        return self._response


def test_dev_login_disabled_when_debug_false(monkeypatch):
    monkeypatch.setenv("DEBUG", "false")

    response = client.post("/auth/dev-login")

    assert response.status_code == 404
    assert response.json()["detail"] == "Not found"


def test_dev_login_success(monkeypatch):
    monkeypatch.setenv("DEBUG", "true")

    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = {
        "id": 1,
        "name": "Seed Teacher",
        "email": "seed@autoquiz.dev",
        "role": "teacher",
    }

    with patch("routes_auth.get_connection", return_value=mock_conn):
        response = client.post("/auth/dev-login")

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "seed@autoquiz.dev"
    assert body["user"]["role"] == "teacher"
    assert "token" in body


def test_dev_login_seed_teacher_missing(monkeypatch):
    monkeypatch.setenv("DEBUG", "true")

    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = None

    with patch("routes_auth.get_connection", return_value=mock_conn):
        response = client.post("/auth/dev-login")

    assert response.status_code == 500
    assert "Seed teacher not found" in response.json()["detail"]


def test_otp_request_requires_supabase_config(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)

    response = client.post("/auth/otp/request", json={"email": "teacher@test.com"})

    assert response.status_code == 500
    assert response.json()["detail"] == "Supabase is not configured"


def test_otp_verify_requires_supabase_config(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)

    response = client.post(
        "/auth/otp/verify",
        json={"email": "teacher@test.com", "token": "123456"},
    )

    assert response.status_code == 500
    assert response.json()["detail"] == "Supabase is not configured"


def test_otp_request_success(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "service-key")

    mock_response = _MockResponse(status_code=200)
    monkeypatch.setattr("routes_auth.httpx.AsyncClient", lambda: _MockAsyncClient(mock_response))

    response = client.post("/auth/otp/request", json={"email": "teacher@test.com"})

    assert response.status_code == 200
    assert response.json()["message"] == "OTP sent"


def test_otp_request_accepts_204(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "service-key")

    mock_response = _MockResponse(status_code=204)
    monkeypatch.setattr("routes_auth.httpx.AsyncClient", lambda: _MockAsyncClient(mock_response))

    response = client.post("/auth/otp/request", json={"email": "teacher@test.com"})

    assert response.status_code == 200
    assert response.json()["message"] == "OTP sent"


def test_otp_request_upstream_failure_maps_to_502(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "service-key")

    mock_response = _MockResponse(status_code=500)
    monkeypatch.setattr("routes_auth.httpx.AsyncClient", lambda: _MockAsyncClient(mock_response))

    response = client.post("/auth/otp/request", json={"email": "teacher@test.com"})

    assert response.status_code == 502
    assert response.json()["detail"] == "Failed to send OTP"


def test_otp_verify_invalid_or_expired(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "service-key")

    mock_response = _MockResponse(status_code=401)
    monkeypatch.setattr("routes_auth.httpx.AsyncClient", lambda: _MockAsyncClient(mock_response))

    response = client.post(
        "/auth/otp/verify",
        json={"email": "teacher@test.com", "token": "000000"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired OTP"


def test_otp_verify_existing_user_success(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "service-key")

    mock_verify_response = _MockResponse(
        status_code=200,
        payload={"user": {"email": "teacher@test.com"}},
    )
    monkeypatch.setattr("routes_auth.httpx.AsyncClient", lambda: _MockAsyncClient(mock_verify_response))

    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = {
        "id": 5,
        "name": "Teacher",
        "email": "teacher@test.com",
        "role": "teacher",
    }

    with patch("routes_auth.get_connection", return_value=mock_conn):
        response = client.post(
            "/auth/otp/verify",
            json={"email": "teacher@test.com", "token": "123456"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["id"] == 5
    assert body["user"]["email"] == "teacher@test.com"
    assert "token" in body


def test_otp_verify_creates_user_if_missing(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "service-key")

    mock_verify_response = _MockResponse(
        status_code=200,
        payload={"user": {"email": "newteacher@test.com"}},
    )
    monkeypatch.setattr("routes_auth.httpx.AsyncClient", lambda: _MockAsyncClient(mock_verify_response))

    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.side_effect = [None, {"id": 9}]

    with patch("routes_auth.get_connection", return_value=mock_conn):
        response = client.post(
            "/auth/otp/verify",
            json={"email": "newteacher@test.com", "token": "123456"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["id"] == 9
    assert body["user"]["email"] == "newteacher@test.com"
    assert body["user"]["role"] == "teacher"
    assert "token" in body


def test_otp_verify_uses_top_level_email_when_user_email_missing(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "service-key")

    mock_verify_response = _MockResponse(
        status_code=200,
        payload={"email": "teacher2@test.com"},
    )
    monkeypatch.setattr("routes_auth.httpx.AsyncClient", lambda: _MockAsyncClient(mock_verify_response))

    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = {
        "id": 10,
        "name": "Teacher 2",
        "email": "teacher2@test.com",
        "role": "teacher",
    }

    with patch("routes_auth.get_connection", return_value=mock_conn):
        response = client.post(
            "/auth/otp/verify",
            json={"email": "request-email@test.com", "token": "123456"},
        )

    assert response.status_code == 200
    assert response.json()["user"]["email"] == "teacher2@test.com"


def test_otp_verify_falls_back_to_request_email(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "service-key")

    mock_verify_response = _MockResponse(
        status_code=200,
        payload={},
    )
    monkeypatch.setattr("routes_auth.httpx.AsyncClient", lambda: _MockAsyncClient(mock_verify_response))

    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.side_effect = [None, {"id": 11}]

    with patch("routes_auth.get_connection", return_value=mock_conn):
        response = client.post(
            "/auth/otp/verify",
            json={"email": "fallback@test.com", "token": "123456"},
        )

    assert response.status_code == 200
    assert response.json()["user"]["email"] == "fallback@test.com"
