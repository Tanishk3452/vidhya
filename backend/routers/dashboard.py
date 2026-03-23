"""
NeuroLearn AI — Dashboard Router
Returns all real user data needed for the dashboard.
"""
from fastapi import APIRouter, Depends, Query
from models.db import get_user_by_id, get_user_attempts, get_study_plan
from routers.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def get_dashboard_summary(user_id: str = Query("demo-user-001")):
    user = get_user_by_id(user_id)
    if not user:
        return {"error": "User not found"}

    attempts = get_user_attempts(user_id)
    total = len(attempts)
    correct = sum(1 for a in attempts if a.get("correct"))
    accuracy = round((correct / total) * 100, 1) if total else 0

    # Subject breakdown
    subjects = {}
    for a in attempts:
        s = a.get("subject", "General")
        if s not in subjects:
            subjects[s] = {"total": 0, "correct": 0}
        subjects[s]["total"] += 1
        if a.get("correct"):
            subjects[s]["correct"] += 1

    subject_stats = [
        {
            "subject": s,
            "accuracy": round((v["correct"] / v["total"]) * 100, 1) if v["total"] else 0,
            "attempted": v["total"]
        }
        for s, v in subjects.items()
    ]

    # Recent activity (last 5 attempts)
    recent = sorted(attempts, key=lambda x: x.get("timestamp", ""), reverse=True)[:5]

    # Current study plan
    plan = get_study_plan(user_id)
    today_slots = []
    if plan and plan.get("plan"):
        from datetime import datetime
        today_name = datetime.utcnow().strftime("%A")
        today_plan = next((d for d in plan["plan"] if d.get("day") == today_name), None)
        if today_plan:
            today_slots = today_plan.get("slots", [])

    return {
        "user": {
            "id": user.get("id"),
            "name": user.get("name"),
            "email": user.get("email"),
            "exam": user.get("exam"),
            "xp": user.get("xp", 0),
            "streak": user.get("streak", 0),
            "level": user.get("level", 1),
        },
        "stats": {
            "total_questions": total,
            "correct_answers": correct,
            "accuracy_percent": accuracy,
            "total_xp": user.get("xp", 0),
            "streak": user.get("streak", 0),
            "level": user.get("level", 1),
        },
        "subject_stats": subject_stats,
        "recent_activity": [
            {
                "subject": a.get("subject"),
                "topic": a.get("topic"),
                "correct": a.get("correct"),
                "timestamp": a.get("timestamp"),
            }
            for a in recent
        ],
        "today_schedule": today_slots,
        "exam": user.get("exam", "JEE Advanced"),
    }