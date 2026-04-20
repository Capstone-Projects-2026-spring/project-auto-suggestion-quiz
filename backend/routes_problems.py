import json
import random
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from database import get_connection
from auth import decode_token

router = APIRouter(prefix="/problems", tags=["problems"])


# ── Request Models ─────────────────────────────────────────────────────────────

class SuggestionIn(BaseModel):
    type: str
    isCorrect: bool
    content: str = ""


class SectionIn(BaseModel):
    order: int
    label: str
    code: Dict[str, Any]
    suggestions: List[SuggestionIn] = []


class TestCaseIn(BaseModel):
    input: str = ""
    expected: str = ""
    explanation: str = ""


class CreateProblemRequest(BaseModel):
    title: str
    description: str
    languages: List[str]
    boilerplate: Dict[str, str]
    sections: List[SectionIn]
    testCases: List[TestCaseIn] = []
    timeLimitSeconds: Optional[int] = None
    maxSubmissions: Optional[int] = None
    allowCopyPaste: bool = True
    trackTabSwitching: bool = False


class EditProblemRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    timeLimitSeconds: Optional[int] = None
    maxSubmissions: Optional[int] = None
    allowCopyPaste: Optional[bool] = None
    trackTabSwitching: Optional[bool] = None


class GradeSubmissionRequest(BaseModel):
    session_id: int
    grade: int  # 0-100


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_current_user(authorization: Optional[str]):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization[len("Bearer "):]
    try:
        return decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def _generate_unique_access_code(cursor) -> str:
    for _ in range(10):
        code = str(random.randint(100000, 999999))
        cursor.execute("SELECT id FROM problems WHERE access_code = %s", (code,))
        if not cursor.fetchone():
            return code
    raise HTTPException(status_code=500, detail="Could not generate unique access code")


def _build_problem(cursor, problem) -> dict:
    """Build full problem dict with sections, suggestions, test cases, and submissions."""
    cursor.execute(
        "SELECT * FROM sections WHERE problem_id = %s ORDER BY order_index",
        (problem["id"],),
    )
    section_rows = cursor.fetchall()

    sections = []
    for s in section_rows:
        cursor.execute("SELECT * FROM suggestions WHERE section_id = %s", (s["id"],))
        suggestion_rows = cursor.fetchall()

        try:
            code_dict = json.loads(s["code"])
        except (TypeError, ValueError):
            code_dict = {problem["language"]: s["code"]}

        sections.append({
            "id": s["id"],
            "order_index": s["order_index"],
            "label": s["label"],
            "code": code_dict,
            "suggestions": [
                {
                    "id": sg["id"],
                    "content": sg["content"],
                    "is_correct": bool(sg["is_correct"]),
                    "source": sg["source"],
                }
                for sg in suggestion_rows
            ],
        })

    # Test cases
    cursor.execute(
        "SELECT * FROM test_cases WHERE problem_id = %s ORDER BY id",
        (problem["id"],),
    )
    test_case_rows = cursor.fetchall()
    test_cases = [
        {
            "id": tc["id"],
            "input": tc["input"],
            "expected": tc["expected"],
            "explanation": tc["explanation"],
        }
        for tc in test_case_rows
    ]

    # Submissions
    cursor.execute(
        """SELECT id, student_name, submitted_at, score, total, code,
                  suggestion_log, tab_switch_log, test_results, paste_log, feedback
           FROM sessions
           WHERE problem_id = %s AND submitted_at IS NOT NULL
           ORDER BY submitted_at DESC""",
        (problem["id"],),
    )
    session_rows = cursor.fetchall()
    submissions = [
        {
            "session_id": row["id"],
            "student_name": row["student_name"],
            "submitted_at": row["submitted_at"],
            "score": row["score"],
            "total": row["total"],
            "code": row["code"],
            "suggestion_log": row["suggestion_log"],
            "tab_switch_log": row["tab_switch_log"],
            "test_results": row["test_results"],
            "paste_log": row["paste_log"],
            "feedback": row["feedback"],
            "grade": round((row["score"] / row["total"]) * 100) if row["total"] else None,
        }
        for row in session_rows
    ]

    return {
        "id": problem["id"],
        "access_code": problem["access_code"],
        "title": problem["title"],
        "description": problem["description"],
        "language": problem["language"],
        "languages": json.loads(problem["languages"]),
        "sections": sections,
        "test_cases": test_cases,
        "submissions": submissions,
        "time_limit_seconds": problem["time_limit_seconds"],
        "max_attempts": problem["max_attempts"],
        "allow_copy_paste": bool(problem["allow_copy_paste"]),
        "track_tab_switching": bool(problem["track_tab_switching"]),
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/")
def get_teacher_problems(
        authorization: Optional[str] = Header(default=None),
):
    """Get all problems created by the authenticated teacher."""
    user = _get_current_user(authorization)
    if user.get("role") not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM problems WHERE teacher_id = %s ORDER BY created_at DESC",
        (user["user_id"],),
    )
    problems = cursor.fetchall()
    result = [_build_problem(cursor, p) for p in problems]
    conn.close()
    return result


@router.post("/")
def create_problem(
        req: CreateProblemRequest,
        authorization: Optional[str] = Header(default=None),
):
    """Create a new problem. Returns the full problem object."""
    user = _get_current_user(authorization)
    if user.get("role") not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers can create problems")

    primary_language = req.languages[0] if req.languages else "python"

    conn = get_connection()
    cursor = conn.cursor()
    try:
        access_code = _generate_unique_access_code(cursor)

        cursor.execute(
            """INSERT INTO problems
               (teacher_id, access_code, title, description, language, languages,
                time_limit_seconds, max_attempts, allow_copy_paste, track_tab_switching)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               RETURNING id""",
            (
                user["user_id"],
                access_code,
                req.title,
                req.description,
                primary_language,
                json.dumps(req.languages),
                req.timeLimitSeconds,
                req.maxSubmissions,
                req.allowCopyPaste,
                req.trackTabSwitching,
            ),
        )
        problem_id = cursor.fetchone()["id"]

        for section in sorted(req.sections, key=lambda s: s.order):
            cursor.execute(
                """INSERT INTO sections (problem_id, order_index, label, code)
                   VALUES (%s, %s, %s, %s)
                   RETURNING id""",
                (problem_id, section.order, section.label, json.dumps(section.code)),
            )
            section_id = cursor.fetchone()["id"]

            for sg in section.suggestions:
                if sg.type == "manual" and not sg.content.strip():
                    continue
                cursor.execute(
                    """INSERT INTO suggestions (section_id, content, is_correct, source)
                       VALUES (%s, %s, %s, %s)""",
                    (section_id, sg.content, sg.isCorrect, sg.type),
                )

        for tc in req.testCases:
            cursor.execute(
                """INSERT INTO test_cases (problem_id, input, expected, explanation)
                   VALUES (%s, %s, %s, %s)""",
                (problem_id, tc.input, tc.expected, tc.explanation),
            )

        conn.commit()
        cursor.execute("SELECT * FROM problems WHERE id = %s", (problem_id,))
        new_problem = cursor.fetchone()
        result = _build_problem(cursor, new_problem)
    except Exception:
        conn.rollback()
        conn.close()
        raise
    conn.close()
    return result


@router.patch("/{problem_id}")
def edit_problem(
        problem_id: int,
        req: EditProblemRequest,
        authorization: Optional[str] = Header(default=None),
):
    """Edit a problem's title, description, and settings."""
    user = _get_current_user(authorization)
    if user.get("role") not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers can edit problems")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM problems WHERE id = %s", (problem_id,))
    problem = cursor.fetchone()
    if not problem:
        conn.close()
        raise HTTPException(status_code=404, detail="Problem not found")

    if user.get("role") == "teacher" and problem["teacher_id"] != user["user_id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="You can only edit your own problems")

    fields = []
    values = []

    if req.title is not None:
        fields.append("title = %s")
        values.append(req.title)
    if req.description is not None:
        fields.append("description = %s")
        values.append(req.description)
    if req.timeLimitSeconds is not None:
        fields.append("time_limit_seconds = %s")
        values.append(req.timeLimitSeconds)
    if req.maxSubmissions is not None:
        fields.append("max_attempts = %s")
        values.append(req.maxSubmissions)
    if req.allowCopyPaste is not None:
        fields.append("allow_copy_paste = %s")
        values.append(req.allowCopyPaste)
    if req.trackTabSwitching is not None:
        fields.append("track_tab_switching = %s")
        values.append(req.trackTabSwitching)

    if fields:
        values.append(problem_id)
        cursor.execute(
            f"UPDATE problems SET {', '.join(fields)} WHERE id = %s",
            values,
        )
        conn.commit()

    cursor.execute("SELECT * FROM problems WHERE id = %s", (problem_id,))
    updated = cursor.fetchone()
    result = _build_problem(cursor, updated)
    conn.close()
    return result


@router.delete("/{problem_id}", status_code=204)
def delete_problem(
        problem_id: int,
        authorization: Optional[str] = Header(default=None),
):
    """Delete a problem. Cascades to sections, suggestions, sessions, and logs."""
    user = _get_current_user(authorization)
    if user.get("role") not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers can delete problems")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT teacher_id FROM problems WHERE id = %s", (problem_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Problem not found")

    if user.get("role") == "teacher" and row["teacher_id"] != user["user_id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="You can only delete your own problems")

    cursor.execute("DELETE FROM problems WHERE id = %s", (problem_id,))
    conn.commit()
    conn.close()


@router.post("/{problem_id}/grade")
def grade_submission(
        problem_id: int,
        req: GradeSubmissionRequest,
        authorization: Optional[str] = Header(default=None),
):
    """Manually grade a student submission."""
    user = _get_current_user(authorization)
    if user.get("role") not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Only teachers can grade submissions")

    if not 0 <= req.grade <= 100:
        raise HTTPException(status_code=400, detail="Grade must be between 0 and 100")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT teacher_id FROM problems WHERE id = %s", (problem_id,))
    problem = cursor.fetchone()
    if not problem:
        conn.close()
        raise HTTPException(status_code=404, detail="Problem not found")

    if user.get("role") == "teacher" and problem["teacher_id"] != user["user_id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="You can only grade your own problems")

    cursor.execute(
        "SELECT id FROM sessions WHERE id = %s AND problem_id = %s",
        (req.session_id, problem_id),
    )
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Submission not found")

    cursor.execute(
        "UPDATE sessions SET score = %s, total = 100 WHERE id = %s",
        (req.grade, req.session_id),
    )
    conn.commit()
    conn.close()
    return {"session_id": req.session_id, "grade": req.grade}


@router.get("/access/{code}")
def get_problem_by_code(code: str):
    """Look up a problem by its 6-digit access code."""
    if not code.isdigit() or len(code) != 6:
        raise HTTPException(status_code=400, detail="Access code must be a 6-digit number")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM problems WHERE access_code = %s", (code,))
    problem = cursor.fetchone()
    if not problem:
        conn.close()
        raise HTTPException(status_code=404, detail="Problem not found")

    result = _build_problem(cursor, problem)
    conn.close()
    return result
