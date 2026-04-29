import os
import sys

import jwt
import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
from backUnitTest.test_helpers import make_conn_and_cursor

from routes_quiz import (
    QuizAnswer,
    QuizSubmitRequest,
    _get_user_from_token,
    get_attempt_detail,
    get_attempts,
    submit_quiz,
)


def test_get_user_from_token_missing_header():
    with pytest.raises(HTTPException) as exc:
        _get_user_from_token(None)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Missing or invalid Authorization header"


def test_get_user_from_token_expired(monkeypatch):
    def _raise_expired(_token):
        raise jwt.ExpiredSignatureError("expired")

    monkeypatch.setattr("routes_quiz.decode_token", _raise_expired)

    with pytest.raises(HTTPException) as exc:
        _get_user_from_token("Bearer token")

    assert exc.value.status_code == 401
    assert exc.value.detail == "Token expired"


def test_get_user_from_token_invalid(monkeypatch):
    def _raise_invalid(_token):
        raise jwt.InvalidTokenError("invalid")

    monkeypatch.setattr("routes_quiz.decode_token", _raise_invalid)

    with pytest.raises(HTTPException) as exc:
        _get_user_from_token("Bearer token")

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid token"


def test_submit_quiz_problem_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None

    monkeypatch.setattr("routes_quiz.get_connection", lambda: conn)
    monkeypatch.setattr("routes_quiz._get_user_from_token", lambda _auth: {"user_id": 1, "role": "student"})

    req = QuizSubmitRequest(
        problem_id=999,
        language="python",
        answers=[QuizAnswer(question_index=1, selected_option="A", is_correct=False)],
        time_taken_seconds=15,
    )

    with pytest.raises(HTTPException) as exc:
        submit_quiz(req, authorization="Bearer token")

    assert exc.value.status_code == 404
    assert exc.value.detail == "Problem not found"


def test_submit_quiz_success_and_score(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.side_effect = [
        {"id": 7},
        {"id": 50},
        {
            "id": 50,
            "problem_id": 7,
            "user_id": 3,
            "language": "python",
            "score": 1,
            "total": 2,
            "time_taken_seconds": 40,
            "submitted_at": "2026-04-24T12:00:00",
        },
    ]
    cursor.fetchall.return_value = [
        {"question_index": 1, "selected_option": "A", "is_correct": True},
        {"question_index": 2, "selected_option": "B", "is_correct": False},
    ]

    monkeypatch.setattr("routes_quiz.get_connection", lambda: conn)
    monkeypatch.setattr("routes_quiz._get_user_from_token", lambda _auth: {"user_id": 3, "role": "student"})

    req = QuizSubmitRequest(
        problem_id=7,
        language="python",
        answers=[
            QuizAnswer(question_index=1, selected_option="A", is_correct=True),
            QuizAnswer(question_index=2, selected_option="B", is_correct=False),
        ],
        time_taken_seconds=40,
    )

    result = submit_quiz(req, authorization="Bearer token")

    assert result.score == 1
    assert result.total == 2
    assert len(result.answers) == 2
    conn.commit.assert_called_once()


def test_get_attempts_student_forbidden_for_other_user(monkeypatch):
    monkeypatch.setattr("routes_quiz._get_user_from_token", lambda _auth: {"user_id": 2, "role": "student"})

    with pytest.raises(HTTPException) as exc:
        get_attempts(user_id=99, authorization="Bearer token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "Students can only view their own attempts"


def test_get_attempts_teacher_success(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchall.return_value = [
        {
            "id": 1,
            "problem_id": 7,
            "user_id": 8,
            "language": "python",
            "score": 2,
            "total": 3,
            "time_taken_seconds": 22,
            "submitted_at": "2026-04-24T12:00:00",
        }
    ]

    monkeypatch.setattr("routes_quiz.get_connection", lambda: conn)
    monkeypatch.setattr("routes_quiz._get_user_from_token", lambda _auth: {"user_id": 1, "role": "teacher"})

    result = get_attempts(user_id=8, authorization="Bearer token")

    assert len(result) == 1
    assert result[0].id == 1
    assert result[0].score == 2
    assert result[0].total == 3


def test_get_attempt_detail_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None

    monkeypatch.setattr("routes_quiz.get_connection", lambda: conn)
    monkeypatch.setattr("routes_quiz._get_user_from_token", lambda _auth: {"user_id": 1, "role": "teacher"})

    with pytest.raises(HTTPException) as exc:
        get_attempt_detail(attempt_id=123, authorization="Bearer token")

    assert exc.value.status_code == 404
    assert exc.value.detail == "Attempt not found"


def test_get_attempt_detail_student_access_denied(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {
        "id": 4,
        "problem_id": 2,
        "user_id": 99,
        "language": "python",
        "score": 1,
        "total": 1,
        "time_taken_seconds": 10,
        "submitted_at": "2026-04-24T12:00:00",
    }

    monkeypatch.setattr("routes_quiz.get_connection", lambda: conn)
    monkeypatch.setattr("routes_quiz._get_user_from_token", lambda _auth: {"user_id": 1, "role": "student"})

    with pytest.raises(HTTPException) as exc:
        get_attempt_detail(attempt_id=4, authorization="Bearer token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "Access denied"


def test_get_attempt_detail_success(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {
        "id": 4,
        "problem_id": 2,
        "user_id": 1,
        "language": "python",
        "score": 1,
        "total": 2,
        "time_taken_seconds": 30,
        "submitted_at": "2026-04-24T12:00:00",
    }
    cursor.fetchall.return_value = [
        {"question_index": 1, "selected_option": "A", "is_correct": True},
        {"question_index": 2, "selected_option": "B", "is_correct": False},
    ]

    monkeypatch.setattr("routes_quiz.get_connection", lambda: conn)
    monkeypatch.setattr("routes_quiz._get_user_from_token", lambda _auth: {"user_id": 1, "role": "student"})

    result = get_attempt_detail(attempt_id=4, authorization="Bearer token")

    assert result.id == 4
    assert result.score == 1
    assert result.total == 2
    assert len(result.answers) == 2
