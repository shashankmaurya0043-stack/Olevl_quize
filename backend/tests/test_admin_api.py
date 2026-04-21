"""Backend tests for the hidden admin question-upload tool (/api/admin/*).

Covers: auth, parse (text + image), save, list, stats, delete, and quiz-pool merge.
"""
import base64
import io
import os
import time

import pytest
import requests
from PIL import Image, ImageDraw, ImageFont

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_PWD = "olevel-admin-7dc75d34"  # from backend/.env
HDR = {"X-Admin-Password": ADMIN_PWD}

# Track created IDs for cleanup
_created_ids: list[str] = []


@pytest.fixture(scope="module")
def s():
    ses = requests.Session()
    ses.headers.update({"Content-Type": "application/json"})
    yield ses
    # Cleanup
    for qid in _created_ids:
        try:
            ses.delete(f"{API}/admin/question/{qid}", headers=HDR, timeout=15)
        except Exception:
            pass


def _make_mcq_png_b64() -> str:
    """Build a small PNG with real textual content of an MCQ."""
    img = Image.new("RGB", (600, 260), color=(250, 250, 245))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    except Exception:
        font = ImageFont.load_default()
    lines = [
        "Q: What does CPU stand for?",
        "A) Central Processing Unit",
        "B) Computer Personal Unit",
        "C) Central Print Unit",
        "D) Control Processing Unit",
        "Answer: A",
    ]
    y = 15
    for ln in lines:
        draw.text((18, y), ln, fill=(10, 10, 10), font=font)
        y += 36
    # Add some visual variance (a border)
    draw.rectangle([(2, 2), (597, 257)], outline=(0, 0, 0), width=3)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


# -------------- AUTH --------------
class TestAdminAuth:
    def test_auth_correct_password(self, s):
        r = s.post(f"{API}/admin/auth", json={"password": ADMIN_PWD}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_auth_wrong_password(self, s):
        r = s.post(f"{API}/admin/auth", json={"password": "nope"}, timeout=15)
        assert r.status_code == 401

    def test_protected_endpoint_without_header(self, s):
        r = s.get(f"{API}/admin/list", timeout=15)
        assert r.status_code == 401
        r2 = s.get(f"{API}/admin/stats", timeout=15)
        assert r2.status_code == 401
        r3 = s.post(f"{API}/admin/parse", json={"mode": "text", "content": "x"}, timeout=15)
        assert r3.status_code == 401


# -------------- PARSE (text) --------------
class TestAdminParseText:
    def test_parse_text_returns_bilingual_mcq(self, s):
        text = ("Q: What is the full form of HTML? "
                "A) Hyper Text Markup Language "
                "B) High Text Machine Language "
                "C) Hyper Tabular Markup Language "
                "D) None. Ans: A")
        r = s.post(
            f"{API}/admin/parse",
            json={"mode": "text", "content": text},
            headers=HDR,
            timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "questions" in data and len(data["questions"]) >= 1
        q = data["questions"][0]
        # Required bilingual fields
        for k in ("q_en", "q_hi", "options_en", "options_hi", "a", "exp_en", "exp_hi"):
            assert k in q
        assert len(q["options_en"]) == 4
        assert len(q["options_hi"]) == 4
        assert 0 <= q["a"] <= 3
        # Correct answer should be index 0 (HTML=A)
        assert q["a"] == 0
        # Hindi must be in Devanagari (at least some chars in 0x0900-0x097F)
        assert any("\u0900" <= ch <= "\u097F" for ch in q["q_hi"]), f"Hindi missing Devanagari: {q['q_hi']!r}"


# -------------- PARSE (image) --------------
class TestAdminParseImage:
    def test_parse_image_returns_mcq(self, s):
        b64 = _make_mcq_png_b64()
        r = s.post(
            f"{API}/admin/parse",
            json={"mode": "image", "content": b64},
            headers=HDR,
            timeout=120,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert len(data["questions"]) >= 1
        q = data["questions"][0]
        assert len(q["options_en"]) == 4 and len(q["options_hi"]) == 4
        # CPU question should mention CPU/processing
        blob = (q["q_en"] + " " + " ".join(q["options_en"])).lower()
        assert "cpu" in blob or "central" in blob or "processing" in blob


# -------------- SAVE / LIST / STATS / DELETE / MERGE --------------
class TestAdminCrud:
    @pytest.fixture(scope="class")
    def saved_id(self, s):
        payload = {
            "subject_code": "M1",
            "questions": [
                {
                    "q_en": "TEST_ADM What is the output of 2+2 in Python?",
                    "q_hi": "TEST_ADM पायथन में 2+2 का परिणाम क्या है?",
                    "options_en": ["3", "4", "22", "Error"],
                    "options_hi": ["३", "४", "२२", "त्रुटि"],
                    "a": 1,
                    "exp_en": "2+2 equals 4.",
                    "exp_hi": "२+२ = ४ होता है।",
                }
            ],
        }
        r = s.post(f"{API}/admin/save", json=payload, headers=HDR, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["ok"] is True
        assert body["saved"] == 1
        assert len(body["ids"]) == 1
        qid = body["ids"][0]
        assert qid.startswith("ADM-")
        _created_ids.append(qid)
        return qid

    def test_save_rejects_invalid_subject(self, s):
        r = s.post(
            f"{API}/admin/save",
            json={"subject_code": "X9", "questions": []},
            headers=HDR,
            timeout=15,
        )
        assert r.status_code == 400

    def test_list_contains_saved(self, s, saved_id):
        r = s.get(f"{API}/admin/list", headers=HDR, timeout=20)
        assert r.status_code == 200
        ids = [q["id"] for q in r.json()["questions"]]
        assert saved_id in ids

    def test_list_filter_by_subject(self, s, saved_id):
        r = s.get(f"{API}/admin/list", headers=HDR, params={"subject": "M1"}, timeout=20)
        assert r.status_code == 200
        docs = r.json()["questions"]
        assert any(d["id"] == saved_id and d["subject_code"] == "M1" for d in docs)

    def test_stats_counts_positive(self, s, saved_id):
        r = s.get(f"{API}/admin/stats", headers=HDR, timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert "counts" in body and "total" in body
        assert body["counts"]["M1"] >= 1
        assert body["total"] >= 1

    def test_quiz_start_still_returns_20_after_admin_insert(self, s, saved_id):
        # Merge shouldn't break /api/quiz/start
        r = s.get(f"{API}/quiz/start/M1", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["num_questions"] == 20
        assert len(body["questions"]) == 20
        for q in body["questions"]:
            assert "q_en" in q and "q_hi" in q
            assert len(q["options_en"]) == 4 and len(q["options_hi"]) == 4

    def test_delete_admin_question(self, s, saved_id):
        r = s.delete(f"{API}/admin/question/{saved_id}", headers=HDR, timeout=15)
        assert r.status_code == 200
        # Remove from cleanup list since already deleted
        if saved_id in _created_ids:
            _created_ids.remove(saved_id)
        # GET list should no longer contain it
        time.sleep(0.3)
        r2 = s.get(f"{API}/admin/list", headers=HDR, timeout=20)
        ids = [q["id"] for q in r2.json()["questions"]]
        assert saved_id not in ids
        # Deleting again -> 404
        r3 = s.delete(f"{API}/admin/question/{saved_id}", headers=HDR, timeout=15)
        assert r3.status_code == 404
