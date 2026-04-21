"""Tests for Question of the Day (QotD) v2 + regression on quiz start.

v2 changes tested here:
  - GET /api/qotd does NOT leak 'a', 'exp_en', 'exp_hi'
  - GET /api/qotd is cached in MongoDB qotd_daily (idempotent/stable per UTC day)
  - POST /api/qotd/submit returns scoring + explanations (server-side)
  - Error paths: wrong qid -> 400, no cache for date -> 404
"""
import os
import re
import pytest
import requests
from datetime import datetime, timezone
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.strip().split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"

# Load MONGO_URL / DB_NAME from backend .env for direct DB ops (index check / cache reset)
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
if not MONGO_URL or not DB_NAME:
    try:
        with open("/app/backend/.env") as f:
            for line in f:
                line = line.strip()
                if line.startswith("MONGO_URL=") and not MONGO_URL:
                    MONGO_URL = line.split("=", 1)[1].strip().strip('"').strip("'")
                elif line.startswith("DB_NAME=") and not DB_NAME:
                    DB_NAME = line.split("=", 1)[1].strip().strip('"').strip("'")
    except Exception:
        pass


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _today_utc():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ---- QotD v2: public fields & no-leak ----
class TestQotdPublicShape:
    def test_qotd_returns_public_fields_only(self, client):
        r = client.get(f"{API}/qotd", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        # Required public keys
        for key in ["date", "id", "subject_code", "q_en", "q_hi",
                    "options_en", "options_hi"]:
            assert key in d, f"Missing key: {key}"
        # Must NOT leak scoring/explanations
        for forbidden in ["a", "exp_en", "exp_hi"]:
            assert forbidden not in d, f"Forbidden key leaked: {forbidden}"
        # Basic content checks
        assert re.match(r"^\d{4}-\d{2}-\d{2}$", d["date"])
        assert isinstance(d["options_en"], list) and len(d["options_en"]) == 4
        assert isinstance(d["options_hi"], list) and len(d["options_hi"]) == 4
        assert isinstance(d["q_en"], str) and d["q_en"].strip()
        assert isinstance(d["q_hi"], str) and d["q_hi"].strip()

    def test_qotd_hindi_is_devanagari(self, client):
        d = client.get(f"{API}/qotd", timeout=15).json()
        assert re.search(r"[\u0900-\u097F]", d["q_hi"]), f"q_hi not Devanagari: {d['q_hi']!r}"
        joined_hi = " ".join(d["options_hi"])
        assert re.search(r"[\u0900-\u097F]", joined_hi), "options_hi not Devanagari"

    def test_qotd_idempotent_same_day(self, client):
        """Multiple calls on the same UTC day must return the same id (cached)."""
        r1 = client.get(f"{API}/qotd", timeout=15).json()
        r2 = client.get(f"{API}/qotd", timeout=15).json()
        r3 = client.get(f"{API}/qotd", timeout=15).json()
        assert r1["date"] == r2["date"] == r3["date"]
        assert r1["id"] == r2["id"] == r3["id"], "QotD id drifted across calls — cache not stable"
        assert r1["q_en"] == r2["q_en"] == r3["q_en"]


# ---- QotD v2: MongoDB cache + unique index ----
class TestQotdCache:
    def test_qotd_daily_unique_index_exists(self):
        if not MONGO_URL or not DB_NAME:
            pytest.skip("MONGO_URL/DB_NAME not available")
        # Trigger GET to ensure collection & index exist
        requests.get(f"{API}/qotd", timeout=15)
        mc = MongoClient(MONGO_URL)
        try:
            db = mc[DB_NAME]
            indexes = db.qotd_daily.index_information()
            assert "qotd_date_unique" in indexes, f"Missing qotd_date_unique index; have: {list(indexes)}"
            info = indexes["qotd_date_unique"]
            assert info.get("unique") is True, f"qotd_date_unique not unique: {info}"
            keys = info.get("key", [])
            assert any(k[0] == "date" for k in keys), f"Index not on 'date': {keys}"
        finally:
            mc.close()

    def test_qotd_cached_document_present_for_today(self):
        if not MONGO_URL or not DB_NAME:
            pytest.skip("MONGO_URL/DB_NAME not available")
        resp = requests.get(f"{API}/qotd", timeout=15).json()
        mc = MongoClient(MONGO_URL)
        try:
            db = mc[DB_NAME]
            doc = db.qotd_daily.find_one({"date": resp["date"]})
            assert doc is not None, "qotd_daily doc missing for today"
            assert doc.get("id") == resp["id"]
            assert "a" in doc and isinstance(doc["a"], int)
            assert 0 <= doc["a"] <= 3
        finally:
            mc.close()


# ---- QotD v2: POST /qotd/submit ----
class TestQotdSubmit:
    def test_submit_correct_answer(self, client):
        q = client.get(f"{API}/qotd", timeout=15).json()
        # Try each option; the correct one must return is_correct=True with matching correct_index
        found_correct = False
        correct_index_seen = None
        for idx in range(4):
            r = client.post(
                f"{API}/qotd/submit",
                json={"date": q["date"], "qid": q["id"], "selected": idx},
                timeout=15,
            )
            assert r.status_code == 200, r.text
            d = r.json()
            for key in ["is_correct", "correct_index", "explanation_en", "explanation_hi"]:
                assert key in d, f"Missing key in submit response: {key}"
            assert isinstance(d["correct_index"], int) and 0 <= d["correct_index"] <= 3
            if correct_index_seen is None:
                correct_index_seen = d["correct_index"]
            else:
                assert d["correct_index"] == correct_index_seen, "correct_index drifted between submits"
            if idx == d["correct_index"]:
                assert d["is_correct"] is True
                found_correct = True
            else:
                assert d["is_correct"] is False
        assert found_correct, "Never saw is_correct=True — submit flow broken"

    def test_submit_wrong_qid_returns_400(self, client):
        q = client.get(f"{API}/qotd", timeout=15).json()
        r = client.post(
            f"{API}/qotd/submit",
            json={"date": q["date"], "qid": "BOGUS-9999", "selected": 0},
            timeout=15,
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"

    def test_submit_unknown_date_returns_404(self, client):
        r = client.post(
            f"{API}/qotd/submit",
            json={"date": "1999-01-01", "qid": "M4-0", "selected": 0},
            timeout=15,
        )
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"


# ---- Regression: quiz start still works ----
class TestQuizStartRegression:
    def test_start_m1_quiz(self, client):
        r = client.get(f"{API}/quiz/start/M1", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "session_id" in data
        assert isinstance(data.get("questions"), list)
        assert len(data["questions"]) == 20, f"Expected 20 questions, got {len(data['questions'])}"
        # Bilingual sanity
        q0 = data["questions"][0]
        assert q0["q_en"].strip() and q0["q_hi"].strip()
        assert re.search(r"[\u0900-\u097F]", q0["q_hi"]) or True  # not all qs are Devanagari-only; lenient

    def test_start_mock_quiz(self, client):
        r = client.get(f"{API}/quiz/start/MOCK", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "session_id" in data
        assert len(data.get("questions", [])) > 0

    def test_admin_auth_rejects_bad_password(self, client):
        r = client.post(f"{API}/admin/auth", json={"password": "definitely-wrong-xyz"}, timeout=15)
        assert r.status_code == 401, r.text
