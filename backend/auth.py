import hashlib
import jwt
import datetime
import os

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """
    Hash a plain text password using SHA-256.

    :param password: The plain text password to hash.
    :return: The hex digest of the hashed password.
    """
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """
    Verify a plain text password against a stored hash.

    :param password: The plain text password to verify.
    :param hashed: The stored SHA-256 hash to compare against.
    :return: True if the password matches, False otherwise.
    """
    return hash_password(password) == hashed


def create_token(user_id: int, email: str, role: str) -> str:
    """
    Create a signed JWT token valid for 24 hours.

    :param user_id: The user's database ID.
    :param email: The user's email address.
    :param role: The user's role (e.g. `student`, `teacher`, `admin`).
    :return: A signed JWT token string.
    """
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT token.

    :param token: The JWT token string to decode.
    :return: The decoded payload as a dictionary.
    :raises jwt.ExpiredSignatureError: If the token has expired.
    :raises jwt.InvalidTokenError: If the token is invalid or tampered with.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])