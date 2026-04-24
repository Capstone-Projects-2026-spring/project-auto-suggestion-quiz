import sys
import os
"""
More deprecation warnings, there are a lot of outdated stuff in this code but it's okay to ignore for now
"""
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_register_success():
    """
    Mock a successful registration of a new teacher.
    """
    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.side_effect = [None, {"id": 1}]

    with patch("routes_auth.get_connection", return_value=mock_conn):
        response = client.post("/auth/register", json={
            "name": "John Teacher",
            "email": "john@test.com",
            "password": "password123",
            "role": "teacher"
        })

        assert response.status_code == 200
        assert response.json()["user"]["email"] == "john@test.com"
        assert response.json()["user"]["role"] == "teacher"
        assert "token" in response.json()

def test_register_email_already_exists():
    """
    Mock a failed registration where email is already taken.
    """
    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = {"id": 1}

    with patch("routes_auth.get_connection", return_value=mock_conn):
        response = client.post("/auth/register", json={
            "name": "John Teacher",
            "email": "john@test.com",
            "password": "password123",
            "role": "teacher"
        })

        """
        Check and see if the route is available
        """
        assert response.status_code == 400
        assert response.json()["detail"] == "Email already registered"

def test_register_invalid_role():
    """
    Mock a failed registration where role is invalid.
    """
    response = client.post("/auth/register", json={
        "name": "John Teacher",
        "email": "john@test.com",
        "password": "password123",
        "role": "superuser" 
    })

    """
    test that the route is successful
    """
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid role"