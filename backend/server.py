from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import uuid
import re
import hashlib
import json as _json
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Literal
from datetime import datetime, timezone

#from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

from questions import QUESTIONS, SUBJECTS, MOCK_TEST

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# -----------------------------
# Pydantic Models
# -----------------------------
class QuestionPublic(BaseModel):
    id: str
    q_en: str
    q_hi: str
    options_en: List[str]
    options_hi: List[str]


class Subject(BaseModel):
    code: str
    name: str
    name_hi: str
    color: str
    duration_min: int
    num_questions: int
    desc: str
    desc_hi: str


class StartQuizResponse(BaseModel):
    session_id: str
    subject_code: str
    subject_name: str
    subject_name_hi: str
    duration_min: int
    num_questions: int
    questions: List[QuestionPublic]


class SubmitQuizRequest(BaseModel):
    session_id: str
    answers: Dict[str, Optional[int]]
    time_taken_sec: int = 0


class ReviewItem(BaseModel):
    id: str
    q_en: str
    q_hi: str
    options_en: List[str]
    options_hi: List[str]
    correct: int
    selected: Optional[int]
    is_correct: bool
    explanation_en: str
    explanation_hi: str


class SubmitQuizResponse(BaseModel):
    session_id: str
    subject_code: str
    subject_name: str
    subject_name_hi: str
    score: int
    total: int
    percentage: float
    correct_count: int
    wrong_count: int
    unattempted: int
    time_taken_sec: int
    review: List[ReviewItem]


# ---- Admin models ----
class AdminAuthRequest(BaseModel):
    password: str


class ParsedMCQ(BaseModel):
    q_en: str
    q_hi: str
    options_en: List[str]
    options_hi: List[str]
    a: int
    exp_en: str = ""
    exp_hi: str = ""


class ParseRequest(BaseModel):
    mode: Literal["image", "text"]
    content: str
    translate_to_hindi: bool = True


class ParseResponse(BaseModel):
    questions: List[ParsedMCQ]


class SaveRequest(BaseModel):
    subject_code: str
    questions: List[ParsedMCQ]


# -----------------------------
# Helpers
# -----------------------------
def _get_subject_meta(code: str):
    for s in SUBJECTS:
        if s["code"] == code:
            return s
    if code == "MOCK":
        return MOCK_TEST
    return None


async def _build_question_pool(code: str) -> List[dict]:
    """Merge static question bank with admin-added questions from MongoDB."""
    pool: List[dict] = []
    if code == "MOCK":
        for subj_code, qs in QUESTIONS.items():
            for idx, q in enumerate(qs):
                pool.append({"id": f"{subj_code}-{idx}", **q})
        admin_docs = await db.admin_questions.find({}, {"_id": 0}).to_list(5000)
        for doc in admin_docs:
            pool.append(_admin_doc_to_question(doc))
    else:
        qs = QUESTIONS.get(code, [])
        for idx, q in enumerate(qs):
            pool.append({"id": f"{code}-{idx}", **q})
        admin_docs = await db.admin_questions.find(
            {"subject_code": code}, {"_id": 0}
        ).to_list(5000)
        for doc in admin_docs:
            pool.append(_admin_doc_to_question(doc))
    return pool


def _admin_doc_to_question(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "q_en": doc["q_en"],
        "q_hi": doc["q_hi"],
        "options_en": doc["options_en"],
        "options_hi": doc["options_hi"],
        "a": doc["a"],
        "exp_en": doc.get("exp_en", ""),
        "exp_hi": doc.get("exp_hi", ""),
    }


# ---- Admin auth dependency ----
def verify_admin(x_admin_password: Optional[str] = Header(None)):
    expected = os.environ.get("ADMIN_PASSWORD")
    if not expected or x_admin_password != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


# ---- LLM parsing ----
SYSTEM_PROMPT = (
    "You are an expert MCQ extractor for Indian O Level (NIELIT) exams. "
    "You convert input text or images into structured bilingual MCQs (English + Devanagari Hindi). "
    "Always return ONLY a valid JSON array, no prose, no markdown fences."
)

USER_PROMPT = """Extract one or more MCQs from the given input.

For EACH question, return an object with EXACTLY these fields:
  - q_en: question text in English
  - q_hi: question text in proper Devanagari Hindi (not transliteration)
  - options_en: array of EXACTLY 4 English option strings
  - options_hi: array of EXACTLY 4 Hindi option strings (Devanagari)
  - a: integer index 0..3 of the correct option
  - exp_en: one-sentence English explanation
  - exp_hi: one-sentence Hindi explanation (Devanagari)

Rules:
- If fewer than 4 options are provided, generate plausible distractors.
- If the correct answer is not given, choose the most accurate one using your knowledge.
- Keep questions factual, exam-style, concise.
- The Hindi options' order must match the English options' order.
- Do NOT include markdown code fences or any commentary.
- Return ONLY a JSON array: [ {...}, {...} ]

Input:
"""


async def _llm_parse(mode: str, content: str) -> List[dict]:
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(500, "EMERGENT_LLM_KEY not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=SYSTEM_PROMPT,
    ).with_model("gemini", "gemini-3-flash-preview")

    if mode == "image":
        raw_b64 = content.split(",", 1)[1] if content.startswith("data:") else content
        msg = UserMessage(
            text=USER_PROMPT + "[Image attached]",
            file_contents=[ImageContent(image_base64=raw_b64)],
        )
    else:
        msg = UserMessage(text=USER_PROMPT + content)

    try:
        response = await chat.send_message(msg)
    except Exception as e:
        detail = str(e)
        if "budget" in detail.lower() or "rate" in detail.lower():
            raise HTTPException(
                502, "AI service temporarily unavailable (budget/rate limit). Try again shortly."
            )
        raise HTTPException(502, f"AI service error: {detail[:200]}")
    cleaned = response.strip()
    # strip markdown fences if any
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    match = re.search(r"\[[\s\S]*\]", cleaned)
    if not match:
        raise HTTPException(502, f"LLM response was not a JSON array: {response[:300]}")
    try:
        data = _json.loads(match.group(0))
    except _json.JSONDecodeError as e:
        raise HTTPException(502, f"LLM JSON parse failed: {e}")
    if not isinstance(data, list):
        raise HTTPException(502, "LLM did not return a list")
    return data


def _normalize_mcq(q: dict) -> dict:
    opts_en = list(q.get("options_en") or q.get("options") or [])
    opts_hi = list(q.get("options_hi") or [])
    while len(opts_en) < 4:
        opts_en.append("None of these")
    while len(opts_hi) < 4:
        opts_hi.append(opts_en[len(opts_hi)] if len(opts_hi) < len(opts_en) else "इनमें से कोई नहीं")
    try:
        a = int(q.get("a", 0))
    except (TypeError, ValueError):
        a = 0
    a = max(0, min(3, a))
    return {
        "q_en": (q.get("q_en") or "").strip(),
        "q_hi": (q.get("q_hi") or "").strip(),
        "options_en": [str(o).strip() for o in opts_en[:4]],
        "options_hi": [str(o).strip() for o in opts_hi[:4]],
        "a": a,
        "exp_en": (q.get("exp_en") or "").strip(),
        "exp_hi": (q.get("exp_hi") or "").strip(),
    }


def _normalize_q_en(s: str) -> str:
    """Trim, collapse whitespace, lowercase for dedup comparison."""
    return " ".join((s or "").strip().lower().split())


# -----------------------------
# Routes: public
# -----------------------------
@api_router.get("/")
async def root():
    return {"message": "O Level Quiz API is running"}


@api_router.get("/subjects", response_model=List[Subject])
async def list_subjects():
    return [Subject(**s) for s in SUBJECTS]


@api_router.get("/mock-test-info")
async def mock_info():
    return MOCK_TEST


class QotdSubmitRequest(BaseModel):
    date: str
    qid: str
    selected: int


@api_router.get("/qotd")
async def question_of_the_day():
    """Deterministic Question of the Day — cached in qotd_daily once per UTC day.
    Correct answer index and explanations are NEVER returned here; clients must
    POST /api/qotd/submit to get scoring.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    cached = await db.qotd_daily.find_one({"date": today}, {"_id": 0})
    if cached:
        return {
            "date": cached["date"],
            "id": cached["id"],
            "subject_code": cached.get("subject_code", ""),
            "q_en": cached["q_en"],
            "q_hi": cached["q_hi"],
            "options_en": cached["options_en"],
            "options_hi": cached["options_hi"],
        }

    # First call of the day → pick & cache
    pool: List[dict] = []
    for subj_code, qs in QUESTIONS.items():
        for idx, q in enumerate(qs):
            pool.append({"id": f"{subj_code}-{idx}", "subject_code": subj_code, **q})
    admin_docs = await db.admin_questions.find({}, {"_id": 0}).to_list(5000)
    for doc in admin_docs:
        pool.append({
            "id": doc["id"],
            "subject_code": doc.get("subject_code", ""),
            "q_en": doc["q_en"],
            "q_hi": doc["q_hi"],
            "options_en": doc["options_en"],
            "options_hi": doc["options_hi"],
            "a": doc["a"],
            "exp_en": doc.get("exp_en", ""),
            "exp_hi": doc.get("exp_hi", ""),
        })

    if not pool:
        raise HTTPException(404, "No questions available")

    seed = int(hashlib.md5(today.encode()).hexdigest(), 16)
    chosen = pool[seed % len(pool)]
    cache_doc = {
        "date": today,
        "id": chosen["id"],
        "subject_code": chosen.get("subject_code", ""),
        "q_en": chosen["q_en"],
        "q_hi": chosen["q_hi"],
        "options_en": chosen["options_en"],
        "options_hi": chosen["options_hi"],
        "a": chosen["a"],
        "exp_en": chosen.get("exp_en", ""),
        "exp_hi": chosen.get("exp_hi", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.qotd_daily.insert_one(cache_doc)
    except Exception:
        # Concurrent insert: re-read the cached one
        cached = await db.qotd_daily.find_one({"date": today}, {"_id": 0})
        if cached:
            return {
                "date": cached["date"],
                "id": cached["id"],
                "subject_code": cached.get("subject_code", ""),
                "q_en": cached["q_en"],
                "q_hi": cached["q_hi"],
                "options_en": cached["options_en"],
                "options_hi": cached["options_hi"],
            }
        raise

    return {
        "date": cache_doc["date"],
        "id": cache_doc["id"],
        "subject_code": cache_doc["subject_code"],
        "q_en": cache_doc["q_en"],
        "q_hi": cache_doc["q_hi"],
        "options_en": cache_doc["options_en"],
        "options_hi": cache_doc["options_hi"],
    }


@api_router.post("/qotd/submit")
async def submit_qotd(payload: QotdSubmitRequest):
    cached = await db.qotd_daily.find_one({"date": payload.date}, {"_id": 0})
    if not cached:
        raise HTTPException(404, "No QotD cached for that date")
    if cached["id"] != payload.qid:
        raise HTTPException(400, "Question ID does not match today's QotD")
    correct_index = int(cached["a"])
    is_correct = int(payload.selected) == correct_index
    return {
        "ok": True,
        "is_correct": is_correct,
        "correct_index": correct_index,
        "explanation_en": cached.get("exp_en", ""),
        "explanation_hi": cached.get("exp_hi", ""),
    }


@api_router.get("/quiz/start/{code}", response_model=StartQuizResponse)
async def start_quiz(code: str):
    code = code.upper()
    meta = _get_subject_meta(code)
    if not meta:
        raise HTTPException(status_code=404, detail="Subject not found")

    pool = await _build_question_pool(code)
    num = meta["num_questions"]
    selected = random.sample(pool, min(num, len(pool)))

    session_id = str(uuid.uuid4())
    session_doc = {
        "session_id": session_id,
        "subject_code": code,
        "subject_name": meta["name"],
        "subject_name_hi": meta.get("name_hi", meta["name"]),
        "duration_min": meta["duration_min"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "questions": selected,
        "submitted": False,
    }
    await db.quiz_sessions.insert_one(session_doc)

    public_qs = [
        QuestionPublic(
            id=q["id"],
            q_en=q["q_en"],
            q_hi=q["q_hi"],
            options_en=q["options_en"],
            options_hi=q["options_hi"],
        )
        for q in selected
    ]
    return StartQuizResponse(
        session_id=session_id,
        subject_code=code,
        subject_name=meta["name"],
        subject_name_hi=meta.get("name_hi", meta["name"]),
        duration_min=meta["duration_min"],
        num_questions=len(selected),
        questions=public_qs,
    )


@api_router.post("/quiz/submit", response_model=SubmitQuizResponse)
async def submit_quiz(payload: SubmitQuizRequest):
    session = await db.quiz_sessions.find_one(
        {"session_id": payload.session_id}, {"_id": 0}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    questions = session["questions"]
    review: List[ReviewItem] = []
    correct_count = 0
    unattempted = 0

    for q in questions:
        qid = q["id"]
        selected = payload.answers.get(qid)
        is_correct = selected is not None and selected == q["a"]
        if selected is None:
            unattempted += 1
        if is_correct:
            correct_count += 1
        review.append(
            ReviewItem(
                id=qid,
                q_en=q["q_en"],
                q_hi=q["q_hi"],
                options_en=q["options_en"],
                options_hi=q["options_hi"],
                correct=q["a"],
                selected=selected,
                is_correct=is_correct,
                explanation_en=q.get("exp_en", ""),
                explanation_hi=q.get("exp_hi", ""),
            )
        )

    total = len(questions)
    wrong = total - correct_count - unattempted
    percentage = round((correct_count / total) * 100, 2) if total else 0.0

    await db.quiz_sessions.update_one(
        {"session_id": payload.session_id},
        {"$set": {
            "submitted": True,
            "score": correct_count,
            "total": total,
            "percentage": percentage,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "time_taken_sec": payload.time_taken_sec,
        }},
    )

    return SubmitQuizResponse(
        session_id=payload.session_id,
        subject_code=session["subject_code"],
        subject_name=session["subject_name"],
        subject_name_hi=session.get("subject_name_hi", session["subject_name"]),
        score=correct_count,
        total=total,
        percentage=percentage,
        correct_count=correct_count,
        wrong_count=wrong,
        unattempted=unattempted,
        time_taken_sec=payload.time_taken_sec,
        review=review,
    )


# -----------------------------
# Routes: admin
# -----------------------------
@api_router.post("/admin/auth")
async def admin_auth(payload: AdminAuthRequest):
    expected = os.environ.get("ADMIN_PASSWORD")
    if not expected or payload.password != expected:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"ok": True}


@api_router.post("/admin/parse", response_model=ParseResponse, dependencies=[Depends(verify_admin)])
async def admin_parse(payload: ParseRequest):
    raw = await _llm_parse(payload.mode, payload.content)
    return ParseResponse(questions=[ParsedMCQ(**_normalize_mcq(q)) for q in raw])


@api_router.post("/admin/save", dependencies=[Depends(verify_admin)])
async def admin_save(payload: SaveRequest):
    if payload.subject_code not in {"M1", "M2", "M3", "M4"}:
        raise HTTPException(400, "Invalid subject code")

    # Build set of existing normalized q_en for this subject
    existing = set()
    for q in QUESTIONS.get(payload.subject_code, []):
        existing.add(_normalize_q_en(q["q_en"]))
    existing_admin = await db.admin_questions.find(
        {"subject_code": payload.subject_code}, {"q_en": 1, "_id": 0}
    ).to_list(10000)
    for d in existing_admin:
        existing.add(_normalize_q_en(d.get("q_en", "")))

    docs = []
    skipped = []
    seen_in_batch = set()
    for q in payload.questions:
        norm = _normalize_q_en(q.q_en)
        if not norm:
            skipped.append({"q_en": q.q_en, "reason": "empty"})
            continue
        if norm in existing or norm in seen_in_batch:
            skipped.append({"q_en": q.q_en, "reason": "duplicate"})
            continue
        seen_in_batch.add(norm)
        qid = f"ADM-{uuid.uuid4().hex[:10]}"
        doc = {
            "id": qid,
            "subject_code": payload.subject_code,
            **q.model_dump(),
            "q_en_norm": norm,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        docs.append(doc)

    if docs:
        await db.admin_questions.insert_many(docs)

    return {
        "ok": True,
        "saved": len(docs),
        "skipped": len(skipped),
        "duplicates": [s["q_en"] for s in skipped if s["reason"] == "duplicate"],
        "ids": [d["id"] for d in docs],
    }


@api_router.get("/admin/list", dependencies=[Depends(verify_admin)])
async def admin_list(subject: Optional[str] = None):
    filt: dict = {}
    if subject:
        filt["subject_code"] = subject.upper()
    docs = (
        await db.admin_questions.find(filt, {"_id": 0}).sort("created_at", -1).to_list(1000)
    )
    return {"questions": docs, "count": len(docs)}


@api_router.delete("/admin/question/{qid}", dependencies=[Depends(verify_admin)])
async def admin_delete(qid: str):
    res = await db.admin_questions.delete_one({"id": qid})
    if res.deleted_count == 0:
        raise HTTPException(404, "Question not found")
    return {"ok": True, "deleted": res.deleted_count}


@api_router.get("/admin/stats", dependencies=[Depends(verify_admin)])
async def admin_stats():
    counts = {}
    for code in ("M1", "M2", "M3", "M4"):
        counts[code] = await db.admin_questions.count_documents({"subject_code": code})
    return {"counts": counts, "total": sum(counts.values())}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def _create_indexes():
    try:
        await db.admin_questions.create_index(
            [("subject_code", 1), ("q_en_norm", 1)],
            name="subject_qennorm_idx",
        )
        logger.info("admin_questions index ensured: subject_qennorm_idx")
    except Exception as e:
        logger.warning("Failed creating admin_questions index: %s", e)
    try:
        await db.qotd_daily.create_index("date", unique=True, name="qotd_date_unique")
        logger.info("qotd_daily index ensured: qotd_date_unique")
    except Exception as e:
        logger.warning("Failed creating qotd_daily index: %s", e)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
