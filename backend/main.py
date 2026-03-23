"""
NeuroLearn AI — FastAPI Main Application Entry Point
Run with: uvicorn main:app --reload --port 8000
"""

from dotenv import load_dotenv
load_dotenv()
import os
from contextlib import asynccontextmanager



from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from routers.dashboard import router as dashboard_router
from routers.auth import router as auth_router
from routers.study_plan import router as study_plan_router
from routers.doubt import router as doubt_router
from routers.questions import router as questions_router
from routers.analytics import router as analytics_router
from routers.rank import router as rank_router
from routers.youtube import router as youtube_router




@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    
    print("\n" + "═" * 55)
    print("  🧠 NeuroLearn AI Backend — Started Successfully!")
    print("═" * 55)
    print("  📍 API URL   : http://localhost:8000")
    print("  📖 Swagger   : http://localhost:8000/docs")
    print("  📄 ReDoc     : http://localhost:8000/redoc")

    print("═" * 55 + "\n")
    yield
    # Shutdown
    print("NeuroLearn AI Backend — Shutting down.")


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="NeuroLearn AI API",
    description=(
        "Backend API for NeuroLearn AI — an adaptive learning companion for JEE, NEET & UPSC. "
        "Provides AI study plans, doubt solving, adaptive questions, performance analytics, and rank prediction."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternative React port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",                       # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(study_plan_router)
app.include_router(doubt_router)
app.include_router(questions_router)
app.include_router(analytics_router)
app.include_router(rank_router)
app.include_router(youtube_router)


# ─── Root & Health ───────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "NeuroLearn AI backend is running",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "study_plan": "/api/study-plan",
            "doubt_solver": "/api/doubt",
            "questions": "/api/questions",
            "analytics": "/api/analytics",
            "rank": "/api/rank",
        }
    }

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "service": "NeuroLearn AI"}
