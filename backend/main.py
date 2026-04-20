from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()

from routes_auth import router as auth_router
from routes_ai import router as ai_router
from routes_quiz import router as quiz_router
from routes_problems import router as problems_router
from routes_judge import router as code_router
from routes_submissions import router as submissions_router
from database import get_connection


def _run_migrations():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'problems'
                AND column_name IN ('time_limit_seconds', 'time_limit_minutes')
                """
            )
            cols = {r["column_name"] for r in cur.fetchall()}
            if "time_limit_seconds" not in cols and "time_limit_minutes" in cols:
                cur.execute(
                    "ALTER TABLE problems RENAME COLUMN time_limit_minutes TO time_limit_seconds"
                )
                cur.execute(
                    "UPDATE problems SET time_limit_seconds = time_limit_seconds * 60 WHERE time_limit_seconds IS NOT NULL"
                )
            elif "time_limit_seconds" not in cols:
                cur.execute(
                    "ALTER TABLE problems ADD COLUMN time_limit_seconds INTEGER"
                )
        conn.commit()


_run_migrations()

app = FastAPI(
    title="AutoSuggestion Quiz API",
    description="Backend API for the AutoSuggestion Quiz application.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://autosuggestions.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(quiz_router)
app.include_router(problems_router)
app.include_router(code_router)
app.include_router(submissions_router)


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "AutoSuggestion Quiz API is running"}
