import pytest
import jwt

from auth import hash_password, verify_password, create_token, decode_token


def test_hash_password_returns_string():
    password = "mypassword123"
    hashed = hash_password(password)

    assert isinstance(hashed, str)
    assert hashed != password


def test_hash_password_is_consistent():
    password = "samepassword"
    hashed1 = hash_password(password)
    hashed2 = hash_password(password)

    assert hashed1 == hashed2


def test_verify_password_correct():
    password = "secure123"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_verify_password_incorrect():
    password = "secure123"
    hashed = hash_password(password)

    assert verify_password("wrongpassword", hashed) is False


def test_create_token_returns_string():
    token = create_token(1, "han@example.com", "student")

    assert isinstance(token, str)
    assert len(token) > 0


def test_decode_token_returns_correct_payload():
    token = create_token(1, "han@example.com", "student")
    payload = decode_token(token)

    assert payload["user_id"] == 1
    assert payload["email"] == "han@example.com"
    assert payload["role"] == "student"
    assert "exp" in payload


def test_decode_invalid_token_raises_error():
    invalid_token = "this.is.not.valid"

    with pytest.raises(jwt.InvalidTokenError):
        decode_token(invalid_token)