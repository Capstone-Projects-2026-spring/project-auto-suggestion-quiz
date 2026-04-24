import os
import sys
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
from backUnitTest.test_helpers import make_conn_and_cursor

from routes_problems import (
    CreateProblemRequest,
    EditProblemRequest,
    SectionIn,
    SuggestionIn,
    TestCaseIn as ProblemTestCaseIn,
    _build_problem,
    _generate_unique_access_code,
    _get_current_user,
    GradeSubmissionRequest,
    create_problem,
    delete_problem,
    edit_problem,
    get_problem_by_code,
    get_teacher_problems,
    grade_submission,
)


def test_get_current_user_missing_token():
    with pytest.raises(HTTPException) as exc:
        _get_current_user(None)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Missing or invalid token"


def test_get_current_user_invalid_token(monkeypatch):
    def _raise(_token):
        raise Exception("bad token")

    monkeypatch.setattr("routes_problems.decode_token", _raise)

    with pytest.raises(HTTPException) as exc:
        _get_current_user("Bearer abc")

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid or expired token"


def test_generate_unique_access_code_success(monkeypatch):
    cursor = MagicMock()
    cursor.fetchone.side_effect = [{"id": 1}, None]
    monkeypatch.setattr("routes_problems.random.randint", lambda _a, _b: 123456)

    code = _generate_unique_access_code(cursor)

    assert code == "123456"


def test_generate_unique_access_code_failure(monkeypatch):
    cursor = MagicMock()
    cursor.fetchone.return_value = {"id": 1}
    monkeypatch.setattr("routes_problems.random.randint", lambda _a, _b: 123456)

    with pytest.raises(HTTPException) as exc:
        _generate_unique_access_code(cursor)

    assert exc.value.status_code == 500
    assert exc.value.detail == "Could not generate unique access code"


def test_build_problem_handles_invalid_section_code_json_and_builds_submissions():
    cursor = MagicMock()
    cursor.fetchall.side_effect = [
        [{"id": 5, "order_index": 0, "label": "Step", "code": "not-json"}],
        [{"id": 8, "content": "hint", "is_correct": 1, "source": "ai"}],
        [{"id": 2, "input": "f(1)", "expected": "1", "explanation": "one"}],
        [
            {
                "id": 70,
                "student_name": "Sam",
                "submitted_at": "2026-04-24T12:00:00",
                "score": 8,
                "total": 10,
                "code": "print(1)",
                "suggestion_log": "[]",
                "tab_switch_log": "[]",
                "test_results": "[]",
                "paste_log": "[]",
                "feedback": "Nice",
            }
        ],
    ]

    problem = {
        "id": 1,
        "access_code": "123456",
        "title": "T",
        "description": "D",
        "language": "python",
        "languages": '["python"]',
        "time_limit_seconds": 60,
        "max_attempts": 3,
        "allow_copy_paste": 1,
        "track_tab_switching": 0,
    }

    built = _build_problem(cursor, problem)

    assert built["sections"][0]["code"] == {"python": "not-json"}
    assert built["sections"][0]["suggestions"][0]["is_correct"] is True
    assert built["submissions"][0]["grade"] == 80
    assert built["allow_copy_paste"] is True
    assert built["track_tab_switching"] is False


def test_create_problem_forbidden_for_student(monkeypatch):
    req = CreateProblemRequest(
        title="T",
        description="D",
        languages=["python"],
        boilerplate={"python": ""},
        sections=[],
        testCases=[],
    )
    monkeypatch.setattr("routes_problems._get_current_user", lambda _auth: {"role": "student", "user_id": 1})

    with pytest.raises(HTTPException) as exc:
        create_problem(req, authorization="Bearer token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "Only teachers can create problems"


def test_create_problem_inserts_sections_suggestions_and_testcases(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.side_effect = [{"id": 101}, {"id": 301}, {"id": 101}]

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr("routes_problems._get_current_user", lambda _auth: {"role": "teacher", "user_id": 9})
    monkeypatch.setattr("routes_problems._generate_unique_access_code", lambda _cursor: "123456")
    monkeypatch.setattr("routes_problems._build_problem", lambda _cursor, _problem: {"id": 101})

    req = CreateProblemRequest(
        title="Title",
        description="Desc",
        languages=["python"],
        boilerplate={"python": ""},
        sections=[
            SectionIn(
                order=0,
                label="L0",
                code={"python": "def x(): pass"},
                suggestions=[
                    SuggestionIn(type="manual", isCorrect=False, content="   "),
                    SuggestionIn(type="ai", isCorrect=True, content="return 1"),
                ],
            )
        ],
        testCases=[ProblemTestCaseIn(input="x()", expected="1", explanation="basic")],
    )

    result = create_problem(req, authorization="Bearer token")

    assert result == {"id": 101}
    conn.commit.assert_called_once()
    suggestion_insert_calls = [
        c for c in cursor.execute.call_args_list if "INSERT INTO suggestions" in c.args[0]
    ]
    test_case_calls = [
        c for c in cursor.execute.call_args_list if "INSERT INTO test_cases" in c.args[0]
    ]
    assert len(suggestion_insert_calls) == 1
    assert len(test_case_calls) == 1


def test_create_problem_rolls_back_on_exception(monkeypatch):
    conn, cursor = make_conn_and_cursor()

    def _boom(*_args, **_kwargs):
        raise RuntimeError("db failed")

    cursor.execute.side_effect = _boom
    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr("routes_problems._get_current_user", lambda _auth: {"role": "teacher", "user_id": 9})
    monkeypatch.setattr("routes_problems._generate_unique_access_code", lambda _cursor: "123456")

    req = CreateProblemRequest(
        title="Title",
        description="Desc",
        languages=["python"],
        boilerplate={"python": ""},
        sections=[],
        testCases=[],
    )

    with pytest.raises(RuntimeError):
        create_problem(req, authorization="Bearer token")

    conn.rollback.assert_called_once()
    conn.close.assert_called_once()


def test_get_teacher_problems_forbidden_student(monkeypatch):
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "student"},
    )

    with pytest.raises(HTTPException) as exc:
        get_teacher_problems(authorization="Bearer token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "Only teachers can access this endpoint"


def test_get_teacher_problems_success(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchall.return_value = [{"id": 10}, {"id": 11}]

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 8, "role": "teacher"},
    )
    monkeypatch.setattr(
        "routes_problems._build_problem",
        lambda _cursor, p: {"id": p["id"]},
    )

    result = get_teacher_problems(authorization="Bearer token")

    assert result == [{"id": 10}, {"id": 11}]


def test_edit_problem_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 8, "role": "teacher"},
    )

    with pytest.raises(HTTPException) as exc:
        edit_problem(99, req={}, authorization="Bearer token")

    assert exc.value.status_code == 404
    assert exc.value.detail == "Problem not found"


def test_edit_problem_teacher_cannot_edit_other_teacher(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {"id": 10, "teacher_id": 2}

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "teacher"},
    )

    with pytest.raises(HTTPException) as exc:
        edit_problem(10, req={}, authorization="Bearer token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "You can only edit your own problems"


def test_edit_problem_forbidden_for_student(monkeypatch):
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "student"},
    )

    with pytest.raises(HTTPException) as exc:
        edit_problem(10, req=EditProblemRequest(), authorization="Bearer token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "Only teachers can edit problems"


def test_edit_problem_updates_all_supported_fields(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.side_effect = [
        {"id": 10, "teacher_id": 1},
        {"id": 10, "teacher_id": 1},
    ]

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr("routes_problems._get_current_user", lambda _auth: {"user_id": 1, "role": "teacher"})
    monkeypatch.setattr("routes_problems._build_problem", lambda _cursor, _problem: {"id": 10})

    req = EditProblemRequest(
        title="New",
        description="New desc",
        timeLimitSeconds=99,
        maxSubmissions=5,
        allowCopyPaste=False,
        trackTabSwitching=True,
    )

    result = edit_problem(10, req=req, authorization="Bearer token")

    assert result == {"id": 10}
    update_calls = [c for c in cursor.execute.call_args_list if c.args[0].startswith("UPDATE problems SET")]
    assert update_calls
    sql = update_calls[0].args[0]
    assert "title = %s" in sql
    assert "description = %s" in sql
    assert "time_limit_seconds = %s" in sql
    assert "max_attempts = %s" in sql
    assert "allow_copy_paste = %s" in sql
    assert "track_tab_switching = %s" in sql


def test_delete_problem_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 8, "role": "teacher"},
    )

    with pytest.raises(HTTPException) as exc:
        delete_problem(123, authorization="Bearer token")

    assert exc.value.status_code == 404
    assert exc.value.detail == "Problem not found"


def test_delete_problem_teacher_cannot_delete_other_teacher(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {"teacher_id": 2}

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "teacher"},
    )

    with pytest.raises(HTTPException) as exc:
        delete_problem(10, authorization="Bearer token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "You can only delete your own problems"


def test_delete_problem_admin_success(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {"teacher_id": 2}

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "admin"},
    )

    result = delete_problem(10, authorization="Bearer token")

    assert result is None
    cursor.execute.assert_any_call("DELETE FROM problems WHERE id = %s", (10,))
    conn.commit.assert_called_once()


def test_delete_problem_forbidden_for_student(monkeypatch):
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "student"},
    )

    with pytest.raises(HTTPException) as exc:
        delete_problem(10, authorization="Bearer token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "Only teachers can delete problems"


def test_grade_submission_invalid_range(monkeypatch):
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "teacher"},
    )

    with pytest.raises(HTTPException) as exc:
        grade_submission(10, GradeSubmissionRequest(session_id=1, grade=101), authorization="Bearer token")

    assert exc.value.status_code == 400
    assert exc.value.detail == "Grade must be between 0 and 100"


def test_grade_submission_problem_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "teacher"},
    )

    with pytest.raises(HTTPException) as exc:
        grade_submission(10, GradeSubmissionRequest(session_id=1, grade=90), authorization="Bearer token")

    assert exc.value.status_code == 404
    assert exc.value.detail == "Problem not found"


def test_grade_submission_teacher_cannot_grade_other_teacher(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {"teacher_id": 2}

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "teacher"},
    )

    with pytest.raises(HTTPException) as exc:
        grade_submission(10, GradeSubmissionRequest(session_id=1, grade=90), authorization="Bearer token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "You can only grade your own problems"


def test_grade_submission_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.side_effect = [{"teacher_id": 1}, None]

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "teacher"},
    )

    with pytest.raises(HTTPException) as exc:
        grade_submission(10, GradeSubmissionRequest(session_id=777, grade=90), authorization="Bearer token")

    assert exc.value.status_code == 404
    assert exc.value.detail == "Submission not found"


def test_grade_submission_success(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.side_effect = [{"teacher_id": 1}, {"id": 40}]

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "teacher"},
    )

    result = grade_submission(10, GradeSubmissionRequest(session_id=40, grade=95), authorization="Bearer token")

    assert result == {"session_id": 40, "grade": 95}
    cursor.execute.assert_any_call(
        "UPDATE sessions SET score = %s, total = 100 WHERE id = %s",
        (95, 40),
    )
    conn.commit.assert_called_once()


def test_grade_submission_forbidden_for_student(monkeypatch):
    monkeypatch.setattr(
        "routes_problems._get_current_user",
        lambda _auth: {"user_id": 1, "role": "student"},
    )

    with pytest.raises(HTTPException) as exc:
        grade_submission(10, GradeSubmissionRequest(session_id=1, grade=90), authorization="Bearer token")

    assert exc.value.status_code == 403
    assert exc.value.detail == "Only teachers can grade submissions"


def test_get_problem_by_code_not_found(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = None

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)

    with pytest.raises(HTTPException) as exc:
        get_problem_by_code("123456")

    assert exc.value.status_code == 404
    assert exc.value.detail == "Problem not found"


def test_get_problem_by_code_success(monkeypatch):
    conn, cursor = make_conn_and_cursor()
    cursor.fetchone.return_value = {"id": 88}

    monkeypatch.setattr("routes_problems.get_connection", lambda: conn)
    monkeypatch.setattr(
        "routes_problems._build_problem",
        lambda _cursor, _problem: {"id": 88, "access_code": "123456"},
    )

    result = get_problem_by_code("123456")

    assert result == {"id": 88, "access_code": "123456"}
