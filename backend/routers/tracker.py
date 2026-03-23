"""
NeuroLearn AI — Syllabus Tracker Router
Full JEE/NEET/UPSC syllabus with per-user topic completion tracking.
Supports custom syllabus upload via PDF parsed by Gemini Vision.
"""
from fastapi import APIRouter, Query, UploadFile, File
from pydantic import BaseModel
from typing import Dict, List, Optional
from models.db import get_db, mongodb_available
from datetime import datetime
import json

router = APIRouter(prefix="/api/tracker", tags=["Syllabus Tracker"])

# ── In-memory fallback ───────────────────────────────────────────────────────
tracker_db: Dict[str, dict] = {}
custom_syllabi_db: Dict[str, dict] = {}

# ── Full Syllabus Data ───────────────────────────────────────────────────────
JEE_SYLLABUS = {
    "Physics": {
        "Mechanics": [
            "Units & Dimensions", "Kinematics (1D & 2D)", "Laws of Motion",
            "Work, Energy & Power", "Rotational Motion", "Gravitation",
            "Properties of Solids & Liquids", "Oscillations & Waves"
        ],
        "Thermodynamics": [
            "Thermal Properties of Matter", "Laws of Thermodynamics",
            "Kinetic Theory of Gases", "Heat Transfer"
        ],
        "Electromagnetism": [
            "Electrostatics", "Current Electricity", "Magnetic Effects of Current",
            "Magnetism & Matter", "Electromagnetic Induction",
            "Alternating Current", "Electromagnetic Waves"
        ],
        "Optics": ["Ray Optics", "Wave Optics"],
        "Modern Physics": [
            "Dual Nature of Matter & Radiation", "Atoms & Nuclei",
            "Electronic Devices", "Communication Systems"
        ]
    },
    "Chemistry": {
        "Physical Chemistry": [
            "Mole Concept & Stoichiometry", "Atomic Structure", "Chemical Bonding",
            "States of Matter", "Thermodynamics", "Chemical Equilibrium",
            "Ionic Equilibrium", "Redox Reactions", "Electrochemistry",
            "Chemical Kinetics", "Surface Chemistry", "Solutions"
        ],
        "Inorganic Chemistry": [
            "Periodic Table & Periodicity", "s-Block Elements", "p-Block Elements",
            "d & f Block Elements", "Coordination Compounds",
            "Metallurgy", "Environmental Chemistry"
        ],
        "Organic Chemistry": [
            "Basic Concepts & IUPAC", "Isomerism", "Hydrocarbons",
            "Halogenated Compounds", "Alcohols, Phenols & Ethers",
            "Aldehydes & Ketones", "Carboxylic Acids & Derivatives",
            "Nitrogen Compounds", "Biomolecules", "Polymers",
            "Reaction Mechanisms (SN1, SN2, E1, E2)"
        ]
    },
    "Mathematics": {
        "Algebra": [
            "Complex Numbers", "Quadratic Equations", "Sequences & Series",
            "Permutations & Combinations", "Binomial Theorem",
            "Matrices & Determinants", "Mathematical Induction"
        ],
        "Calculus": [
            "Functions, Limits & Continuity", "Differentiation",
            "Applications of Derivatives", "Indefinite Integration",
            "Definite Integration", "Differential Equations", "Area Under Curves"
        ],
        "Coordinate Geometry": [
            "Straight Lines", "Circles", "Parabola", "Ellipse", "Hyperbola"
        ],
        "Trigonometry": [
            "Trigonometric Ratios & Identities", "Inverse Trigonometry",
            "Trigonometric Equations", "Properties of Triangles"
        ],
        "Vector & 3D Geometry": ["Vectors", "3D Geometry", "Planes & Lines in 3D"],
        "Statistics & Probability": [
            "Statistics", "Probability", "Bayes Theorem",
            "Random Variables & Distributions"
        ]
    }
}

NEET_SYLLABUS = {
    "Physics": JEE_SYLLABUS["Physics"],
    "Chemistry": JEE_SYLLABUS["Chemistry"],
    "Biology": {
        "Botany": [
            "Diversity in Living World", "Structural Organisation in Plants",
            "Cell Structure & Function", "Plant Physiology",
            "Reproduction in Plants", "Genetics & Evolution",
            "Biology & Human Welfare (Plants)", "Biotechnology",
            "Ecology & Environment"
        ],
        "Zoology": [
            "Structural Organisation in Animals", "Human Physiology",
            "Reproduction in Animals", "Genetics & Evolution",
            "Biology & Human Welfare (Animals)", "Animal Kingdom",
            "Biotechnology & Applications"
        ]
    }
}

UPSC_SYLLABUS = {
    "General Studies I": {
        "History": [
            "Ancient India", "Medieval India", "Modern India",
            "Indian Culture & Heritage", "World History"
        ],
        "Geography": [
            "Physical Geography", "Indian Geography", "World Geography",
            "Economic Geography", "Disaster Management"
        ],
        "Society": [
            "Indian Society", "Social Issues", "Role of Women",
            "Globalisation", "Population & Urbanisation"
        ]
    },
    "General Studies II": {
        "Polity": [
            "Indian Constitution", "Parliament & State Legislatures",
            "Executive & Judiciary", "Federalism", "Elections",
            "Governance & Public Policy", "Rights & Duties"
        ],
        "International Relations": [
            "India's Foreign Policy", "International Institutions",
            "Regional Groupings", "Effect of Policies on India's Interest"
        ],
        "Social Justice": [
            "Welfare Schemes", "Health", "Education Policy",
            "Poverty & Development", "Government Mechanisms"
        ]
    },
    "General Studies III": {
        "Economy": [
            "Economic Development", "Agriculture", "Industry & Infrastructure",
            "Planning & Budget", "Inclusive Growth", "Land Reforms"
        ],
        "Science & Tech": [
            "Science & Technology Developments", "Space Technology",
            "IT & Computers", "Energy", "Biotechnology", "Defence"
        ],
        "Environment": [
            "Conservation", "Environmental Pollution",
            "Biodiversity", "Climate Change", "Environmental Acts"
        ],
        "Security": [
            "Internal Security", "Left Wing Extremism",
            "Cyber Security", "Money Laundering", "Border Management"
        ]
    },
    "General Studies IV": {
        "Ethics": [
            "Ethics & Human Interface", "Attitude", "Emotional Intelligence",
            "Civil Service Values", "Probity in Governance", "Case Studies"
        ]
    }
}

SYLLABI = {
    "JEE": JEE_SYLLABUS,
    "NEET": NEET_SYLLABUS,
    "UPSC": UPSC_SYLLABUS,
}


# ── DB Helpers ───────────────────────────────────────────────────────────────

def get_tracker(user_id: str) -> dict:
    if mongodb_available:
        try:
            doc = get_db().tracker.find_one({"user_id": user_id}, {"_id": 0})
            if doc:
                return doc.get("ticks", {})
        except:
            pass
    return tracker_db.get(user_id, {})


def save_tracker(user_id: str, ticks: dict):
    if mongodb_available:
        try:
            get_db().tracker.update_one(
                {"user_id": user_id},
                {"$set": {"ticks": ticks, "updated_at": datetime.utcnow().isoformat()}},
                upsert=True
            )
            return
        except:
            pass
    tracker_db[user_id] = ticks


def get_custom_syllabus(user_id: str) -> Optional[dict]:
    if mongodb_available:
        try:
            doc = get_db().custom_syllabi.find_one({"user_id": user_id}, {"_id": 0})
            if doc:
                return doc
        except:
            pass
    return custom_syllabi_db.get(user_id)


def save_custom_syllabus(user_id: str, syllabus: dict, exam_name: str):
    data = {"user_id": user_id, "syllabus": syllabus, "exam_name": exam_name}
    if mongodb_available:
        try:
            get_db().custom_syllabi.update_one(
                {"user_id": user_id}, {"$set": data}, upsert=True
            )
            return
        except:
            pass
    custom_syllabi_db[user_id] = data


# ── Request Models ───────────────────────────────────────────────────────────

class TickRequest(BaseModel):
    user_id: str = "demo-user-001"
    key: str
    checked: bool


class BulkTickRequest(BaseModel):
    user_id: str = "demo-user-001"
    keys: List[str]
    checked: bool


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/syllabus")
async def get_syllabus(exam: str = Query("JEE"), user_id: str = Query("demo-user-001")):
    if exam.upper() == "CUSTOM":
        custom = get_custom_syllabus(user_id)
        if custom:
            return {"exam": custom["exam_name"], "syllabus": custom["syllabus"], "is_custom": True}
        return {"exam": "Custom", "syllabus": {}, "is_custom": True}
    syllabus = SYLLABI.get(exam.upper(), JEE_SYLLABUS)
    return {"exam": exam, "syllabus": syllabus, "is_custom": False}


@router.get("/has-custom")
async def has_custom_syllabus(user_id: str = Query("demo-user-001")):
    custom = get_custom_syllabus(user_id)
    if custom:
        return {
            "has_custom": True,
            "exam_name": custom.get("exam_name", "Custom"),
            "subject_count": len(custom.get("syllabus", {}))
        }
    return {"has_custom": False}


@router.get("/progress")
async def get_progress(user_id: str = Query("demo-user-001"), exam: str = Query("JEE")):
    ticks = get_tracker(user_id)
    if exam.upper() == "CUSTOM":
        custom = get_custom_syllabus(user_id)
        syllabus = custom["syllabus"] if custom else {}
    else:
        syllabus = SYLLABI.get(exam.upper(), JEE_SYLLABUS)

    total = done = 0
    subject_stats = {}
    for subject, topics in syllabus.items():
        s_total = s_done = 0
        for topic, subtopics in topics.items():
            for subtopic in subtopics:
                key = f"{subject}|{topic}|{subtopic}"
                total += 1
                s_total += 1
                if ticks.get(key):
                    done += 1
                    s_done += 1
        subject_stats[subject] = {
            "total": s_total,
            "done": s_done,
            "percent": round((s_done / s_total) * 100) if s_total else 0
        }

    return {
        "ticks": ticks,
        "total": total,
        "done": done,
        "percent": round((done / total) * 100) if total else 0,
        "subject_stats": subject_stats,
    }


@router.post("/tick")
async def tick_subtopic(body: TickRequest):
    ticks = get_tracker(body.user_id)
    ticks[body.key] = body.checked
    save_tracker(body.user_id, ticks)
    return {"success": True, "key": body.key, "checked": body.checked}


@router.post("/tick-bulk")
async def tick_bulk(body: BulkTickRequest):
    ticks = get_tracker(body.user_id)
    for key in body.keys:
        ticks[key] = body.checked
    save_tracker(body.user_id, ticks)
    return {"success": True, "updated": len(body.keys)}


@router.delete("/reset")
async def reset_tracker(user_id: str = Query("demo-user-001")):
    save_tracker(user_id, {})
    return {"success": True}


@router.post("/parse-pdf")
async def parse_syllabus_pdf(
    user_id: str = Query("demo-user-001"),
    file: UploadFile = File(...)
):
    """Upload a syllabus PDF — Gemini Vision parses it into structured tracker."""
    from services.ai_service import ai_service

    if not ai_service.client or not ai_service.model_name:
        return {"success": False, "error": "AI service not available. Check your GEMINI_API_KEY."}

    file_bytes = await file.read()
    mime_type = file.content_type or "application/pdf"

    prompt = (
        "You are an expert at parsing academic syllabi documents.\n"
        "Carefully read this syllabus PDF and extract the COMPLETE structure.\n\n"
        "Return ONLY a valid JSON object — no markdown, no code fences, just raw JSON:\n"
        "{\n"
        '  "exam_name": "Exact name of the exam or course from the document",\n'
        '  "syllabus": {\n'
        '    "Subject Name": {\n'
        '      "Topic/Unit Name": [\n'
        '        "Subtopic or chapter 1",\n'
        '        "Subtopic or chapter 2"\n'
        '      ]\n'
        '    }\n'
        '  }\n'
        "}\n\n"
        "RULES — follow strictly:\n"
        "1. Extract EVERY subject, unit/topic and subtopic you find\n"
        "2. If the PDF has units but no subtopics, split the unit into logical subtopics yourself\n"
        "3. Each topic must have at least 3 subtopics\n"
        "4. Keep names concise — max 70 characters\n"
        "5. Preserve the original exam/course name exactly\n"
        "6. Never return empty arrays — always generate subtopics if none exist"
    )

    try:
        from google.genai import types
        response = ai_service.client.models.generate_content(
            model=ai_service.model_name,
            contents=[
                types.Content(parts=[
                    types.Part(text=prompt),
                    types.Part(inline_data=types.Blob(mime_type=mime_type, data=file_bytes))
                ])
            ]
        )

        raw = response.text.strip()

        # Strip markdown fences if present
        result = None
        if "```" in raw:
            for part in raw.split("```"):
                part = part.strip().lstrip("json").strip()
                try:
                    result = json.loads(part)
                    break
                except:
                    continue
        if not result:
            result = json.loads(raw)

        syllabus = result.get("syllabus", {})
        exam_name = result.get("exam_name", file.filename.replace(".pdf", ""))

        if not syllabus:
            return {"success": False, "error": "Could not extract syllabus. Please use a text-based PDF (not scanned image)."}

        save_custom_syllabus(user_id, syllabus, exam_name)
        SYLLABI[f"CUSTOM_{user_id}"] = syllabus

        subtopic_count = sum(
            len(subs) for topics in syllabus.values() for subs in topics.values()
        )

        return {
            "success": True,
            "exam_name": exam_name,
            "subject_count": len(syllabus),
            "topic_count": sum(len(t) for t in syllabus.values()),
            "subtopic_count": subtopic_count,
        }

    except json.JSONDecodeError as e:
        return {"success": False, "error": f"AI returned malformed JSON. Try again. ({e})"}
    except Exception as e:
        print(f"  ⚠️  PDF parse error: {e}")
        return {"success": False, "error": str(e)}