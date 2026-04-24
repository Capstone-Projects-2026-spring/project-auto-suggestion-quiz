import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from auth import hash_password, verify_password, create_token, decode_token


def test_create_token_and_decode():
    token = create_token(1, "han@example.com", "student")
    payload = decode_token(token)

    assert payload["user_id"] == 1
    assert payload["email"] == "han@example.com"
    assert payload["role"] == "student"