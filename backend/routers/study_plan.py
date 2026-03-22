"""
NeuroLearn AI — Study Plan Router
Generates personalized 7-day study schedules using AI or curated fallback.
"""
from fastapi import APIRouter, Query
from models.schemas import StudyPlanRequest, StudyPlanResponse
from services.ai_service import ai_service
from models.db import save_study_plan, get_study_plan

router = APIRouter(prefix="/api/study-plan", tags=["Study Planner"])

@router.get("", response_model=StudyPlanResponse)
async def fetch_user_plan(user_id: str = Query("demo-user-001")):
    """Fetch the student's existing personalized study plan from MongoDB."""
    plan_dict = get_study_plan(user_id)
    if plan_dict:
        return StudyPlanResponse(**plan_dict)
    # Return empty structure if a new user has never generated a plan
    return StudyPlanResponse(plan=[], title="No Active Plan", tips=[], time_allocation={})



@router.post("/generate", response_model=StudyPlanResponse)
async def generate_plan(body: StudyPlanRequest, user_id: str = Query("demo-user-001")):
    """
    Generate a personalized 7-day study plan.
    Powered by OpenAI when API key is configured; curated fallback otherwise.
    """
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
        s: round(100/max(1, len(body.weak_subjects)), 1)
        for s in (body.weak_subjects or ["Physics", "Chemistry", "Mathematics"])
    })

    response = StudyPlanResponse(
        plan=result.get("plan", []),
        title=title,
        tips=tips,
        time_allocation=alloc,
    )
    
    # Save the generated plan to MongoDB for persistent access
    save_study_plan(user_id, response.model_dump())
    return response
