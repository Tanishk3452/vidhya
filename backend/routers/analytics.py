"""
NeuroLearn AI — Analytics Router
Returns dynamic performance metrics, chart data, and weak topic analysis.
"""
import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Query
from models.schemas import (
    AnalyticsSummary, AccuracyTrendPoint, TopicBreakdown,
    RecordAttemptRequest
)
from models.db import get_user_attempts, get_user_by_id, record_attempt

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _compute_summary(attempts: list, user_id: str) -> AnalyticsSummary:
    # Get real user data for XP and streak
    user = get_user_by_id(user_id) or {}

    if not attempts:
        return AnalyticsSummary(
            total_questions=0, correct_answers=0, accuracy_percent=0.0,
            avg_speed_seconds=0, consistency_score=0.0, study_streak=0,
            total_xp=0, rank_estimate=1500000,
        )

    total   = len(attempts)
    correct = sum(1 for a in attempts if a.get("correct"))
    accuracy  = round((correct / total) * 100, 1) if total else 0.0
    avg_speed = round(sum(a.get("time_taken_seconds", 90) for a in attempts) / total) if total else 0

    # XP from user record (real), fallback to computing from attempts
    real_xp    = user.get("xp", sum(20 for a in attempts if a.get("correct")))
    real_streak = user.get("streak", 0)

    return AnalyticsSummary(
        total_questions=total,
        correct_answers=correct,
        accuracy_percent=accuracy,
        avg_speed_seconds=avg_speed,
        consistency_score=round(min(10.0, (correct / total) * 10), 1) if total else 0.0,
        study_streak=real_streak,
        total_xp=real_xp,
        rank_estimate=max(200, int(500000 * ((100 - accuracy) / 100) ** 2)),
    )


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary(user_id: str = Query("demo-user-001")):
    attempts = get_user_attempts(user_id)
    return _compute_summary(attempts, user_id)


@router.get("/accuracy-trend", response_model=List[AccuracyTrendPoint])
async def get_accuracy_trend(user_id: str = Query("demo-user-001"), weeks: int = Query(8)):
    attempts = get_user_attempts(user_id)
    if not attempts:
        return []

    sorted_att = sorted(attempts, key=lambda x: x.get("timestamp", ""))
    chunk_size = max(1, len(sorted_att) // weeks)
    chunks = [sorted_att[i:i + chunk_size] for i in range(0, len(sorted_att), chunk_size)][:weeks]

    return [
        AccuracyTrendPoint(
            label=f"Block {i+1}",
            accuracy=int(sum(1 for a in chunk if a.get("correct")) / len(chunk) * 100),
            questions=len(chunk)
        )
        for i, chunk in enumerate(chunks) if chunk
    ]


@router.get("/topic-breakdown", response_model=List[TopicBreakdown])
async def get_topic_breakdown(user_id: str = Query("demo-user-001")):
    attempts = get_user_attempts(user_id)
    topics_stats = {}

    for a in attempts:
        t = a.get("topic", "Unknown")
        if t not in topics_stats:
            topics_stats[t] = {"subject": a.get("subject", "General"), "total": 0, "correct": 0}
        topics_stats[t]["total"] += 1
        if a.get("correct"):
            topics_stats[t]["correct"] += 1

    return [
        TopicBreakdown(
            topic=t,
            subject=s["subject"],
            score_percent=round((s["correct"] / s["total"]) * 100, 1) if s["total"] else 0,
            questions_attempted=s["total"],
            correct=s["correct"],
        )
        for t, s in topics_stats.items()
    ]


@router.get("/speed-trend")
async def get_speed_trend(user_id: str = Query("demo-user-001")):
    attempts = get_user_attempts(user_id)
    if not attempts:
        return []

    sorted_att = sorted(attempts, key=lambda x: x.get("timestamp", ""))
    chunk_size = max(1, len(sorted_att) // 7)
    chunks = [sorted_att[i:i + chunk_size] for i in range(0, len(sorted_att), chunk_size)][:7]
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    return [
        {"label": days[i] if i < len(days) else f"Day {i}", "speed": int(sum(a.get("time_taken_seconds", 90) for a in chunk) / len(chunk))}
        for i, chunk in enumerate(chunks) if chunk
    ]


@router.get("/radar")
async def get_radar(user_id: str = Query("demo-user-001")):
    attempts = get_user_attempts(user_id)
    labels = ["Physics", "Chemistry", "Mathematics", "Speed", "Accuracy", "Consistency"]

    if not attempts:
        return {"labels": labels, "student": [0] * 6, "topper": [88, 85, 90, 85, 92, 88]}

    subj_acc = {"Physics": 0, "Chemistry": 0, "Mathematics": 0}
    for subj in subj_acc:
        subj_atts = [a for a in attempts if a.get("subject", "").lower() == subj.lower()]
        if subj_atts:
            subj_acc[subj] = int(sum(1 for a in subj_atts if a.get("correct")) / len(subj_atts) * 100)

    overall_acc = int(sum(1 for a in attempts if a.get("correct")) / len(attempts) * 100)
    avg_speed   = sum(a.get("time_taken_seconds", 90) for a in attempts) / len(attempts)
    speed_score = max(0, min(100, int(100 - ((avg_speed - 30) / 1.2))))

    return {
        "labels": labels,
        "student": [subj_acc["Physics"], subj_acc["Chemistry"], subj_acc["Mathematics"], speed_score, overall_acc, min(100, overall_acc + 5)],
        "topper":  [88, 85, 90, 85, 92, 88],
    }


@router.get("/weak-areas")
async def get_weak_areas(user_id: str = Query("demo-user-001")):
    attempts = get_user_attempts(user_id)
    if not attempts:
        return []

    topics_stats = {}
    for a in attempts:
        t = a.get("topic", "Unknown")
        if t not in topics_stats:
            topics_stats[t] = {"subject": a.get("subject", "General"), "total": 0, "correct": 0}
        topics_stats[t]["total"] += 1
        if a.get("correct"):
            topics_stats[t]["correct"] += 1

    weak_areas = []
    for t, s in topics_stats.items():
        if s["total"] >= 3:
            acc = int((s["correct"] / s["total"]) * 100)
            priority = "High" if acc < 50 else "Medium" if acc < 70 else "Low"
            weak_areas.append({"topic": t, "subject": s["subject"], "score": acc, "priority": priority})

    weak_areas.sort(key=lambda x: x["score"])
    return weak_areas[:5]


@router.post("/record")
async def record_question_attempt(body: RecordAttemptRequest):
    attempt = {
        "id": str(uuid.uuid4()),
        "user_id": body.user_id or "demo-user-001",
        "question_id": body.question_id,
        "subject": body.subject,
        "topic": body.topic,
        "correct": body.correct,
        "time_taken_seconds": body.time_taken_seconds,
        "timestamp": datetime.utcnow().isoformat(),
    }
    record_attempt(attempt)
    return {"status": "recorded", "attempt_id": attempt["id"]}