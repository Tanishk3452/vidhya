"""
NeuroLearn AI — In-Memory Data Store
Simulates a database without requiring MongoDB for the MVP.
Stores users, question attempts, and analytics data.
"""
from datetime import datetime
from typing import Dict, List, Optional
import uuid


# ─── In-memory fallback stores ────────────────────────────────────────────────────────

users_db: Dict[str, dict] = {}          # email -> user dict
attempts_db: List[dict] = []            # list of all question attempts
study_plans_db: Dict[str, dict] = {}    # user_id -> study plan dict
sessions_db: Dict[str, dict] = {}       # token -> user

# Import Mongo Connection Manager
try:
    from models.mongo import mongodb_available, get_db
except ImportError:
    mongodb_available = False
    get_db = lambda: None


# ─── Seed data ───────────────────────────────────────────────────────────────

def seed_demo_user():
    """Add a demo user so login works out of the box."""
    from passlib.context import CryptContext
    pwd_ctx = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

    demo = {
        "id": "demo-user-001",
        "name": "Aryan Sharma",
        "email": "aryan@neurolearn.ai",
        "hashed_password": pwd_ctx.hash("demo1234"),
        "exam": "JEE Advanced",
        "xp": 4280,
        "streak": 14,
        "level": 12,
        "created_at": datetime.utcnow().isoformat(),
    }
    users_db[demo["email"]] = demo

    if mongodb_available:
        try:
            db = get_db()
            if not db.users.find_one({"email": demo["email"]}):
                db.users.insert_one(demo.copy())
        except:
            pass

    # Seed a week of attempts for analytics
    subjects = ["Physics", "Chemistry", "Mathematics"]
    topics_map = {
        "Physics": ["Rotational Motion", "Electrostatics", "Thermodynamics", "Optics", "Modern Physics"],
        "Chemistry": ["Organic Chemistry", "Electrochemistry", "Physical Chemistry", "Coordination", "Inorganic"],
        "Mathematics": ["Integration", "Matrices", "Probability", "Complex Numbers", "Coordinate Geometry"],
    }
    import random
    random.seed(42)
    for i in range(127):
        subj = random.choice(subjects)
        correct = random.random() < 0.78
        attempt = {
            "id": str(uuid.uuid4()),
            "user_id": "demo-user-001",
            "question_id": f"q-{i}",
            "subject": subj,
            "topic": random.choice(topics_map[subj]),
            "correct": correct,
            "time_taken_seconds": random.randint(45, 180),
            "timestamp": datetime.utcnow().isoformat(),
        }
        attempts_db.append(attempt)

    if mongodb_available:
        try:
            db = get_db()
            if db.attempts.count_documents({"user_id": "demo-user-001"}) == 0:
                # Seed mongo with these attempts
                db.attempts.insert_many([a.copy() for a in attempts_db])
        except:
            pass


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_user_by_email(email: str) -> Optional[dict]:
    if mongodb_available:
        try:
            user = get_db().users.find_one({"email": email}, {"_id": 0})
            if user: return user
        except: pass
    return users_db.get(email)

def get_user_by_id(user_id: str) -> Optional[dict]:
    if mongodb_available:
        try:
            user = get_db().users.find_one({"id": user_id}, {"_id": 0})
            if user: return user
        except: pass
    for u in users_db.values():
        if u["id"] == user_id:
            return u
    return None

def create_user(name: str, email: str, hashed_password: str, exam: str) -> dict:
    user = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "hashed_password": hashed_password,
        "exam": exam,
        "xp": 0,
        "streak": 0,
        "level": 1,
        "created_at": datetime.utcnow().isoformat(),
    }
    
    if mongodb_available:
        try:
            get_db().users.insert_one(user.copy())
        except: pass
        
    users_db[email] = user
    return user

def record_attempt(attempt: dict):
    if mongodb_available:
        try:
            get_db().attempts.insert_one(attempt.copy())
        except: pass
    attempts_db.append(attempt)

def get_user_attempts(user_id: str) -> List[dict]:
    if mongodb_available:
        try:
            return list(get_db().attempts.find({"user_id": user_id}, {"_id": 0}))
        except: pass
    return [a for a in attempts_db if a.get("user_id") == user_id]

def save_study_plan(user_id: str, plan_data: dict):
    if mongodb_available:
        try:
            get_db().study_plans.update_one({"user_id": user_id}, {"$set": plan_data}, upsert=True)
        except: pass
    study_plans_db[user_id] = plan_data

def get_study_plan(user_id: str) -> Optional[dict]:
    if mongodb_available:
        try:
            p = get_db().study_plans.find_one({"user_id": user_id}, {"_id": 0})
            if p: return p
        except: pass
    return study_plans_db.get(user_id)
