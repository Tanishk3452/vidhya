"""
NeuroLearn AI — AI Service (Google Gemini)
Uses gemini-1.5-flash when GEMINI_API_KEY is set.
Falls back to question-aware curated responses otherwise.
"""
import os
import time
from typing import Optional

# New official Google Gemini SDK (google-genai)
try:
    from google import genai
    _gemini_available = True
except ImportError:
    _gemini_available = False
    print("  ⚠️  google-genai not installed. Run: python -m pip install google-genai")

try:
    from services.rag_service import rag_service
except Exception as e:
    rag_service = None
    print(f"  ⚠️  Could not load RAG Service: {e}")


# ─── Subject Detection ──────────────────────────────────────────────────────

def detect_subject(question: str) -> str:
    q = question.lower()
    if any(k in q for k in ["physics","force","motion","energy","wave","optic","electric","magnetic","thermody","newton","gauss","coulomb","rotational","momentum","velocity","acceleration","inertia","pressure","gravity","light","sound","heat","current","voltage","resistance","capacit","inductor","nuclear","radiation","quantum","photon","electron","proton","neutron"]):
        return "Physics"
    if any(k in q for k in ["chemistry","reaction","organic","bond","element","molecule","acid","base","equilibri","hybridiz","orbital","mole","redox","polymer","alkane","alkene","benzene","isomer","oxidation","reduction","catalyst","salt","electro","titration","pH","buffer","enthalpy","entropy","gibbs","hess","periodic","valence","ionic","covalent"]):
        return "Chemistry"
    if any(k in q for k in ["math","integrat","differenti","matrix","vector","probabili","complex","trigon","calculus","sequence","series","binomial","coordinate","logarithm","function","limit","derivative","equation","inequality","permut","combinat","set","relation"]):
        return "Mathematics"
    if any(k in q for k in ["history","geography","polity","economy","constitution","amendment","article","parliament","president","prime minister","upsc","ias","current affair","governance","biodiversity","ecosystem"]):
        return "UPSC"
    return "General"


# ─── Gemini API call ────────────────────────────────────────────────────────

class AIService:
    def __init__(self):
       
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
      
    # Temporary debug — remove after confirming it works
        print(f"  🔑 GEMINI_API_KEY loaded: {'YES (' + self.api_key[:8] + '...)' if self.api_key else 'NO — KEY IS EMPTY'}")
    
    
        self.client = None
        self.model_name = None

        if self.api_key and _gemini_available:
            try:
                self.client = genai.Client(api_key=self.api_key)
                
                # Dynamically get models this key is actually allowed to use
                print("  🔍 Scanning API key capabilities...")
                available_models = self.client.models.list()
                model_names = [m.name for m in available_models if "generateContent" in getattr(m, 'supported_actions', [])]
                
                # Prioritize flash models and gemma, then everything else
                flash_models = [m for m in model_names if "flash" in m]
                gemma_models = [m for m in model_names if "gemma" in m]
                ordered_models = flash_models + gemma_models + [m for m in model_names if m not in flash_models and m not in gemma_models]

                for name in ordered_models:
                    try:
                        # Test if the model both exists AND has free quota > 0
                        test = self.client.models.generate_content(
                            model=name, contents="Hi"
                        )
                        self.model_name = name
                        print(f"  ✅ Gemini AI connected: {name}")
                        break
                    except Exception as e:
                        # Skip models that return 404 or 429 Limit 0
                        print(f"  ↳ {name} unavailable or out of quota")
                        
                if not self.model_name:
                    print("  ⚠️  All models strictly blocked or out of quota — using smart fallback")
            except Exception as e:
                print(f"  ⚠️  Gemini init error: {e}")
                self.client = None
        elif not self.api_key:
            print("  ℹ️  GEMINI_API_KEY not set — using smart fallback responses")
        elif not _gemini_available:
            print("  ⚠️  google-genai not installed: run pip install google-genai")

    def _call_gemini(self, prompt: str) -> Optional[str]:
        """Send a prompt to Gemini and return the text response."""
        if not self.client or not self.model_name:
            return None
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"  ⚠️  Gemini API call failed: {e}")
            return None

    def solve_image_doubt(self, file_bytes: bytes, mime_type: str) -> dict:
        import time
        start = time.time()

        if not self.client or not self.model_name:
            return {
                "answer": "⚠️ Gemini API key is missing or invalid. Please check your .env file.",
                "subject": "Image OCR",
                "topic": "Unknown",
                "difficulty": "Medium",
                "related_topics": [],
                "solved_in_ms": 0,
            }

        prompt = (
            "You are NeuroLearn AI, an expert tutor for Indian competitive exams (JEE/NEET/UPSC).\n"
            "Analyze this uploaded image carefully.\n"
            "1. First, extract and state the exact question or problem shown in the image.\n"
            "2. Then solve it step-by-step with full working.\n"
            "Format your answer with:\n"
            "- **Question Found:** (what you extracted from the image)\n"
            "- **Step-by-step solution** with numbered steps\n"
            "- **Key formulas or concepts used**\n"
            "- 💡 A relevant JEE/NEET/UPSC exam tip\n"
            "Use **bold** for key terms."
        )

        try:
            from google.genai import types

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        parts=[
                            types.Part(text=prompt),
                            types.Part(
                                inline_data=types.Blob(
                                    mime_type=mime_type,
                                    data=file_bytes
                                )
                            )
                        ]
                    )
                ]
            )
            answer = response.text

        except Exception as e:
            print(f"  ⚠️  Gemini Vision API failed: {e}")
            answer = (
                f"**Error analyzing image:** {str(e)}\n\n"
                "Please try again with:\n"
                "- Better lighting on the image\n"
                "- A clearer, higher-contrast photo\n"
                "- JPG or PNG format"
            )

        return {
            "answer": answer,
            "subject": "Image Question",
            "topic": "Multimodal Input",
            "difficulty": "Unknown",
            "related_topics": [],
            "solved_in_ms": int((time.time() - start) * 1000),
        }


    # ─── Doubt Solving ──────────────────────────────────────────────────────

    def solve_doubt(self, question: str, subject: Optional[str] = None) -> dict:
        start = time.time()
        detected_subject = subject or detect_subject(question)
        
        # 1. RAG Retrieve Step (Fetch from our knowledge base)
        rag_context = ""
        if rag_service:
            rag_context = rag_service.search(question, top_k=2)

        rag_instruction = ""
        if rag_context:
            print("  📖 RAG context injected into prompt!")
            rag_instruction = (
                f"\n\n--- KNOWLEDGE BASE EXTRACT (NCERT/Standard Books) ---\n"
                f"{rag_context}\n"
                f"----------------------------------------------------\n"
                f"CRITICAL INSTRUCTION: Base your explanation on the textbook extract above. "
                f"Use the exact terminology and definitions provided in the text."
            )

        prompt = (
            f"You are NeuroLearn AI, an expert tutor for Indian competitive exams "
            f"(JEE Advanced, NEET, UPSC). The student is asking a doubt regarding {detected_subject}.\n\n"
            "Give a clear, structured answer with:\n"
            "- Brief concept explanation\n"
            "- Step-by-step solution with numbered steps\n"
            "- Key formula(s) if applicable\n"
            "- A real-world example or memory trick\n"
            "- 💡 A JEE/NEET/UPSC tip at the end\n\n"
            "Use **bold** for key terms. Keep it exam-focused."
            f"{rag_instruction}\n\n"
            f"Student Question: {question}"
        )

        answer = self._call_gemini(prompt)

        if not answer:
            answer = self._smart_fallback(question, detected_subject)

        elapsed_ms = int((time.time() - start) * 1000)

        subject_topics = {
            "Physics":     ["Newton's Laws", "Energy Conservation", "Electrostatics", "Optics"],
            "Chemistry":   ["Chemical Bonding", "Reaction Mechanisms", "Equilibrium", "Organic"],
            "Mathematics": ["Calculus", "Algebra", "Coordinate Geometry", "Probability"],
            "UPSC":        ["Polity", "History", "Geography", "Economy"],
            "General":     ["Problem Solving", "Exam Strategy"],
        }

        return {
            "answer": answer,
            "subject": detected_subject,
            "topic": detected_subject,
            "difficulty": "Medium",
            "related_topics": subject_topics.get(detected_subject, []),
            "solved_in_ms": elapsed_ms,
        }

    # ─── Study Plan ─────────────────────────────────────────────────────────

    def generate_study_plan(self, exam: str, weak_subjects: list, hours_per_day: float, exam_date: Optional[str]) -> dict:
        prompt = (
            f"Generate a 7-day study plan for {exam}.\n"
            f"Weak subjects: {', '.join(weak_subjects)}.\n"
            f"Study time: {hours_per_day} hours/day.\n"
            f"Exam date: {exam_date or 'in 3 months'}.\n\n"
            "Return ONLY valid JSON (no markdown, no code fences) with this structure:\n"
            "{\n"
            '  "plan": [{"day":"Monday","slots":[{"time":"6:00 AM","subject":"Physics","topic":"...","duration":"90 min","type":"Study"}]}],\n'
            '  "tips": ["tip1","tip2","tip3","tip4"],\n'
            '  "time_allocation": {"Physics":40,"Chemistry":30,"Mathematics":30}\n'
            "}\n"
            "Slot types: Study, Practice, Revision, Test, Rest. 3-5 slots per day."
        )

        answer = self._call_gemini(prompt)

        if answer:
            try:
                import json
                raw = answer.strip()
                # Strip markdown code fences if present
                if "```" in raw:
                    parts = raw.split("```")
                    for part in parts:
                        part = part.strip()
                        if part.startswith("json"):
                            part = part[4:].strip()
                        try:
                            return json.loads(part)
                        except Exception:
                            continue
                return json.loads(raw)
            except Exception as e:
                print(f"  ⚠️  Failed to parse Gemini study plan JSON: {e}")

        return self._fallback_plan(exam, weak_subjects, hours_per_day)

    # ─── Smart Fallback (question-aware) ────────────────────────────────────

    def _smart_fallback(self, question: str, subject: str) -> str:
        q = question.lower()

        # Physics patterns
        if "newton" in q and "third" in q:
            return """**Newton's Third Law of Motion**
> "For every action, there is an equal and opposite reaction."
1. Object A exerts force on B → B exerts equal & opposite force on A
2. These forces act on **different** objects — they never cancel
**Examples:** Rocket exhaust (↓) → rocket moves (↑) | Swimming: push water back → body moves forward
💡 **JEE Tip:** "Action-reaction pairs never act on the same body" — classic MCQ trap!"""

        if "newton" in q and ("second" in q or "f=ma" in q or "force" in q):
            return """**Newton's Second Law: F = ma**
Force = mass × acceleration
**Steps:**
1. Identify all forces on the object (draw FBD)
2. Find net force: F_net = ΣF
3. Apply: a = F_net / m
**Example:** 10 kg box, 50 N force, 10 N friction → F_net = 40 N → a = 4 m/s²
💡 **JEE Tip:** Always draw a Free Body Diagram before applying F = ma!"""

        if any(k in q for k in ["integrat", "integral", "∫"]):
            return """**Integration — Key Formulas**
• ∫xⁿ dx = xⁿ⁺¹/(n+1) + C
• ∫eˣ dx = eˣ + C
• ∫sin x dx = −cos x + C
• ∫cos x dx = sin x + C
**Integration by Parts:** ∫u dv = uv − ∫v du (LIATE rule for choosing u)
**Example:** ∫x·eˣ dx → u=x, dv=eˣdx → x·eˣ − eˣ + C
💡 **JEE Tip:** For definite integrals with symmetric limits, use property: ∫₋ₐᵃ f(x)dx = 0 if f is odd."""

        if any(k in q for k in ["differentiat", "derivative", "dy/dx"]):
            return """**Differentiation Formulas**
• d/dx(xⁿ) = nxⁿ⁻¹
• d/dx(eˣ) = eˣ
• d/dx(ln x) = 1/x
• d/dx(sin x) = cos x
• **Chain Rule:** d/dx[f(g(x))] = f'(g(x))·g'(x)
• **Product Rule:** d/dx(uv) = u'v + uv'
• **Quotient Rule:** d/dx(u/v) = (u'v − uv')/v²
💡 **JEE Tip:** For implicit differentiation, differentiate both sides w.r.t. x, treating y as a function of x."""

        if any(k in q for k in ["electrostat", "electric field", "coulomb", "gauss"]):
            return """**Electrostatics — Core Concepts**
**Coulomb's Law:** F = kq₁q₂/r² (k = 9×10⁹ N·m²/C²)
**Electric Field:** E = F/q₀ = kQ/r²
**Gauss's Law:** ∮E·dA = Q_enclosed/ε₀
**Key Rules:**
1. E = 0 inside a conductor
2. Field lines: +ve → −ve charge
3. E is always ⊥ to conductor surface
💡 **JEE Tip:** Use Gauss's Law for symmetric distributions (sphere, cylinder, plane) — it's 10× faster than direct integration!"""

        if any(k in q for k in ["thermodynamics", "entropy", "enthalpy", "gibbs"]):
            return """**Thermodynamics — Key Relations**
• **First Law:** ΔU = Q − W (energy conservation)
• **Second Law:** Entropy of universe always increases
• **Gibbs Free Energy:** ΔG = ΔH − TΔS
  - ΔG < 0: Spontaneous | ΔG > 0: Non-spontaneous
• **For ideal gas:** PV = nRT
**Processes:** Isothermal (T const), Adiabatic (Q=0), Isobaric (P const), Isochoric (V const)
💡 **JEE Tip:** For adiabatic: PVᵞ = const, where γ = Cp/Cv = 5/3 (monatomic), 7/5 (diatomic)"""

        if any(k in q for k in ["organic", "reaction mechanism", "sn1", "sn2", "elimination", "addition"]):
            return """**Organic Chemistry — Reaction Mechanisms**
**Nucleophilic Substitution:**
• SN1: 2 steps, carbocation intermediate, racemization (tertiary halides)
• SN2: 1 step, backside attack, inversion (primary halides)
**Key Reagents:**
| Reagent | Effect |
|---------|--------|
| KMnO₄/H₂SO₄ | Strong oxidation |
| PCC | Alcohol → Aldehyde only |
| NaBH₄ | Mild reduction |
| HBr/Peroxide | Anti-Markovnikov |
💡 **NEET Tip:** Markovnikov = H adds to C with MORE H's. Peroxide reverses this."""

        if any(k in q for k in ["hybridiz", "sp3", "sp2", "vsepr", "molecular geometry"]):
            return """**Hybridization Quick Guide**
| Type | Shape | Bond Angle | Example |
|------|-------|-----------|---------|
| sp | Linear | 180° | BeCl₂, C₂H₂ |
| sp² | Trigonal Planar | 120° | BF₃, C₂H₄ |
| sp³ | Tetrahedral | 109.5° | CH₄ |
| sp³d | Trigonal Bipyramidal | 90°/120° | PCl₅ |
| sp³d² | Octahedral | 90° | SF₆ |
**Quick Rule:** Hybridization = σ bonds + lone pairs on central atom
💡 **NEET Tip:** NH₃ is sp³ hybridized but **pyramidal** shape — lone pair doesn't count for shape!"""

        if any(k in q for k in ["probabili", "probability", "p(a)", "bayes"]):
            return """**Probability — JEE Guide**
• **Basic:** P(A) = favourable/total outcomes
• **Addition:** P(A∪B) = P(A) + P(B) − P(A∩B)
• **Independent events:** P(A∩B) = P(A)·P(B)
• **Conditional:** P(A|B) = P(A∩B)/P(B)
• **Bayes Theorem:** P(A|B) = P(B|A)·P(A) / P(B)
• **Binomial:** P(X=r) = ⁿCᵣ·pʳ·(1−p)ⁿ⁻ʳ
💡 **JEE Tip:** Draw a tree diagram for multi-stage probability problems — reduces errors by 80%!"""

        if any(k in q for k in ["equilibrium", "le chatelier", "kp", "kc"]):
            return """**Chemical Equilibrium**
For: aA + bB ⇌ cC + dD
• **Kc** = [C]ᶜ[D]ᵈ / [A]ᵃ[B]ᵇ
• **Kp** = Kc(RT)^Δn, where Δn = moles(products) − moles(reactants)
**Le Chatelier's Principle:**
- Add reactant → shifts right | Add product → shifts left
- Increase pressure → shifts to fewer moles of gas
- Increase temperature → shifts toward endothermic side
- Catalyst → **does NOT shift** equilibrium, only speeds it up
💡 **Key Fact:** Kp and Kc change ONLY with temperature!"""

        if any(k in q for k in ["wave", "diffraction", "interference", "optic"]):
            return """**Wave Optics**
• **Young's Double Slit:** fringe width β = λD/d
• **Condition for maxima:** path diff = nλ
• **Condition for minima:** path diff = (2n−1)λ/2
• **Diffraction:** bending of light around obstacles (significant when λ ≈ obstacle size)
• **Polarization:** transverse wave property (light is transverse, sound is not)
**Refractive Index:** μ = c/v = sin i/sin r (Snell's Law)
💡 **JEE Tip:** In YDSE, shifting one slit source by x causes central fringe to shift by xD/d."""

        # Subject-level generic response (better than one generic for all)
        subject_responses = {
            "Physics": f"""**Physics — {question[:60]}...**

**Approach:**
1. Identify the physics principle involved (Newton's Laws / Energy / Waves / EM)
2. Draw a diagram or Free Body Diagram
3. List all known and unknown quantities with units
4. Apply the relevant formula step by step
5. Check units and sign conventions

**Key Formulas to Review:** F=ma, KE=½mv², PE=mgh, V=IR, E=hf

💡 **JEE Tip:** For this type, focus on identifying which fundamental principle applies first, then the math follows naturally.""",

            "Chemistry": f"""**Chemistry — {question[:60]}...**

**Approach:**
1. Identify: Organic / Inorganic / Physical Chemistry
2. Write the balanced chemical equation if applicable
3. Apply relevant concept (Kc, Kp, Mole concept, Reaction mechanism)
4. Show step-by-step working

**Key Areas:** Mole concept, Equilibrium, Reaction mechanisms, Periodic trends

💡 **NEET/JEE Tip:** For reaction-based questions, always identify the type first (SN1/SN2, Elimination, Addition) before predicting products.""",

            "Mathematics": f"""**Mathematics — {question[:60]}...**

**Approach:**
1. Identify the mathematical concept (Algebra / Calculus / Coordinate Geometry)
2. Write down what's given and what to find
3. Apply the relevant theorem or formula
4. Verify your answer by substituting back

**Key Formulas:** Quadratic formula, Derivatives, Integration, Binomial theorem

💡 **JEE Tip:** For MCQs, always verify by plugging in answer choices — eliminates algebraic errors.""",

            "UPSC": f"""**UPSC — {question[:60]}...**

**Approach:**
1. Understand the core concept (Polity / Economy / History / Geography)
2. Connect to recent current affairs if applicable
3. Structure your answer: Introduction → Body → Conclusion
4. Include relevant data, acts, articles, or case studies

💡 **UPSC Tip:** For Mains, use the PEEL structure: Point → Explain → Evidence → Link back to question.""",
        }

        return subject_responses.get(subject, f"""**NeuroLearn AI — Answer for: "{question[:60]}..."**

**Step-by-Step Approach:**
1. **Identify the concept** — What topic/chapter does this belong to?
2. **Recall the formula/principle** — Write down relevant equations
3. **Substitute values** — Plug in given data with correct units
4. **Solve step by step** — Show working clearly
5. **Verify** — Check if answer makes physical/mathematical sense

💡 **Study Tip:** Search for this exact topic in your {subject} syllabus and solve 5 similar problems from previous year papers to master it.

> **Note:** Add your Gemini API key to `backend/.env` for detailed AI-generated answers specific to any question!""")

    # ─── Fallback Study Plan ─────────────────────────────────────────────────

    def _fallback_plan(self, exam: str, weak_subjects: list, hours: float) -> dict:
        subjects = weak_subjects if weak_subjects else ["Physics", "Chemistry", "Mathematics"]
        s0 = subjects[0]
        s1 = subjects[1] if len(subjects) > 1 else "Chemistry"
        s2 = subjects[-1] if len(subjects) > 2 else "Mathematics"

        days = [
            ("Monday", [
                {"time": "6:00 AM", "subject": s0, "topic": "Core Concepts & Theory", "duration": "90 min", "type": "Study"},
                {"time": "8:00 AM", "subject": s1, "topic": "Key Formulas & Reactions", "duration": "75 min", "type": "Study"},
                {"time": "3:00 PM", "subject": s2, "topic": "Problem Solving", "duration": "90 min", "type": "Practice"},
                {"time": "8:00 PM", "subject": s0, "topic": "Numerical Practice", "duration": "60 min", "type": "Revision"},
            ]),
            ("Tuesday", [
                {"time": "6:00 AM", "subject": s2, "topic": "Advanced Topics", "duration": "90 min", "type": "Study"},
                {"time": "8:30 AM", "subject": s0, "topic": "Formula Revision", "duration": "60 min", "type": "Revision"},
                {"time": "3:00 PM", "subject": s1, "topic": "Past Year Questions", "duration": "90 min", "type": "Practice"},
                {"time": "8:00 PM", "subject": "All", "topic": "Mini Mock Test", "duration": "60 min", "type": "Test"},
            ]),
            ("Wednesday", [
                {"time": "6:00 AM", "subject": s1, "topic": "Theory & Concepts", "duration": "90 min", "type": "Study"},
                {"time": "8:00 AM", "subject": s2, "topic": "Standard Problems", "duration": "75 min", "type": "Practice"},
                {"time": "3:00 PM", "subject": s0, "topic": "Weak Topics Deep Dive", "duration": "90 min", "type": "Study"},
                {"time": "7:30 PM", "subject": "All", "topic": "Formula Sheet Review", "duration": "45 min", "type": "Revision"},
            ]),
            ("Thursday", [
                {"time": "6:00 AM", "subject": s0, "topic": "Previous Year Questions", "duration": "90 min", "type": "Practice"},
                {"time": "8:30 AM", "subject": s1, "topic": "Concept Clearing", "duration": "75 min", "type": "Practice"},
                {"time": "3:00 PM", "subject": s2, "topic": "New Chapter", "duration": "90 min", "type": "Study"},
                {"time": "8:00 PM", "subject": "All", "topic": "Full Mock Test", "duration": "180 min", "type": "Test"},
            ]),
            ("Friday", [
                {"time": "6:00 AM", "subject": s2, "topic": "Test Analysis & Corrections", "duration": "60 min", "type": "Revision"},
                {"time": "7:30 AM", "subject": s0, "topic": "Error Log Review", "duration": "60 min", "type": "Revision"},
                {"time": "3:00 PM", "subject": s1, "topic": "Concept Clearing Session", "duration": "90 min", "type": "Study"},
                {"time": "8:00 PM", "subject": "All", "topic": "Spaced Repetition Revision", "duration": "60 min", "type": "Revision"},
            ]),
            ("Saturday", [
                {"time": "7:00 AM", "subject": "All", "topic": "Full Mock Test", "duration": "180 min", "type": "Test"},
                {"time": "11:00 AM", "subject": "All", "topic": "Detailed Test Analysis", "duration": "90 min", "type": "Revision"},
                {"time": "3:00 PM", "subject": s0, "topic": "Hardest Chapter Focus", "duration": "90 min", "type": "Study"},
            ]),
            ("Sunday", [
                {"time": "8:00 AM", "subject": "All", "topic": "Weekly Revision", "duration": "90 min", "type": "Revision"},
                {"time": "10:00 AM", "subject": "All", "topic": "Doubt Clearing Session", "duration": "60 min", "type": "Study"},
                {"time": "Evening", "subject": "--", "topic": "Relax & Recharge", "duration": "Rest", "type": "Rest"},
            ]),
        ]

        alloc = {s: round(100 / len(subjects)) for s in subjects}
        tips = [
            f"{s0} needs most attention — prioritise conceptual clarity before numericals.",
            "Take a full mock test every Thursday and Saturday to benchmark your real rank.",
            "Use spaced repetition: review formulas every 3rd day for maximum retention.",
            "Analyse every wrong answer in detail — understanding mistakes beats solving more problems.",
        ]
        return {"plan": [{"day": d, "slots": s} for d, s in days], "tips": tips, "time_allocation": alloc}


# Singleton
ai_service = AIService()
