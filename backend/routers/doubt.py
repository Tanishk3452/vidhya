"""
NeuroLearn AI — Doubt Solver Router
Accepts student questions and returns step-by-step AI solutions.
"""
from fastapi import APIRouter
from models.schemas import DoubtRequest, DoubtResponse
from services.ai_service import ai_service

router = APIRouter(prefix="/api/doubt", tags=["Doubt Solver"])


@router.post("/solve", response_model=DoubtResponse)
async def solve_doubt(body: DoubtRequest):
    """
    Solve a student's doubt with step-by-step explanation.
    Uses OpenAI GPT-4o-mini when API key is set; rich fallback otherwise.
    """
    result = ai_service.solve_doubt(
        question=body.question,
        subject=body.subject,
    )
    return DoubtResponse(**result)


@router.get("/topics")
async def list_topics():
    """List popular doubt topics by subject."""
    return {
        "topics": {
            "Physics": [
                "Newton's Laws of Motion", "Rotational Mechanics",
                "Electrostatics & Gauss's Law", "Electromagnetic Induction",
                "Thermodynamics", "Wave Optics", "Modern Physics",
            ],
            "Chemistry": [
                "Organic Reaction Mechanisms", "Electrochemistry",
                "Chemical Equilibrium", "Coordination Compounds",
                "Hybridization & Bonding", "Physical Chemistry",
            ],
            "Mathematics": [
                "Integration Techniques", "Differential Equations",
                "Complex Numbers", "Probability & Statistics",
                "Coordinate Geometry", "Matrices & Determinants",
            ],
        }
    }
