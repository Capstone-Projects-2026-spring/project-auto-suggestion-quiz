import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

"""
something in auth.py is outdated, it passes a warning in the coverage report but it should be fine
"""
from unittest.mock import patch, MagicMock
from auth import hash_password, verify_password, create_token, decode_token

def test_login_success():
    """
    Somehow mocking this for sqlite when there is a successful login
    """
    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor

    """
    fake user
    """
    hashed = hash_password("password123")
    mock_cursor.fetchone.return_value = (1, "student@test.com", hashed, "student")

    with patch("sqlite3.connect", return_value=mock_conn):
        conn = __import__("sqlite3").connect("fake.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, password, role FROM users WHERE email=?", ("student@test.com",))
        user = cursor.fetchone()

        user_id, email, stored_hash, role = user

        assert verify_password("password123", stored_hash)

        token = create_token(user_id, email, role)
        decoded = decode_token(token)

        assert decoded["user_id"] == 1
        assert decoded["email"] == "student@test.com"
        assert decoded["role"] == "student"

def test_login_wrong_password():
    """
    Mock a failed login where the password does not match.
    """
    hashed = hash_password("password123")

    assert not verify_password("wrongpassword", hashed)

def test_login_user_not_found():
    """
    Mock a failed login where the user does not exist in the database.
    """
    mock_cursor = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor

    # No user found
    mock_cursor.fetchone.return_value = None

    with patch("sqlite3.connect", return_value=mock_conn):
        conn = __import__("sqlite3").connect("fake.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, password, role FROM users WHERE email=?", ("ghost@test.com",))
        user = cursor.fetchone()

        assert user is None