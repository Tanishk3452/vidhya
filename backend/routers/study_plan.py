"""
NeuroLearn AI — Study Plan Router
Generates personalized 7-day study schedules using AI or curated fallback.
Tracks slot completion for dashboard progress.
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from models.schemas import StudyPlanRequest, StudyPlanResponse, StudyPlanHistoryResponse
from services.ai_service import ai_service
from models.db import (
    save_study_plan, get_study_plan, get_study_plans_history,
    record_attempt, get_user_by_id, update_user_xp
)
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/study-plan", tags=["Study Planner"])


class SlotCompleteRequest(BaseModel):
    user_id: str = "demo-user-001"
    day: str           # e.g. "Monday"
    slot_index: int    # index of the slot in that day's list
    subject: str
    topic: str
    completed: bool    # True = mark done, False = unmark


@router.get("", response_model=StudyPlanResponse)
async def fetch_user_plan(user_id: str = Query("demo-user-001")):
    """Fetch the student's existing personalized study plan."""
    plan_dict = get_study_plan(user_id)
    if plan_dict:
        return StudyPlanResponse(**plan_dict)
    return StudyPlanResponse(plan=[], title="No Active Plan", tips=[], time_allocation={})


@router.get("/history", response_model=StudyPlanHistoryResponse)
async def fetch_user_plan_history(user_id: str = Query("demo-user-001")):
    """Fetch the student's complete history of generated study plans."""
    history = get_study_plans_history(user_id)
    return StudyPlanHistoryResponse(history=history)


@router.post("/generate", response_model=StudyPlanResponse)
async def generate_plan(body: StudyPlanRequest, user_id: str = Query("demo-user-001")):
    """Generate a personalized 7-day study plan via AI."""
    result = ai_service.generate_study_plan(
        exam=body.exam,
        weak_subjects=body.weak_subjects,
        hours_per_day=body.hours_per_day,
        exam_date=body.exam_date,
    )

    title = f"7-Day {body.exam} Study Plan"
    tips = result.get("tips", [
        "Focus 40% of time on your weakest subject.",
        "Take a full mock test every Saturday.",
        "Revise using spaced repetition every 3rd day.",
        "Analyse all wrong answers before moving on.",
    ])
    alloc = result.get("time_allocation", {
        s: round(100 / max(1, len(body.weak_subjects)), 1)
        for s in (body.weak_subjects or ["Physics", "Chemistry", "Mathematics"])
    })

    # Add completed=False to every slot so frontend can track ticks
    plan_days = result.get("plan", [])
    for day in plan_days:
        for slot in day.get("slots", []):
            slot.setdefault("completed", False)

    response = StudyPlanResponse(
        id=str(uuid.uuid4()),
        created_at=datetime.utcnow().isoformat(),
        plan=plan_days,
        title=title,
        tips=tips,
        time_allocation=alloc,
        exam=body.exam,
        weak_subjects=body.weak_subjects,
    )

    save_study_plan(user_id, response.model_dump())
    return response


@router.post("/complete-slot")
async def complete_slot(body: SlotCompleteRequest):
    """
    Mark a study plan slot as completed or uncompleted.
    When completed=True, records an attempt in analytics so
    dashboard and analytics reflect the study session.
    """
    plan = get_study_plan(body.user_id)
    if not plan:
        return {"error": "No study plan found"}

    # Update the completed flag on the slot in the plan
    updated = False
    for day in plan.get("plan", []):
        if day.get("day") == body.day:
            slots = day.get("slots", [])
            if 0 <= body.slot_index < len(slots):
                slots[body.slot_index]["completed"] = body.completed
                updated = True
            break

    if updated:
        # Persist updated plan back to DB
        save_study_plan(body.user_id, plan)

    # When marking as complete, record it as a study attempt in analytics
    if body.completed and body.subject and body.topic:
        attempt = {
            "id": str(uuid.uuid4()),
            "user_id": body.user_id,
            "question_id": f"study-slot-{uuid.uuid4()}",
            "subject": body.subject,
            "topic": body.topic,
            "correct": True,       # study sessions count as positive engagement
            "time_taken_seconds": 90,
            "source": "study_plan", # tag so we can filter if needed
            "timestamp": datetime.utcnow().isoformat(),
        }
        record_attempt(attempt)

        # Award XP for completing a study slot
        update_user_xp(body.user_id, xp_delta=10)

    return {
        "success": True,
        "completed": body.completed,
        "xp_awarded": 10 if body.completed else 0
    }


@router.get("/today-progress")
async def get_today_progress(user_id: str = Query("demo-user-001")):
    """Returns today's slots and how many are completed."""
    plan = get_study_plan(user_id)
    if not plan or not plan.get("plan"):
        return {"slots": [], "completed": 0, "total": 0, "percent": 0}

    today_name = datetime.utcnow().strftime("%A")
    today_plan = next((d for d in plan["plan"] if d.get("day") == today_name), None)

    if not today_plan:
        return {"slots": [], "completed": 0, "total": 0, "percent": 0}

    slots = today_plan.get("slots", [])
    completed = sum(1 for s in slots if s.get("completed"))
    total = len(slots)
    percent = round((completed / total) * 100) if total else 0

    return {
        "slots": slots,
        "completed": completed,
        "total": total,
        "percent": percent,
        "day": today_name,
    }