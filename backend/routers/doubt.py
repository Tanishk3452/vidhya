"""
NeuroLearn AI — Doubt Solver Router
Accepts student questions and returns step-by-step AI solutions.
"""
from fastapi import APIRouter, UploadFile, File
from models.schemas import DoubtRequest, DoubtResponse
from services.ai_service import ai_service

router = APIRouter(prefix="/api/doubt", tags=["Doubt Solver"])


@router.post("/solve", response_model=DoubtResponse)
async def solve_doubt(body: DoubtRequest):
    """
    Solve a student's doubt with step-by-step explanation.
    Uses Gemini when API key is set; rich fallback otherwise.
    """
    result = ai_service.solve_doubt(
        question=body.question,
        subject=body.subject,
    )
    return DoubtResponse(**result)


@router.post("/solve-image")
async def solve_image(file: UploadFile = File(...)):
    """
    Solve a doubt from an uploaded image using Gemini Vision.
    Accepts JPG, PNG, WEBP images of questions/problems.
    """
    file_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"
    result = ai_service.solve_image_doubt(file_bytes, mime_type)
    return result


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