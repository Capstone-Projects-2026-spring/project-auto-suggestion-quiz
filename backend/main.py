from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes_auth import router as auth_router
from routes_ai import router as ai_router
from routes_problems import router as problems_router

app = FastAPI(
    title="AutoSuggestion Quiz API",
    description="Backend API for the AutoSuggestion Quiz application.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(problems_router)

@app.on_event("startup")
def startup():
    """
    Run on application startup.

    Initializes the SQLite database schema if it does not already exist.
    """
    init_db()


@app.get("/")
def root():
    """
    Health check endpoint.

    :return: A JSON object confirming the API is running.
    """
    return {"status": "ok", "message": "AutoSuggestion Quiz API is running"}