"""
NeuroLearn AI — Pydantic Schemas
All request/response models for the API.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    exam: str = "JEE Advanced"

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    exam: str
    xp: int = 0
    streak: int = 0
    level: int = 1
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Study Plan ──────────────────────────────────────────────────────────────

class StudyPlanRequest(BaseModel):
    exam: str = "JEE Advanced"
    weak_subjects: List[str] = ["Physics", "Chemistry"]
    hours_per_day: float = 6.0
    exam_date: Optional[str] = None
    user_id: Optional[str] = None

class StudySlot(BaseModel):
    time: str
    subject: str
    topic: str
    duration: str
    type: str  # Study / Practice / Revision / Test / Rest

class DaySchedule(BaseModel):
    day: str
    slots: List[StudySlot]

class StudyPlanResponse(BaseModel):
    plan: List[DaySchedule]
    title: str
    tips: List[str]
    time_allocation: Dict[str, float]  # subject -> percentage


# ─── Doubt Solver ────────────────────────────────────────────────────────────

class DoubtRequest(BaseModel):
    question: str
    subject: Optional[str] = None
    context: Optional[str] = None

class DoubtResponse(BaseModel):
    answer: str
    subject: str
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    related_topics: List[str] = []
    solved_in_ms: int = 0


# ─── Questions ───────────────────────────────────────────────────────────────

class QuestionModel(BaseModel):
    id: str
    subject: str
    topic: str
    difficulty: str  # Easy / Medium / Hard
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    tags: List[str] = []
    xp_reward: int = 10

class SubmitAnswerRequest(BaseModel):
    question_id: str
    selected_index: int
    time_taken_seconds: int
    user_id: Optional[str] = None

class SubmitAnswerResponse(BaseModel):
    correct: bool
    correct_index: int
    explanation: str
    xp_earned: int
    new_difficulty: Optional[str] = None  # adaptive adjustment


# ─── Analytics ───────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    total_questions: int
    correct_answers: int
    accuracy_percent: float
    avg_speed_seconds: float
    consistency_score: float
    study_streak: int
    total_xp: int
    rank_estimate: int

class AccuracyTrendPoint(BaseModel):
    label: str
    accuracy: float
    questions: int

class TopicBreakdown(BaseModel):
    topic: str
    subject: str
    score_percent: float
    questions_attempted: int
    correct: int

class RecordAttemptRequest(BaseModel):
    user_id: Optional[str] = None
    question_id: str
    subject: str
    topic: str
    correct: bool
    time_taken_seconds: int


# ─── Rank Prediction ─────────────────────────────────────────────────────────

class RankPredictRequest(BaseModel):
    accuracy: float = Field(..., ge=0, le=100)
    speed: float = Field(..., ge=0, le=100)
    consistency: float = Field(..., ge=0, le=100)
    exam: str = "JEE Advanced"
    user_id: Optional[str] = None

class ImprovementTip(BaseModel):
    subject: str
    action: str
    impact: str
    rank_boost: int

class RankPredictResponse(BaseModel):
    predicted_rank: int
    best_case_rank: int
    worst_case_rank: int
    percentile: float
    college_prediction: str
    improvement_tips: List[ImprovementTip]
    composite_score: float


# ─── Leaderboard ─────────────────────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    school: str
    xp: int
    accuracy_percent: float
    streak: int
    avatar: str

class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    user_rank: Optional[int] = None
