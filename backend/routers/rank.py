"""
NeuroLearn AI — Rank Prediction Router
Predicts student rank using composite scoring and returns improvement tips.
"""
from fastapi import APIRouter, Query
from models.schemas import RankPredictRequest, RankPredictResponse, LeaderboardEntry, LeaderboardResponse
from services.rank_service import predict_rank

router = APIRouter(prefix="/api/rank", tags=["Rank Predictor"])

LEADERBOARD_DATA = [
    LeaderboardEntry(rank=1, name="Priya Sharma", school="Delhi", xp=12450, accuracy_percent=94.0, streak=42, avatar="P"),
    LeaderboardEntry(rank=2, name="Rahul Verma", school="Mumbai", xp=11820, accuracy_percent=91.0, streak=38, avatar="R"),
    LeaderboardEntry(rank=3, name="Ananya Singh", school="Bangalore", xp=10900, accuracy_percent=89.0, streak=31, avatar="A"),
    LeaderboardEntry(rank=4, name="Aryan Sharma", school="Jaipur", xp=10280, accuracy_percent=87.0, streak=14, avatar="A"),
    LeaderboardEntry(rank=5, name="Kiran Patel", school="Ahmedabad", xp=9750, accuracy_percent=85.0, streak=22, avatar="K"),
    LeaderboardEntry(rank=6, name="Meera Iyer", school="Chennai", xp=9200, accuracy_percent=83.0, streak=19, avatar="M"),
    LeaderboardEntry(rank=7, name="Vikram Nair", school="Kochi", xp=8900, accuracy_percent=82.0, streak=16, avatar="V"),
    LeaderboardEntry(rank=8, name="Sneha Roy", school="Kolkata", xp=8450, accuracy_percent=80.0, streak=12, avatar="S"),
    LeaderboardEntry(rank=9, name="Arnav Gupta", school="Lucknow", xp=7900, accuracy_percent=78.5, streak=9, avatar="A"),
    LeaderboardEntry(rank=10, name="Divya Nair", school="Hyderabad", xp=7500, accuracy_percent=77.0, streak=7, avatar="D"),
]


@router.post("/predict", response_model=RankPredictResponse)
async def predict_student_rank(body: RankPredictRequest):
    """
    Predict a student's exam rank from performance metrics.
    Returns rank range, college prediction, and actionable improvement tips.
    """
    result = predict_rank(
        accuracy=body.accuracy,
        speed=body.speed,
        consistency=body.consistency,
        exam=body.exam,
    )
    return RankPredictResponse(**result)


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(user_id: str = Query("demo-user-001")):
    """Return the top 10 students on the leaderboard."""
    return LeaderboardResponse(
        entries=LEADERBOARD_DATA,
        user_rank=4,  # demo user is #4
    )
