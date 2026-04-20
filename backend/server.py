from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone

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
    q: str
    options: List[str]


class Subject(BaseModel):
    code: str
    name: str
    color: str
    duration_min: int
    num_questions: int
    desc: str


class StartQuizResponse(BaseModel):
    session_id: str
    subject_code: str
    subject_name: str
    duration_min: int
    num_questions: int
    questions: List[QuestionPublic]


class SubmitQuizRequest(BaseModel):
    session_id: str
    answers: Dict[str, Optional[int]]  # question_id -> selected option index (or None)
    time_taken_sec: int = 0


class ReviewItem(BaseModel):
    id: str
    q: str
    options: List[str]
    correct: int
    selected: Optional[int]
    is_correct: bool
    explanation: str


class SubmitQuizResponse(BaseModel):
    session_id: str
    subject_code: str
    subject_name: str
    score: int
    total: int
    percentage: float
    correct_count: int
    wrong_count: int
    unattempted: int
    time_taken_sec: int
    review: List[ReviewItem]


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


def _build_question_pool(code: str) -> List[dict]:
    """Return list of questions (with correct answers) including a synthetic id."""
    if code == "MOCK":
        pool = []
        for subj_code, qs in QUESTIONS.items():
            for idx, q in enumerate(qs):
                pool.append({"id": f"{subj_code}-{idx}", **q})
        return pool
    qs = QUESTIONS.get(code, [])
    return [{"id": f"{code}-{idx}", **q} for idx, q in enumerate(qs)]


# -----------------------------
# Routes
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


@api_router.get("/quiz/start/{code}", response_model=StartQuizResponse)
async def start_quiz(code: str):
    code = code.upper()
    meta = _get_subject_meta(code)
    if not meta:
        raise HTTPException(status_code=404, detail="Subject not found")

    pool = _build_question_pool(code)
    num = meta["num_questions"]
    selected = random.sample(pool, min(num, len(pool)))

    session_id = str(uuid.uuid4())
    # Persist answer key (so we can verify on submit even if user tampers)
    session_doc = {
        "session_id": session_id,
        "subject_code": code,
        "subject_name": meta["name"],
        "duration_min": meta["duration_min"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "questions": selected,  # includes a, exp
        "submitted": False,
    }
    await db.quiz_sessions.insert_one(session_doc)

    public_qs = [QuestionPublic(id=q["id"], q=q["q"], options=q["options"]) for q in selected]

    return StartQuizResponse(
        session_id=session_id,
        subject_code=code,
        subject_name=meta["name"],
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
                q=q["q"],
                options=q["options"],
                correct=q["a"],
                selected=selected,
                is_correct=is_correct,
                explanation=q.get("exp", ""),
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
        score=correct_count,
        total=total,
        percentage=percentage,
        correct_count=correct_count,
        wrong_count=wrong,
        unattempted=unattempted,
        time_taken_sec=payload.time_taken_sec,
        review=review,
    )


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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
