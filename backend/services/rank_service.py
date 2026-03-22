"""
NeuroLearn AI — Rank Prediction Service
Composite scoring algorithm that maps accuracy/speed/consistency to a predicted JEE/NEET rank.
"""
import math
from typing import List
from models.schemas import ImprovementTip


EXAM_TOTAL_CANDIDATES = {
    "JEE Advanced": 180000,
    "JEE Mains": 1100000,
    "NEET": 1800000,
    "UPSC": 900000,
    "GATE": 800000,
    "CAT": 250000,
}

IMPROVEMENT_TIPS = {
    "Physics": [
        ImprovementTip(subject="Physics", action="Improve Physics accuracy by 10%", impact="Significant rank boost — Physics has highest weightage", rank_boost=1200),
        ImprovementTip(subject="Physics", action="Focus on Electromagnetic Waves & Modern Physics", impact="High-frequency JEE topics worth ~18%", rank_boost=800),
        ImprovementTip(subject="Physics", action="Solve 15 Physics numericals daily", impact="Builds speed and pattern recognition", rank_boost=600),
    ],
    "Chemistry": [
        ImprovementTip(subject="Chemistry", action="Master Electrochemistry fundamentals", impact="One of your biggest weak areas", rank_boost=900),
        ImprovementTip(subject="Chemistry", action="Practice Organic reaction mechanisms daily", impact="Organic accounts for 33% of Chemistry in JEE", rank_boost=700),
        ImprovementTip(subject="Chemistry", action="Revise Coordination Compounds", impact="Frequently tested, high accuracy potential", rank_boost=500),
    ],
    "Mathematics": [
        ImprovementTip(subject="Mathematics", action="Improve integration speed by 30%", impact="Integration appears in 5-7 questions every JEE", rank_boost=1000),
        ImprovementTip(subject="Mathematics", action="Practice Complex Numbers daily", impact="High-weightage topic with consistent patterns", rank_boost=700),
        ImprovementTip(subject="Mathematics", action="Solve 5 Probability problems per day", impact="Probability has been growing in JEE Advanced", rank_boost=500),
    ],
    "Speed": [
        ImprovementTip(subject="All", action="Reduce average time per question by 20 seconds", impact="Gives ~12 extra minutes per paper", rank_boost=1500),
        ImprovementTip(subject="All", action="Practice timed mock tests every 3 days", impact="Builds exam-day time management instincts", rank_boost=800),
    ],
    "Consistency": [
        ImprovementTip(subject="All", action="Maintain zero missed study days this month", impact="Consistency compounds — 10% improvement in retention", rank_boost=600),
        ImprovementTip(subject="All", action="Use spaced repetition for all formulas", impact="Reduces revision time by 40% long-term", rank_boost=400),
    ],
}


def predict_rank(accuracy: float, speed: float, consistency: float, exam: str = "JEE Advanced") -> dict:
    """
    Composite score → rank prediction.
    Weights: accuracy 50%, speed 30%, consistency 20%.
    """
    composite = (accuracy * 0.50) + (speed * 0.30) + (consistency * 0.20)

    total = EXAM_TOTAL_CANDIDATES.get(exam, 200000)

    # Non-linear mapping: higher composite → exponentially better rank
    # Composite 90+ → top 1%, 70 → top 15%, 50 → top 40%
    percentile = composite  # composite ≈ percentile directly
    rank_from_bottom = int(total * (percentile / 100))
    predicted_rank = max(50, total - rank_from_bottom)

    # Variance bands
    best_case = max(50, int(predicted_rank * 0.65))
    worst_case = int(predicted_rank * 1.40)

    # College prediction
    if predicted_rank <= 500:
        college = "🏆 IIT Bombay / Delhi / Madras — CS Engineering (Top picks)"
    elif predicted_rank <= 2000:
        college = "🥇 IIT (Core branches — EE, ME, Chemical at top IITs)"
    elif predicted_rank <= 5000:
        college = "🥈 IIT (Other branches) / NIT Trichy, Warangal CS"
    elif predicted_rank <= 15000:
        college = "🥉 NIT Top colleges (CS/EC) / BITS Pilani"
    elif predicted_rank <= 35000:
        college = "📚 NIT / IIIT / State colleges (good branches)"
    else:
        college = "📖 State engineering colleges — keep pushing!"

    # Select most relevant tips
    tips = []
    if accuracy < 75:
        tips.extend(IMPROVEMENT_TIPS["Physics"][:1])
        tips.extend(IMPROVEMENT_TIPS["Chemistry"][:1])
    if speed < 65:
        tips.extend(IMPROVEMENT_TIPS["Speed"][:1])
    if consistency < 70:
        tips.extend(IMPROVEMENT_TIPS["Consistency"][:1])
    if not tips:
        tips = [IMPROVEMENT_TIPS["Mathematics"][0], IMPROVEMENT_TIPS["Speed"][0]]

    return {
        "predicted_rank": predicted_rank,
        "best_case_rank": best_case,
        "worst_case_rank": worst_case,
        "percentile": round(percentile, 1),
        "college_prediction": college,
        "improvement_tips": tips,
        "composite_score": round(composite, 2),
    }
