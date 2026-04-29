import sys
import os
"""
Same issue, deprecation, ok to ignore.
"""
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from auth import hash_password
from main import app

client = TestClient(app)

def test_loginRoute_success():
    """
    Mock a successful login for a student.
    """
    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = {
        "id": 1,
        "name": "John Student",
        "email": "john@test.com",
        "password": hash_password("password123"),
        "role": "student"
    }

    with patch("routes_auth.get_connection", return_value=mock_conn):
        response = client.post("/auth/login", json={
            "email": "john@test.com",
            "password": "password123"
        })

        assert response.status_code == 200 # HTTP OK STATUS
        assert response.json()["user"]["email"] == "john@test.com"
        assert "token" in response.json()

def test_loginRoute_wrong_password():
    """
    Mock a failed login where password is incorrect.
    """
    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = {
        "id": 1,
        "name": "John Student",
        "email": "john@test.com",
        "password": hash_password("password123"),
        "role": "student"
    }

    with patch("routes_auth.get_connection", return_value=mock_conn):
        response = client.post("/auth/login", json={
            "email": "john@test.com",
            "password": "wrongpassword"
        })

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"