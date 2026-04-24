import sys
import os
import pytest
import jwt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from auth import hash_password, verify_password, create_token, decode_token

def test_hash_password_returns_string():
    password = "mypassword123"
    hashed = hash_password(password)

    assert isinstance(hashed, str)
    assert hashed != password


def test_verify_password_correct():
    password = "secure123"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_incorrect():
    password = "secure123"
    hashed = hash_password(password)

    assert verify_password("wrongpassword", hashed) is False


def test_create_token_and_decode():
    token = create_token(1, "han@example.com", "student")
    payload = decode_token(token)

    assert payload["user_id"] == 1
    assert payload["email"] == "han@example.com"
    assert payload["role"] == "student"