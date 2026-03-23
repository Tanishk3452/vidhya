"""
NeuroLearn AI — Questions Router
Serves adaptive practice questions and records student answers.
"""
import uuid
import random
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException
from models.schemas import QuestionModel, SubmitAnswerRequest, SubmitAnswerResponse
from models.db import record_attempt, get_weakest_topic, update_skill_on_attempt, get_user_attempts
from services.ai_service import ai_service

router = APIRouter(prefix="/api/questions", tags=["Adaptive Questions"])

# Local cache extending static bank with generated AI questions
if "QUESTION_BANK_CACHE" not in globals():
    QUESTION_BANK_CACHE: List[QuestionModel] = []

# ─── Question Bank ────────────────────────────────────────────────────────────
QUESTION_BANK: List[QuestionModel] = [
    QuestionModel(
        id="q001", subject="Physics", topic="Rotational Motion", difficulty="Hard",
        question="A solid cylinder of mass M and radius R rolls without slipping down an inclined plane of angle θ. What is the acceleration of the cylinder?",
        options=["a = (2/3)g sin θ", "a = g sin θ", "a = (2/3)g cos θ", "a = (1/2)g sin θ"],
        correct_index=0,
        explanation="For a solid cylinder (I = ½MR²) rolling without slipping:\nMg sinθ - f = Ma and fR = Iα = ½MR²(a/R)\n→ f = ½Ma\n→ Mg sinθ = (3/2)Ma → a = (2/3)g sinθ",
        tags=["Rolling motion", "Moment of inertia"], xp_reward=20
    ),
    QuestionModel(
        id="q002", subject="Chemistry", topic="Organic Chemistry", difficulty="Medium",
        question="Which reagent oxidizes primary alcohols to carboxylic acids?",
        options=["PCC (Pyridinium chlorochromate)", "KMnO₄ / H₂SO₄", "NaBH₄", "LiAlH₄"],
        correct_index=1,
        explanation="KMnO₄/H₂SO₄ is a strong oxidizer: primary alcohols → carboxylic acids, secondary → ketones. PCC only goes to aldehyde. NaBH₄ and LiAlH₄ are reducing agents.",
        tags=["Alcohols", "Oxidation"], xp_reward=15
    ),
    QuestionModel(
        id="q003", subject="Mathematics", topic="Integration", difficulty="Medium",
        question="Evaluate: ∫₀^π sin²(x) dx",
        options=["π/4", "π/2", "π", "2π"],
        correct_index=1,
        explanation="Using sin²x = (1-cos2x)/2:\n∫₀^π sin²x dx = [x/2 - sin2x/4]₀^π = π/2 - 0 = π/2",
        tags=["Definite integration", "Trigonometry"], xp_reward=15
    ),
    QuestionModel(
        id="q004", subject="Physics", topic="Electrostatics", difficulty="Easy",
        question="The electric field inside a conducting sphere with total charge Q is:",
        options=["Q/(4πε₀r²)", "Zero", "Q/(4πε₀R²)", "σ/ε₀"],
        correct_index=1,
        explanation="By Gauss's Law, all charges on a conductor reside on the surface. Inside the conductor, no free charges exist, so E = 0.",
        tags=["Gauss law", "Conductors"], xp_reward=10
    ),
    QuestionModel(
        id="q005", subject="Chemistry", topic="Physical Chemistry", difficulty="Hard",
        question="For N₂(g) + 3H₂(g) ⇌ 2NH₃(g), if pressure is increased 4×, Kp will:",
        options=["Increase by 16", "Decrease by 16", "Remain unchanged", "Increase by 4"],
        correct_index=2,
        explanation="Kp depends ONLY on temperature. Changing pressure shifts equilibrium position but does NOT change the value of K.",
        tags=["Equilibrium", "Le Chatelier"], xp_reward=20
    ),
    QuestionModel(
        id="q006", subject="Mathematics", topic="Probability", difficulty="Medium",
        question="Two fair dice are thrown. Probability that sum is 8?",
        options=["5/36", "6/36", "7/36", "4/36"],
        correct_index=0,
        explanation="Favorable outcomes for sum=8: (2,6),(3,5),(4,4),(5,3),(6,2) = 5 outcomes.\nTotal outcomes = 36. P = 5/36.",
        tags=["Probability", "Combinatorics"], xp_reward=15
    ),
    QuestionModel(
        id="q007", subject="Physics", topic="Thermodynamics", difficulty="Medium",
        question="In an isothermal process for an ideal gas, which quantity remains constant?",
        options=["Pressure", "Volume", "Internal energy", "Enthalpy"],
        correct_index=2,
        explanation="For an ideal gas, internal energy U depends only on temperature. In an isothermal process (T = const), ΔU = 0.",
        tags=["Thermodynamics", "Ideal gas"], xp_reward=15
    ),
    QuestionModel(
        id="q008", subject="Chemistry", topic="Organic Chemistry", difficulty="Easy",
        question="Which compound shows geometrical (cis-trans) isomerism?",
        options=["CH₃-CH₂-CH₃", "CH₃-CH=CH-CH₃", "CH₂=CH₂", "CH₃-CH₃"],
        correct_index=1,
        explanation="Geometrical isomerism requires: a C=C double bond AND each carbon of the double bond must have two DIFFERENT groups. But-2-ene (CH₃-CH=CH-CH₃) satisfies both conditions.",
        tags=["Isomerism", "Organic"], xp_reward=10
    ),
    QuestionModel(
        id="q009", subject="Mathematics", topic="Complex Numbers", difficulty="Hard",
        question="The modulus of (1+i)/(1-i) is:",
        options=["0", "1", "√2", "2"],
        correct_index=1,
        explanation="(1+i)/(1-i) × (1+i)/(1+i) = (1+i)²/(1+1) = (2i)/2 = i.\n|i| = 1.",
        tags=["Complex numbers", "Modulus"], xp_reward=20
    ),
    QuestionModel(
        id="q010", subject="Physics", topic="Waves", difficulty="Easy",
        question="The phenomenon of bending of light around obstacles is called:",
        options=["Refraction", "Reflection", "Diffraction", "Dispersion"],
        correct_index=2,
        explanation="Diffraction is the bending of waves around obstacles or through apertures. It's most significant when the obstacle size is comparable to the wavelength.",
        tags=["Wave optics", "Diffraction"], xp_reward=10
    ),
]

QUESTION_BANK_CACHE.extend(QUESTION_BANK)

def get_next_difficulty(current: str, correct: bool) -> str:
    """Adaptive difficulty adjustment."""
    order = ["Easy", "Medium", "Hard"]
    idx = order.index(current) if current in order else 1
    if correct and idx < 2:
        return order[idx + 1]
    if not correct and idx > 0:
        return order[idx - 1]
    return current


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.get("", response_model=List[QuestionModel])
async def get_questions(
    subject: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    count: int = Query(5, ge=1, le=20),
):
    """Get a set of adaptive questions by filter."""
    bank = QUESTION_BANK.copy()
    if subject:
        bank = [q for q in bank if q.subject.lower() == subject.lower()]
    if difficulty:
        bank = [q for q in bank if q.difficulty.lower() == difficulty.lower()]
    if topic:
        bank = [q for q in bank if topic.lower() in q.topic.lower()]
    random.shuffle(bank)
    return bank[:count]


@router.get("/next", response_model=QuestionModel)
async def get_next_adaptive_question(
    user_id: str = Query("demo-user-001"),
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None)
):
    """Deep adaptive engine: Identifies weakest topics and dynamically provides or generates questions via AI."""
    weakest = get_weakest_topic(user_id, active_subject=subject)
    
    attempts = get_user_attempts(user_id)
    attempted_ids = {a["question_id"] for a in attempts}
    
    attempts = get_user_attempts(user_id)
    attempted_ids = {a["question_id"] for a in attempts}
    
    if topic:
        # EXPLICIT TARGET MODE: Lock strictly to the user's requested topic
        target_topic = topic
        target_diff = difficulty or "Medium" # Baseline starting preference
        
        # Override with exact adaptive skill if the user has historical data on this exact topic
        topic_attempts = [a for a in attempts if a["topic"] == topic]
        if len(topic_attempts) >= 3:
            corrects = sum(1 for a in topic_attempts if a["correct"])
            ratio = corrects / len(topic_attempts)
            if ratio < 0.4: target_diff = "Easy"
            elif ratio > 0.75: target_diff = "Hard"
            else: target_diff = "Medium"
            
    else:
        # 1. Determine Target parameters globally
        all_topics = list({q.topic for q in QUESTION_BANK_CACHE if (not subject or q.subject.lower() == subject.lower())})
        if not all_topics: 
            all_topics = ["Rotational Motion", "Organic Chemistry", "Probability"]

        topic_attempts_count = {}
        for a in attempts:
            topic_attempts_count[a["topic"]] = topic_attempts_count.get(a["topic"], 0) + 1
            
        under_tested = [t for t in all_topics if topic_attempts_count.get(t, 0) < 2]
        
        if under_tested:
            target_topic = random.choice(under_tested)
            target_diff = "Medium"
        elif weakest:
            target_topic = weakest["topic"]
            if weakest.get("skill_level") == "Weak": target_diff = "Easy"
            elif weakest.get("skill_level") == "Strong": target_diff = "Hard"
            else: target_diff = "Medium"
            
            # Anti-fatigue
            last_3 = [a["topic"] for a in attempts[-3:]]
            if len(last_3) == 3 and all(t == target_topic for t in last_3):
                other_topics = [t for t in all_topics if t != target_topic]
                if other_topics:
                    target_topic = random.choice(other_topics)
                    target_diff = "Medium"
        else:
            target_topic = random.choice(all_topics)
            target_diff = "Medium"
    

    
    available = [q for q in QUESTION_BANK_CACHE if q.topic == target_topic and q.difficulty == target_diff and q.id not in attempted_ids]
    
    if available:
        return random.choice(available)
        
    # 3. If cache runs dry, call Gemini AI to uniquely generate a brand new specific question
    print(f"  🤖 Prompting Gemini for new {target_diff} question on {target_topic}...")
    ai_q_dict = ai_service.generate_adaptive_question(target_topic, target_diff)
    
    if ai_q_dict:
        new_q = QuestionModel(**ai_q_dict)
        QUESTION_BANK_CACHE.append(new_q)
        return new_q
        
    # 4. Total fallback (Gemini down, cache dry) - just give any random unseen or easiest seen question
    any_unseen = [q for q in QUESTION_BANK_CACHE if q.id not in attempted_ids]
    if any_unseen:
        return random.choice(any_unseen)
    return random.choice(QUESTION_BANK_CACHE)


@router.post("/submit", response_model=SubmitAnswerResponse)
async def submit_answer(body: SubmitAnswerRequest):
    """Submit an answer. Updates UserSkill and returns correctness."""
    q = next((x for x in QUESTION_BANK_CACHE if x.id == body.question_id), None)
    if not q:
        q = QUESTION_BANK_CACHE[0]

    correct = body.selected_index == q.correct_index
    xp_earned = q.xp_reward if correct else max(0, q.xp_reward // 4)
    next_diff = get_next_difficulty(q.difficulty, correct)
    
    current_skill = None

    if body.user_id:
        record_attempt({
            "id": str(uuid.uuid4()),
            "user_id": body.user_id,
            "question_id": body.question_id,
            "subject": q.subject,
            "topic": q.topic,
            "correct": correct,
            "time_taken_seconds": body.time_taken_seconds,
            "timestamp": datetime.utcnow().isoformat(),
        })
        # Adaptively tune user internal metrics natively based on result
        current_skill = update_skill_on_attempt(body.user_id, q.subject, q.topic, correct)

    return SubmitAnswerResponse(
        correct=correct,
        correct_index=q.correct_index,
        explanation=q.explanation,
        xp_earned=xp_earned,
        new_difficulty=next_diff,
        skill_level=current_skill
    )


@router.get("/topics")
async def get_topics():
    """List all available subjects and topics."""
    result = {}
    for q in QUESTION_BANK:
        result.setdefault(q.subject, set()).add(q.topic)
    return {s: list(t) for s, t in result.items()}
