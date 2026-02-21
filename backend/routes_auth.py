from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_connection
from auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(req: RegisterRequest):
    """
    Register a new user.

    - **name**: Full name of the user
    - **email**: Must be unique
    - **password**: Will be hashed before storage
    - **role**: Must be one of `student`, `teacher`, `admin`
    """
    if req.role not in ("student", "teacher", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(req.password)
    cursor.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        (req.name, req.email, hashed, req.role),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    token = create_token(user_id, req.email, req.role)
    return {"token": token, "user": {"id": user_id, "name": req.name, "email": req.email, "role": req.role}}


@router.post("/login")
def login(req: LoginRequest):
    """
    Authenticate a user and return a JWT token.

    - **email**: Registered email address
    - **password**: Plain text password to verify against stored hash
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, email, password, role FROM users WHERE email = ?", (req.email,))
    row = cursor.fetchone()
    conn.close()

    if not row or not verify_password(req.password, row["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(row["id"], row["email"], row["role"])
    return {"token": token, "user": {"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"]}}