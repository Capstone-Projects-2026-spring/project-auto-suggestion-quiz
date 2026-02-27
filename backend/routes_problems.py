from fastapi import APIRouter, HTTPException, Header
from database import get_connection
from auth import decode_token

router = APIRouter(prefix="/problems", tags=["problems"])


def get_user(token_header):
    if not token_header:
        raise HTTPException(status_code=401, detail="Missing token")

    token = token_header.replace("Bearer ", "")
    return decode_token(token)


@router.post("/")
def create_problem(problem: dict, authorization: str = Header(None)):
    user = get_user(authorization)

    if user["role"] not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Teacher access required")

    if "description" not in problem:
        raise HTTPException(status_code=400, detail="Missing description")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO problems (teacher_id, description, language, boilerplate)
        VALUES (?, ?, ?, ?)
        """,
        (
            user["user_id"],
            problem["description"],
            problem.get("language", "python"),
            problem.get("boilerplate", ""),
        ),
    )

    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return {"message": "Problem created", "problem_id": new_id}


@router.get("/")
def get_problems():
    conn = get_connection()
    cursor = conn.cursor()

    rows = cursor.execute("SELECT * FROM problems ORDER BY id DESC").fetchall()
    conn.close()

    return [dict(row) for row in rows]